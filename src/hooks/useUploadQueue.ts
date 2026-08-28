import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  attachReselectedFiles,
  classifyTransferFailure,
  createQueueEntry,
  createTransferDependencies,
  createUploadResumeStore,
  executeUploadTransfer,
  hydrateUploadQueue,
  MAX_QUEUE_FILES,
  MAX_UPLOAD_SESSION_ITEMS,
  patchQueueEntry,
  persistedRecord,
  replaceQueueAttempt,
  selectQueueCandidates,
  statusFromServer,
  validateFileSelection,
  type ActiveUploadSummary,
  type PatchUploadBody,
  type QueueEntryUpdate,
  type RejectedUploadFile,
  type UploadApi,
  type UploadQueueEntry,
  type UploadResumeStore,
} from '@basetube/api';
import { getBasetubeClient } from '../lib/basetubeClient';

/** Files transferring at the same time. The server admits 8 per user (§7.2). */
const ACTIVE_FILE_LIMIT = 4;
/** How often the queue asks the server what became of its uploads. */
const STATUS_POLL_MS = 10_000;
/** A finished row stays visible for a day so the creator sees the outcome. */
const FINISHED_ROW_TTL_MS = 24 * 60 * 60 * 1_000;
const PERSISTENCE_WARNING = 'This queue is running without reliable reload recovery.';

export interface UseUploadQueueOptions {
  api?: UploadApi;
  resumeStore?: UploadResumeStore;
}

export interface UploadQueueApi {
  entries: UploadQueueEntry[];
  paused: boolean;
  hydrated: boolean;
  persistenceError: string | null;
  selectionNotice: string | null;
  actionError: string | null;
  activeCount: number;
  remainingSessionSlots: number;
  setPaused: (paused: boolean) => void;
  enqueueFiles: (
    files: readonly File[],
    channelId: number,
  ) => Promise<{ accepted: UploadQueueEntry[]; rejected: RejectedUploadFile[] }>;
  reselectFiles: (files: readonly File[]) => Promise<void>;
  updateMetadata: (localId: string, patch: PatchUploadBody) => void;
  abortEntry: (localId: string) => Promise<void>;
  retryEntry: (localId: string) => Promise<void>;
  replaceAttempt: (localId: string) => Promise<void>;
  removeEntry: (localId: string) => Promise<void>;
}

const IN_FLIGHT_STATUSES = new Set<UploadQueueEntry['status']>([
  'queued',
  'reserving',
  'retry_wait',
  'uploading',
  'uploaded',
]);

/** Rows the server may still have news about. */
function needsPolling(entries: readonly UploadQueueEntry[]): boolean {
  return entries.some(
    (entry) =>
      entry.uploadId !== null &&
      (IN_FLIGHT_STATUSES.has(entry.status) ||
        entry.status === 'processing' ||
        (entry.videoId !== null && entry.videoStatus !== 'processed' && entry.videoStatus !== 'failed')),
  );
}

/**
 * The upload queue: one place that owns every in-flight upload for the tab.
 *
 * Ported from the AmazingAerial `useUploadQueue`, reduced to a single upload
 * row per file. The scheduler is deliberately a pure function
 * (`selectQueueCandidates`) so the concurrency rules can be tested without a
 * browser.
 */
export function useUploadQueue(options: UseUploadQueueOptions = {}): UploadQueueApi {
  const api = useMemo(() => options.api ?? getBasetubeClient().uploads, [options.api]);
  const transferDeps = useMemo(() => createTransferDependencies(api), [api]);
  const storeRef = useRef<UploadResumeStore>(options.resumeStore ?? createUploadResumeStore());
  const entriesRef = useRef<UploadQueueEntry[]>([]);
  const controllersRef = useRef(new Map<string, AbortController>());
  const activeIdsRef = useRef(new Set<string>());
  const abortingIdsRef = useRef(new Set<string>());
  const patchTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const [entries, setEntries] = useState<UploadQueueEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [schedulerRevision, setSchedulerRevision] = useState(0);
  const [admissionRetryAt, setAdmissionRetryAt] = useState<number | null>(null);
  const [admissionProbe, setAdmissionProbe] = useState(false);
  const [sessionUsedCount, setSessionUsedCount] = useState(0);
  const sessionUsedRef = useRef(0);
  const pollingWanted = needsPolling(entries);

  const replaceEntries = useCallback((next: UploadQueueEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
  }, []);

  const persist = useCallback(async (entry: UploadQueueEntry) => {
    try {
      await storeRef.current.put(persistedRecord(entry));
    } catch {
      setPersistenceError(PERSISTENCE_WARNING);
    }
  }, []);

  const forget = useCallback(async (localId: string) => {
    try {
      await storeRef.current.remove(localId);
    } catch {
      setPersistenceError(PERSISTENCE_WARNING);
    }
  }, []);

  const updateEntry = useCallback(
    async (localId: string, patch: Partial<UploadQueueEntry>, updateOptions: { persist?: boolean } = {}) => {
      const next = patchQueueEntry(entriesRef.current, localId, patch);
      const updated = next.find((entry) => entry.localId === localId);
      replaceEntries(next);
      if (updated && updateOptions.persist !== false) await persist(updated);
    },
    [persist, replaceEntries],
  );

  // ── boot: local records first, then reconcile against the server ─────────
  useEffect(() => {
    let cancelled = false;
    const controllers = controllersRef.current;
    const timers = patchTimersRef.current;

    void storeRef.current
      .list()
      .then(async (records) => {
        if (cancelled) return;
        const hydratedEntries = hydrateUploadQueue(records);
        sessionUsedRef.current = hydratedEntries.length;
        setSessionUsedCount(hydratedEntries.length);
        replaceEntries(hydratedEntries);

        try {
          const active = await api.listActive();
          if (cancelled) return;
          const byId = new Map(active.uploads.map((row) => [row.uploadId, row]));
          const survivors: UploadQueueEntry[] = [];
          for (const entry of entriesRef.current) {
            // A row the server has never heard of (or has already retired) is
            // dead weight; a row with no uploadId has not been created yet.
            if (entry.uploadId && !byId.has(entry.uploadId)) {
              await forget(entry.localId);
              continue;
            }
            const row = entry.uploadId ? byId.get(entry.uploadId) : undefined;
            survivors.push(row ? applyServerRow(entry, row) : entry);
          }
          sessionUsedRef.current = survivors.length;
          setSessionUsedCount(survivors.length);
          replaceEntries(survivors);
        } catch {
          // A transient API failure must not throw away resumable local state.
        }
      })
      .catch(() => {
        if (!cancelled) setPersistenceError('Upload resume storage is unavailable in this browser session.');
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
      controllers.forEach((controller) => controller.abort());
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [api, forget, replaceEntries]);

  const consumeSessionSlots = useCallback((count: number) => {
    if (count <= 0) return;
    sessionUsedRef.current += count;
    setSessionUsedCount(sessionUsedRef.current);
  }, []);

  const releaseSessionSlot = useCallback(() => {
    sessionUsedRef.current = Math.max(0, sessionUsedRef.current - 1);
    setSessionUsedCount(sessionUsedRef.current);
  }, []);

  const enqueueFiles = useCallback(
    async (files: readonly File[], channelId: number) => {
      const localActive = entriesRef.current.filter((entry) => entry.status !== 'aborted').length;
      const queueAvailable = MAX_QUEUE_FILES - localActive;
      const sessionRemaining = Math.max(0, MAX_UPLOAD_SESSION_ITEMS - sessionUsedRef.current);
      const available = Math.min(queueAvailable, sessionRemaining);
      const cap = sessionRemaining < queueAvailable ? 'session' : 'queue';
      const result = validateFileSelection(files, available, cap);
      const created = result.accepted.map((file) => createQueueEntry(channelId, file));

      consumeSessionSlots(created.length);
      replaceEntries([...entriesRef.current, ...created]);
      await Promise.all(created.map(persist));
      setSelectionNotice(
        result.rejected.length > 0
          ? `${created.length} queued; ${result.rejected.length} skipped. ${result.rejected[0]!.message}`
          : `${created.length} file${created.length === 1 ? '' : 's'} added to the upload queue.`,
      );
      return { accepted: created, rejected: result.rejected };
    },
    [consumeSessionSlots, persist, replaceEntries],
  );

  const reselectFiles = useCallback(
    async (files: readonly File[]) => {
      const result = attachReselectedFiles(entriesRef.current, files);
      replaceEntries(result.entries);
      await Promise.all(
        result.entries.filter((entry) => entry.file && entry.status === 'queued').map(persist),
      );
      setSelectionNotice(
        result.unmatched.length > 0
          ? `${result.attached} matched; ${result.unmatched.length} did not match a paused upload.`
          : `${result.attached} upload${result.attached === 1 ? '' : 's'} ready to resume.`,
      );
    },
    [persist, replaceEntries],
  );

  /** Debounced draft-metadata PATCH; last write wins server-side (§7.3). */
  const updateMetadata = useCallback(
    (localId: string, patch: PatchUploadBody) => {
      void updateEntry(localId, {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.isPublic !== undefined ? { isPublic: patch.isPublic } : {}),
        ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        ...(patch.channelId !== undefined ? { channelId: patch.channelId } : {}),
      });

      const existing = patchTimersRef.current.get(localId);
      if (existing) clearTimeout(existing);
      patchTimersRef.current.set(
        localId,
        setTimeout(() => {
          patchTimersRef.current.delete(localId);
          const entry = entriesRef.current.find((candidate) => candidate.localId === localId);
          if (!entry?.uploadId || entry.videoId !== null) return;
          void api.patch(entry.uploadId, patch).catch(() => {
            // Metadata is re-sent on the next keystroke; a lost PATCH is not
            // worth interrupting an upload for.
          });
        }, 800),
      );
    },
    [api, updateEntry],
  );

  const startEntry = useCallback(
    (entry: UploadQueueEntry) => {
      if (activeIdsRef.current.has(entry.localId)) return;
      activeIdsRef.current.add(entry.localId);
      const controller = new AbortController();
      controllersRef.current.set(entry.localId, controller);

      const update: QueueEntryUpdate = (patch, updateOptions) => {
        // Any sign of progress means the admission backoff was pessimistic.
        if (
          patch.uploadId ||
          (patch.status && ['uploading', 'uploaded', 'processing', 'ready'].includes(patch.status))
        ) {
          setAdmissionRetryAt(null);
          setAdmissionProbe(false);
        }
        return updateEntry(entry.localId, patch, updateOptions);
      };

      void executeUploadTransfer(entry, entry.file, transferDeps, update, { signal: controller.signal })
        .catch(async (error: unknown) => {
          if (abortingIdsRef.current.has(entry.localId) || controller.signal.aborted) return;
          const failure = classifyTransferFailure(error);
          const retryAt =
            failure.retryAfterSeconds === null ? null : Date.now() + failure.retryAfterSeconds * 1_000;
          if (failure.code === 'UPLOAD_ADMISSION_BUSY' && retryAt !== null) {
            setAdmissionRetryAt((current) => Math.max(current ?? 0, retryAt));
            // Probe with a single file so a busy server is not hammered.
            setAdmissionProbe(true);
          }
          await updateEntry(entry.localId, {
            status: failure.status,
            errorCode: failure.code,
            errorMessage: failure.message,
            retryAt,
          });
        })
        .finally(() => {
          controllersRef.current.delete(entry.localId);
          activeIdsRef.current.delete(entry.localId);
          setSchedulerRevision((value) => value + 1);
        });
    },
    [transferDeps, updateEntry],
  );

  // ── scheduler ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated || paused) return;
    const candidates = selectQueueCandidates(
      entries,
      activeIdsRef.current,
      false,
      Date.now(),
      admissionProbe ? 1 : ACTIVE_FILE_LIMIT,
      admissionRetryAt,
    );
    for (const entry of candidates) startEntry(entry);
  }, [admissionProbe, admissionRetryAt, entries, hydrated, paused, schedulerRevision, startEntry]);

  // Wake the scheduler when the earliest retry deadline comes due.
  useEffect(() => {
    const entryRetryAt = entries
      .filter((entry) => ['retry_wait', 'uploaded'].includes(entry.status) && entry.retryAt)
      .map((entry) => entry.retryAt!)
      .sort((a, b) => a - b)[0];
    const retryAt =
      admissionRetryAt !== null && admissionRetryAt > Date.now() ? admissionRetryAt : entryRetryAt;
    if (!retryAt) return;
    const timer = setTimeout(
      () => {
        if (admissionRetryAt !== null && admissionRetryAt <= Date.now()) setAdmissionRetryAt(null);
        setSchedulerRevision((value) => value + 1);
      },
      Math.max(0, retryAt - Date.now()) + 20,
    );
    return () => clearTimeout(timer);
  }, [admissionRetryAt, entries]);

  // ── server reconciliation poll ───────────────────────────────────────────
  useEffect(() => {
    if (!hydrated || !pollingWanted) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (delay: number) => {
      timer = setTimeout(() => void poll(), delay);
    };

    const poll = async () => {
      if (cancelled) return;
      if (document.visibilityState === 'hidden') {
        schedule(STATUS_POLL_MS * 3);
        return;
      }
      try {
        const active = await api.listActive();
        if (cancelled) return;
        const byId = new Map(active.uploads.map((row) => [row.uploadId, row]));
        const now = Date.now();
        const next: UploadQueueEntry[] = [];
        const touched: UploadQueueEntry[] = [];
        for (const entry of entriesRef.current) {
          const row = entry.uploadId ? byId.get(entry.uploadId) : undefined;
          const merged = row ? applyServerRow(entry, row) : entry;
          if (isRetired(merged, now)) {
            void forget(merged.localId);
            continue;
          }
          if (merged !== entry) touched.push(merged);
          next.push(merged);
        }
        if (touched.length > 0 || next.length !== entriesRef.current.length) {
          replaceEntries(next);
          await Promise.all(touched.map(persist));
        }
      } catch {
        // Keep local state; the next tick tries again.
      }
      if (!cancelled) schedule(STATUS_POLL_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (timer !== undefined) clearTimeout(timer);
      schedule(250);
    };

    schedule(1_000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [api, forget, hydrated, persist, pollingWanted, replaceEntries]);

  const abortEntry = useCallback(
    async (localId: string) => {
      const entry = entriesRef.current.find((candidate) => candidate.localId === localId);
      if (!entry) return;
      abortingIdsRef.current.add(localId);
      controllersRef.current.get(localId)?.abort();
      setActionError(null);
      try {
        if (entry.uploadId) {
          await api.abort(entry.uploadId);
          await updateEntry(localId, {
            status: 'aborted',
            retryAt: null,
            errorCode: null,
            errorMessage: null,
          });
        } else {
          await forget(localId);
          replaceEntries(entriesRef.current.filter((candidate) => candidate.localId !== localId));
          releaseSessionSlot();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload cancellation failed';
        setActionError(message);
        await updateEntry(localId, {
          status: entry.file ? 'queued' : 'reselect_required',
          errorCode: 'UPLOAD_ABORT_FAILED',
          errorMessage: message,
        });
      } finally {
        abortingIdsRef.current.delete(localId);
      }
    },
    [api, forget, releaseSessionSlot, replaceEntries, updateEntry],
  );

  const retryEntry = useCallback(
    async (localId: string) => {
      const entry = entriesRef.current.find((candidate) => candidate.localId === localId);
      if (!entry || entry.status !== 'retry_wait') return;
      await updateEntry(localId, {
        status: entry.file ? 'queued' : 'reselect_required',
        retryAt: null,
        errorCode: null,
        errorMessage: null,
      });
    },
    [updateEntry],
  );

  const replaceAttempt = useCallback(
    async (localId: string) => {
      const entry = entriesRef.current.find((candidate) => candidate.localId === localId);
      if (!entry || !['failed', 'held', 'aborted'].includes(entry.status)) return;
      setActionError(null);
      const replacement = replaceQueueAttempt(entry);
      await forget(localId);
      await persist(replacement);
      replaceEntries(
        entriesRef.current.map((candidate) => (candidate.localId === localId ? replacement : candidate)),
      );
    },
    [forget, persist, replaceEntries],
  );

  const removeEntry = useCallback(
    async (localId: string) => {
      const entry = entriesRef.current.find((candidate) => candidate.localId === localId);
      if (!entry || !['failed', 'held', 'aborted', 'ready'].includes(entry.status)) return;
      await forget(localId);
      replaceEntries(entriesRef.current.filter((candidate) => candidate.localId !== localId));
      releaseSessionSlot();
    },
    [forget, releaseSessionSlot, replaceEntries],
  );

  return {
    entries,
    paused,
    hydrated,
    persistenceError,
    selectionNotice,
    actionError,
    activeCount: activeIdsRef.current.size,
    remainingSessionSlots: Math.max(0, MAX_UPLOAD_SESSION_ITEMS - sessionUsedCount),
    setPaused,
    enqueueFiles,
    reselectFiles,
    updateMetadata,
    abortEntry,
    retryEntry,
    replaceAttempt,
    removeEntry,
  };
}

/** Folds a server row into a local entry, leaving the local one alone if equal. */
function applyServerRow(entry: UploadQueueEntry, row: ActiveUploadSummary): UploadQueueEntry {
  const serverStatus = statusFromServer(row.uploadState);
  // While the browser is still pushing bytes the local status is fresher than
  // anything a 10 s poll can say; only terminal server states override it.
  const status =
    serverStatus === 'uploading' && entry.status !== 'uploading' ? entry.status : serverStatus;
  if (
    status === entry.status &&
    row.videoId === entry.videoId &&
    row.videoStatus === entry.videoStatus &&
    row.errorCode === entry.errorCode
  ) {
    return entry;
  }
  return {
    ...entry,
    status,
    videoId: row.videoId,
    videoStatus: row.videoStatus,
    errorCode: row.errorCode ?? entry.errorCode,
    progress: status === 'processing' || status === 'ready' ? 100 : entry.progress,
    updatedAt: new Date().toISOString(),
  };
}

/** Finished rows drop out of the queue a day after they settled. */
function isRetired(entry: UploadQueueEntry, now: number): boolean {
  if (entry.videoId === null) return false;
  if (entry.videoStatus !== 'processed' && entry.videoStatus !== 'failed') return false;
  return now - new Date(entry.updatedAt).getTime() > FINISHED_ROW_TTL_MS;
}

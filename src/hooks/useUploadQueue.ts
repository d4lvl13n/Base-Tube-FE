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
  type UploadVideoStatus,
} from '@basetube/api';
import { getBasetubeClient } from '../lib/basetubeClient';
import {
  getVideoProgressBatch,
  updateVideo,
  type VideoProcessingStatus,
  type VideoProgressBatchResponse,
  type VideoProgressBatchRow,
} from '../api/video';
import { showErrorToast } from '../components/common/Notifications/ErrorToast';

/** Files transferring at the same time. The server admits 8 per user (§7.2). */
const ACTIVE_FILE_LIMIT = 4;
/** How often the queue asks the server what became of its uploads. */
const STATUS_POLL_MS = 10_000;
/**
 * How often a row that already produced a `Video` re-checks the transcoder.
 *
 * `GET /videos/uploads?active=true` deliberately stops listing a `ready` upload
 * once its video is `processed`/`failed`, so the upload poll can never report
 * the end of processing — this second poll is the only thing that can.
 */
const PROGRESS_POLL_MS = 5_000;
/** ±jitter, so a batch of rows does not stampede the endpoint on one tick. */
const PROGRESS_POLL_JITTER_MS = 1_000;
/** A background tab polls three times more slowly. */
const HIDDEN_POLL_MULTIPLIER = 3;
/** A finished row stays visible for a day so the creator sees the outcome. */
const FINISHED_ROW_TTL_MS = 24 * 60 * 60 * 1_000;
const PERSISTENCE_WARNING = 'This queue is running without reliable reload recovery.';
/** How long a keystroke waits before it becomes a draft-metadata PATCH. */
const METADATA_DEBOUNCE_MS = 800;
/**
 * Shown when a PATCH lost the race with completion: the backend answers 409
 * `UPLOAD_STATE_CONFLICT` once the row has produced a `Video`, and from then on
 * the video row — not the upload draft — is what edits apply to.
 */
const METADATA_MOVED_NOTICE = 'Saved to your video — edit it in Videos Management';
const THUMBNAIL_FAILED_NOTICE = 'The video is uploading, but the thumbnail could not be saved.';
/**
 * Shown when neither the draft PATCH nor the video update took the edit. The
 * pending fields stay queued for the next flush, so this is a warning, not an
 * epitaph — but the creator has to know their last keystrokes are not saved.
 */
const METADATA_SAVE_FAILED_NOTICE =
  'Your latest changes could not be saved yet — we will keep trying.';

/** The 409 the control plane raises once `video_uploads.video_id` is set. */
function conflictVideoId(error: unknown): number | null {
  const candidate = error as { code?: string; details?: { videoId?: unknown } } | null;
  if (!candidate || candidate.code !== 'UPLOAD_STATE_CONFLICT') return null;
  const videoId = candidate.details?.videoId;
  return typeof videoId === 'number' ? videoId : null;
}

/** What a post-completion edit can still change on the Video row. */
export interface VideoUpdateFields {
  title?: string;
  description?: string | null;
  /**
   * Always sent, never optional.
   *
   * `PUT /api/v1/videos/:id` computes `isPublic: is_public === 'true'`
   * unconditionally, so a request that omits the field sets the video to
   * PRIVATE. A thumbnail-only update must therefore restate the visibility.
   */
  isPublic: boolean;
  thumbnail?: File;
}

/** Default post-completion edit: the existing `PUT /api/v1/videos/:id`. */
async function putVideoUpdate(videoId: number, fields: VideoUpdateFields): Promise<void> {
  const formData = new FormData();
  if (fields.title !== undefined) formData.append('title', fields.title);
  if (fields.description) formData.append('description', fields.description);
  formData.append('is_public', fields.isPublic ? 'true' : 'false');
  if (fields.thumbnail) formData.append('thumbnail', fields.thumbnail);
  await updateVideo(String(videoId), formData);
}

/** One transcode target as `GET /videos/progress` reports it. */
export interface RenditionSummary {
  quality: string;
  state: string;
}

/**
 * A queue entry as the UI sees it.
 *
 * `renditions` is memory-only: it says what the transcoder is doing *right
 * now*, which is worthless after a reload, so it is deliberately not part of
 * the persisted record.
 */
export interface UploadQueueViewEntry extends UploadQueueEntry {
  renditions?: RenditionSummary[];
}

export type VideoProgressFetcher = (videoIds: number[]) => Promise<VideoProgressBatchResponse>;

export interface UseUploadQueueOptions {
  api?: UploadApi;
  resumeStore?: UploadResumeStore;
  /** Injected by tests; defaults to `PUT /api/v1/videos/:id`. */
  applyVideoUpdate?: (videoId: number, fields: VideoUpdateFields) => Promise<void>;
  /** Injected by tests; defaults to `GET /api/v1/videos/progress?ids=`. */
  fetchVideoProgress?: VideoProgressFetcher;
  /** Injected by tests; defaults to the app's toast. */
  notify?: (message: string) => void;
}

export interface UploadQueueApi {
  entries: UploadQueueViewEntry[];
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
  /** Sends any debounced metadata now and waits for the server to take it. */
  flushMetadata: (localId: string) => Promise<void>;
  /**
   * Parks a chosen thumbnail until the upload produces a `videoId`.
   *
   * The queue lives above the router, so the file is applied even if the
   * creator navigates away from the upload page before the video row exists.
   */
  setPendingThumbnail: (localId: string, thumbnail: File | null) => void;
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

/**
 * Rows `GET /videos/uploads?active=true` may still have news about.
 *
 * Only the pre-video phase: once `videoId` exists the upload row is `ready`
 * and the transcoder — not the control plane — owns the remaining story.
 */
function needsPolling(entries: readonly UploadQueueEntry[]): boolean {
  return entries.some(
    (entry) =>
      entry.uploadId !== null &&
      entry.videoId === null &&
      (IN_FLIGHT_STATUSES.has(entry.status) || entry.status === 'processing'),
  );
}

/** Has a `Video` row that has not finished (or failed) transcoding yet. */
function awaitsProcessing(entry: UploadQueueEntry): boolean {
  return (
    entry.videoId !== null && entry.videoStatus !== 'processed' && entry.videoStatus !== 'failed'
  );
}

/** The video ids whose processing state is still worth asking about. */
function pendingProgressIds(entries: readonly UploadQueueEntry[]): number[] {
  const ids = new Set<number>();
  for (const entry of entries) {
    if (awaitsProcessing(entry)) ids.add(entry.videoId as number);
  }
  return Array.from(ids).sort((a, b) => a - b);
}

/**
 * `Videos.status` → the upload queue's narrower vocabulary.
 *
 * The legacy single-video route spells the terminal success value `completed`;
 * both spellings mean the same finished video.
 */
function toVideoStatus(status: VideoProcessingStatus | undefined): UploadVideoStatus | null {
  if (status === 'completed') return 'processed';
  if (status === 'pending' || status === 'processing' || status === 'processed' || status === 'failed') {
    return status;
  }
  return null;
}

/** The next progress tick: 5 s ± 1 s, three times slower in a hidden tab. */
function progressPollDelay(): number {
  const jittered = PROGRESS_POLL_MS + (Math.random() * 2 - 1) * PROGRESS_POLL_JITTER_MS;
  const hidden = typeof document !== 'undefined' && document.hidden;
  return Math.round(jittered * (hidden ? HIDDEN_POLL_MULTIPLIER : 1));
}

function sameRenditions(a: readonly RenditionSummary[], b: readonly RenditionSummary[]): boolean {
  return (
    a.length === b.length &&
    a.every((item, index) => item.quality === b[index].quality && item.state === b[index].state)
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
  const applyVideoUpdate = options.applyVideoUpdate ?? putVideoUpdate;
  const fetchVideoProgress = options.fetchVideoProgress ?? getVideoProgressBatch;
  const notify = options.notify ?? showErrorToast;
  const storeRef = useRef<UploadResumeStore>(options.resumeStore ?? createUploadResumeStore());
  const entriesRef = useRef<UploadQueueEntry[]>([]);
  const controllersRef = useRef(new Map<string, AbortController>());
  const activeIdsRef = useRef(new Set<string>());
  const abortingIdsRef = useRef(new Set<string>());
  const patchTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  /** The newest un-sent metadata per entry, merged across keystrokes. */
  const pendingPatchesRef = useRef(new Map<string, PatchUploadBody>());
  /** The PATCH currently on the wire per entry, so a flush can await it. */
  const inFlightPatchRef = useRef(new Map<string, Promise<void>>());
  const pendingThumbnailsRef = useRef(new Map<string, File>());
  const thumbnailAttemptedRef = useRef(new Set<string>());
  const mountedRef = useRef(true);
  const applyVideoUpdateRef = useRef(applyVideoUpdate);
  const fetchVideoProgressRef = useRef(fetchVideoProgress);
  const notifyRef = useRef(notify);
  applyVideoUpdateRef.current = applyVideoUpdate;
  fetchVideoProgressRef.current = fetchVideoProgress;
  notifyRef.current = notify;

  const [entries, setEntries] = useState<UploadQueueEntry[]>([]);
  /** Memory-only transcode detail, keyed by `localId`. */
  const [renditionsByLocalId, setRenditionsByLocalId] = useState<Record<string, RenditionSummary[]>>(
    {},
  );
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

  // Declared before every other effect so its cleanup runs first: the later
  // cleanups (and any promise that settles after them) then see `false`.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const replaceEntries = useCallback((next: UploadQueueEntry[]) => {
    entriesRef.current = next;
    // The ref is the queue's real state; React only needs it while mounted.
    if (mountedRef.current) setEntries(next);
  }, []);

  const persist = useCallback(async (entry: UploadQueueEntry) => {
    try {
      await storeRef.current.put(persistedRecord(entry));
    } catch {
      if (mountedRef.current) setPersistenceError(PERSISTENCE_WARNING);
    }
  }, []);

  const forget = useCallback(async (localId: string) => {
    try {
      await storeRef.current.remove(localId);
    } catch {
      if (mountedRef.current) setPersistenceError(PERSISTENCE_WARNING);
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
          const byId = new Map(active.map((row) => [row.uploadId, row]));
          const survivors: UploadQueueEntry[] = [];
          for (const entry of entriesRef.current) {
            // A row the server has never heard of (or has already retired) is
            // dead weight; a row with no uploadId has not been created yet.
            //
            // A row that already produced a `Video` is NOT dead weight: the
            // control plane drops `ready` uploads from the active list as soon
            // as the video reaches `processed`/`failed`, so absence there means
            // "finished", not "vanished". The progress poll finishes the story.
            if (entry.uploadId && !byId.has(entry.uploadId) && entry.videoId === null) {
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
    if (mountedRef.current) setSessionUsedCount(sessionUsedRef.current);
  }, []);

  const releaseSessionSlot = useCallback(() => {
    sessionUsedRef.current = Math.max(0, sessionUsedRef.current - 1);
    if (mountedRef.current) setSessionUsedCount(sessionUsedRef.current);
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

  /**
   * Retires a pending patch, but only the exact one that was accepted.
   *
   * `updateMetadata` replaces the map value with a freshly merged object on
   * every keystroke, so an identity mismatch means the creator typed again
   * while the request was in flight — those newer fields must survive.
   */
  const clearPendingPatch = useCallback((localId: string, sent: PatchUploadBody) => {
    if (pendingPatchesRef.current.get(localId) === sent) {
      pendingPatchesRef.current.delete(localId);
    }
  }, []);

  /**
   * Re-applies pending draft fields to the Video row the upload produced.
   *
   * `PUT /api/v1/videos/:id` only reads `title`, `description` and
   * `is_public`; `tags`/`channelId` have no counterpart there and stay in
   * Videos Management's hands. On failure the patch stays queued so the next
   * flush retries it rather than the edit being lost.
   */
  const applyPendingToVideo = useCallback(
    async (
      localId: string,
      videoId: number,
      patch: PatchUploadBody,
      fallbackIsPublic: boolean,
    ): Promise<void> => {
      try {
        await applyVideoUpdateRef.current(videoId, {
          title: patch.title,
          description: patch.description,
          isPublic: patch.isPublic ?? fallbackIsPublic,
        });
        clearPendingPatch(localId, patch);
      } catch {
        if (mountedRef.current) notifyRef.current(METADATA_SAVE_FAILED_NOTICE);
      }
    },
    [clearPendingPatch],
  );

  /**
   * Sends whatever draft metadata is pending for one entry, right now.
   *
   * Cancels the debounce first so a timer that fires later cannot re-send the
   * same body after completion has already moved the metadata to the video.
   * The pending entry is cleared only once a server has actually taken it —
   * every failure path leaves it queued for the next flush.
   */
  const sendPendingPatch = useCallback(
    async (localId: string): Promise<void> => {
      const timer = patchTimersRef.current.get(localId);
      if (timer) {
        clearTimeout(timer);
        patchTimersRef.current.delete(localId);
      }
      const patch = pendingPatchesRef.current.get(localId);
      const entry = entriesRef.current.find((candidate) => candidate.localId === localId);
      if (!patch || !entry?.uploadId) return;

      // Past the point where PATCH applies: the draft became a Video, so the
      // edit belongs to `PUT /api/v1/videos/:id` instead of being dropped.
      if (entry.videoId !== null) {
        await applyPendingToVideo(localId, entry.videoId, patch, entry.isPublic);
        return;
      }

      const uploadId = entry.uploadId;
      const request = (async () => {
        try {
          await api.patch(uploadId, patch);
          clearPendingPatch(localId, patch);
        } catch (error) {
          const videoId = conflictVideoId(error);
          if (videoId !== null) {
            // The worker created the Video while this PATCH was in flight.
            // Record the id so later edits go to `updateVideo`, say so, and
            // re-send these very fields there — the creator typed them, and a
            // 409 is a change of address, not a rejection.
            await updateEntry(localId, { videoId });
            if (mountedRef.current) notifyRef.current(METADATA_MOVED_NOTICE);
            await applyPendingToVideo(localId, videoId, patch, entry.isPublic);
            return;
          }
          // Network or 5xx: the edit is still pending, so the next flush (or
          // the next keystroke's debounce) retries it.
        }
      })();
      inFlightPatchRef.current.set(localId, request);
      try {
        await request;
      } finally {
        if (inFlightPatchRef.current.get(localId) === request) {
          inFlightPatchRef.current.delete(localId);
        }
      }
    },
    [api, applyPendingToVideo, clearPendingPatch, updateEntry],
  );

  /**
   * Drains the metadata pipeline for one entry: whatever is already on the
   * wire, then whatever the debounce is still holding.
   */
  const flushMetadata = useCallback(
    async (localId: string): Promise<void> => {
      const inFlight = inFlightPatchRef.current.get(localId);
      if (inFlight) await inFlight.catch(() => undefined);
      await sendPendingPatch(localId);
    },
    [sendPendingPatch],
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

      pendingPatchesRef.current.set(localId, {
        ...pendingPatchesRef.current.get(localId),
        ...patch,
      });
      const existing = patchTimersRef.current.get(localId);
      if (existing) clearTimeout(existing);
      patchTimersRef.current.set(
        localId,
        setTimeout(() => {
          patchTimersRef.current.delete(localId);
          void sendPendingPatch(localId);
        }, METADATA_DEBOUNCE_MS),
      );
    },
    [sendPendingPatch, updateEntry],
  );

  const setPendingThumbnail = useCallback((localId: string, thumbnail: File | null) => {
    if (thumbnail) pendingThumbnailsRef.current.set(localId, thumbnail);
    else pendingThumbnailsRef.current.delete(localId);
    thumbnailAttemptedRef.current.delete(localId);
    // Re-runs the apply effect for the case where `videoId` is already known.
    if (mountedRef.current) setSchedulerRevision((value) => value + 1);
  }, []);

  // ── parked thumbnails: apply as soon as the Video row exists ─────────────
  useEffect(() => {
    for (const entry of entries) {
      const thumbnail = pendingThumbnailsRef.current.get(entry.localId);
      if (!thumbnail || entry.videoId === null) continue;
      if (thumbnailAttemptedRef.current.has(entry.localId)) continue;
      // Marked before the await: `entries` changes on every poll tick and a
      // second attempt would race the first.
      thumbnailAttemptedRef.current.add(entry.localId);
      const videoId = entry.videoId;
      const localId = entry.localId;
      void applyVideoUpdateRef
        .current(videoId, { thumbnail, isPublic: entry.isPublic })
        .then(() => {
          pendingThumbnailsRef.current.delete(localId);
        })
        .catch(() => {
          pendingThumbnailsRef.current.delete(localId);
          if (mountedRef.current) notifyRef.current(THUMBNAIL_FAILED_NOTICE);
        });
    }
  }, [entries, schedulerRevision]);

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
          if (mountedRef.current) {
            setAdmissionRetryAt(null);
            setAdmissionProbe(false);
          }
        }
        return updateEntry(entry.localId, patch, updateOptions);
      };

      // Completion is the point of no return for draft metadata: the backend
      // creates the Video row there, and every later PATCH is a 409.
      const deps = { ...transferDeps, beforeComplete: () => flushMetadata(entry.localId) };

      void executeUploadTransfer(entry, entry.file, deps, update, { signal: controller.signal })
        .catch(async (error: unknown) => {
          if (abortingIdsRef.current.has(entry.localId) || controller.signal.aborted) return;
          const failure = classifyTransferFailure(error);
          const retryAt =
            failure.retryAfterSeconds === null ? null : Date.now() + failure.retryAfterSeconds * 1_000;
          if (failure.code === 'UPLOAD_ADMISSION_BUSY' && retryAt !== null && mountedRef.current) {
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
          // The transfer outlives the component on navigation-away; without
          // this the scheduler bump lands on an unmounted tree.
          if (mountedRef.current) setSchedulerRevision((value) => value + 1);
        });
    },
    [flushMetadata, transferDeps, updateEntry],
  );

  // ── scheduler ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated || paused) return;
    const candidates = selectQueueCandidates(
      // Once the `Video` row exists there is nothing left to transfer, and a
      // reload hydrates such a row as `uploaded` — without this guard the
      // scheduler would re-run a finished transfer against it.
      entries.filter((entry) => entry.videoId === null),
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
        const byId = new Map(active.map((row) => [row.uploadId, row]));
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

  /** Folds one batch of `/videos/progress` rows into the queue. */
  const applyProgressRows = useCallback(
    async (rows: Record<string, VideoProgressBatchRow>) => {
      const seen: Record<string, RenditionSummary[]> = {};
      const updates: Array<{ localId: string; patch: Partial<UploadQueueEntry> }> = [];

      for (const entry of entriesRef.current) {
        if (entry.videoId === null) continue;
        const row = rows[String(entry.videoId)];
        if (!row) continue;
        seen[entry.localId] = (row.renditions ?? []).map((rendition) => ({
          quality: rendition.quality,
          state: rendition.state,
        }));
        const videoStatus = toVideoStatus(row.status);
        if (!videoStatus || videoStatus === entry.videoStatus) continue;
        const settled = videoStatus === 'processed' || videoStatus === 'failed';
        updates.push({
          localId: entry.localId,
          // The upload itself is long done by now; saying so lets the row be
          // dismissed and keeps the phase derivation on `videoStatus`.
          patch: settled ? { videoStatus, status: 'ready', progress: 100 } : { videoStatus },
        });
      }

      if (mountedRef.current) {
        setRenditionsByLocalId((current) => {
          const localIds = Object.keys(seen);
          const unchanged =
            localIds.length === Object.keys(current).length &&
            localIds.every((localId) => sameRenditions(current[localId] ?? [], seen[localId]));
          return unchanged ? current : seen;
        });
      }
      for (const { localId, patch } of updates) await updateEntry(localId, patch);
    },
    [updateEntry],
  );

  // ── transcode progress poll ──────────────────────────────────────────────
  // Keyed by the id set, so it starts as soon as a video appears, re-arms when
  // the set changes, and stops for good once every row is processed/failed.
  const progressKey = pendingProgressIds(entries).join(',');
  useEffect(() => {
    if (!hydrated || progressKey === '') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (cancelled) return;
      const ids = pendingProgressIds(entriesRef.current);
      if (ids.length === 0) return;
      try {
        const response = await fetchVideoProgressRef.current(ids);
        if (cancelled) return;
        await applyProgressRows(response.data ?? {});
      } catch {
        // Keep local state; the next tick tries again.
      }
      if (cancelled || pendingProgressIds(entriesRef.current).length === 0) return;
      timer = setTimeout(() => void poll(), progressPollDelay());
    };

    // Immediately on boot (and whenever a new video joins): a reload of a
    // finished batch must show the finished state, not a stale "processing".
    void poll();

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => void poll(), 250);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [applyProgressRows, hydrated, progressKey]);

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
      // Settled either way: the upload gave up, or the video is done with us.
      const dismissible =
        ['failed', 'held', 'aborted', 'ready'].includes(entry?.status ?? '') ||
        entry?.videoStatus === 'processed' ||
        entry?.videoStatus === 'failed';
      if (!entry || !dismissible) return;
      pendingThumbnailsRef.current.delete(localId);
      pendingPatchesRef.current.delete(localId);
      setRenditionsByLocalId((current) => {
        if (!(localId in current)) return current;
        const { [localId]: _dropped, ...rest } = current;
        return rest;
      });
      await forget(localId);
      replaceEntries(entriesRef.current.filter((candidate) => candidate.localId !== localId));
      releaseSessionSlot();
    },
    [forget, releaseSessionSlot, replaceEntries],
  );

  const viewEntries = useMemo<UploadQueueViewEntry[]>(
    () =>
      entries.map((entry) => {
        const renditions = renditionsByLocalId[entry.localId];
        return renditions ? { ...entry, renditions } : entry;
      }),
    [entries, renditionsByLocalId],
  );

  return {
    entries: viewEntries,
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
    flushMetadata,
    setPendingThumbnail,
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

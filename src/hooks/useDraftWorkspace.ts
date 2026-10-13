/**
 * The upload workspace engine (UP-UX §6–§12).
 *
 * One record per video in preparation, keyed by its local `clientDraftId`
 * (created and persisted before the first request). The server draft is the
 * editorial source of truth; this hook only holds what the server has not
 * acknowledged yet, and says so.
 *
 * Invariants:
 *   - every mutation of one draft (save, thumbnail selection, publication,
 *     deletion) runs through ONE serial chain, so each carries the revision
 *     the previous one returned;
 *   - an older server answer never replaces text typed after it was sent
 *     (`remainingAfterAck`), and a projection with a lower revision than the
 *     one held is ignored;
 *   - a revision conflict is shown to the creator and resolved by them —
 *     never merged here;
 *   - a lost answer is resolved by reading state or by replaying the same
 *     idempotency key, never by sending a new command blindly;
 *   - the transfer itself stays in the global upload queue: this hook binds
 *     drafts to queue rows, it does not move bytes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AuthenticationRequiredError,
  diffAgainstServer,
  DRAFT_ERROR_CODES,
  filenameStem,
  hasPendingEdits,
  isAuthenticationRefusal,
  mergePendingEdits,
  patchBodyFor,
  publishReadiness,
  remainingAfterAck,
  UploadApiError,
  validateDraftFields,
  visibleFields,
  type CreatorDraftsApi,
  type CreatorDraftView,
  type DraftPreviewData,
  type DraftFieldPatch,
  type DraftPublicationState,
  type LocalPublishState,
  type RejectedUploadFile,
  type SessionRecovery,
  type UploadApi,
} from '@basetube/api';
import { getBasetubeClient } from '../lib/basetubeClient';
import {
  createDraftWorkspaceStore,
  type DraftWorkspaceRecord,
  type DraftWorkspaceStore,
  type LocalThumbnailChoice,
} from '../lib/uploads/draftWorkspaceStore';
import { retryVideoProcessing } from '../api/video';
import { describeUploadError } from '../components/upload/uploadCopy';
import { uploadPhase } from '../components/upload/uploadPhase';
import type { UploadQueueApi, UploadQueueViewEntry } from './useUploadQueue';

/** UP-UX §7: a field is saved after 800 ms without typing, and on leaving it. */
export const AUTOSAVE_DEBOUNCE_MS = 800;
/** Bounded retries for an answer that never came (network, 5xx). Then the creator retries. */
const TRANSIENT_RETRY_DELAYS_MS = [3_000, 10_000, 30_000] as const;
/** Draft creation is idempotent by `clientDraftId`, so it may keep trying a little longer. */
const CREATE_RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000, 60_000] as const;
const REFRESH_VISIBLE_MS = 10_000;
const REFRESH_HIDDEN_MS = 30_000;
const MAX_REFRESH_PER_TICK = 10;
const LIST_PAGE_SIZE = 25;
/** Published drafts with nothing pending drop out of this device's memory after a week. */
const PUBLISHED_RECORD_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
/** UP-UX §8 / UP-BE §8. */
export const THUMBNAIL_MAX_BYTES = 5_000_000;
const THUMBNAIL_TYPES = ['image/jpeg', 'image/png'];

/** Prefix for drafts this device learned about from the server (never sent anywhere). */
const SERVER_KEY_PREFIX = 'server:';

export type CreateStatus = 'idle' | 'creating' | 'retry_wait' | 'failed' | 'auth_required';
export type SaveStatus =
  | 'idle'
  | 'scheduled'
  | 'saving'
  | 'failed'
  | 'offline'
  | 'auth_required'
  | 'conflict'
  | 'invalid';
export type PublishStatus = 'idle' | 'publishing' | 'verifying' | 'blocked' | 'failed' | 'auth_required';

/** Memory-only state of one draft. Never persisted: it describes this tab, now. */
export interface DraftRuntime {
  create: CreateStatus;
  createError: string | null;
  save: SaveStatus;
  saveError: string | null;
  /** The server version shown next to the creator's during a revision conflict. */
  conflict: CreatorDraftView | null;
  publish: PublishStatus;
  publishError: string | null;
  /** A publication this tab confirmed; drives the "Video published" notice. */
  publishedJustNow: boolean;
  deleting: boolean;
  deleteError: string | null;
  /** The server no longer has this draft (deleted elsewhere). */
  gone: boolean;
  /** The last local write failed: "kept on this device" would not be true. */
  persistFailed: boolean;
}

const IDLE_RUNTIME: DraftRuntime = {
  create: 'idle',
  createError: null,
  save: 'idle',
  saveError: null,
  conflict: null,
  publish: 'idle',
  publishError: null,
  publishedJustNow: false,
  deleting: false,
  deleteError: null,
  gone: false,
  persistFailed: false,
};

export interface WorkspaceDraft {
  key: string;
  record: DraftWorkspaceRecord;
  runtime: DraftRuntime;
  /** The newest queue row of this draft, when this device has one. */
  entry: UploadQueueViewEntry | null;
}

export interface ThumbnailChoiceResult {
  ok: boolean;
  message: string | null;
}

export interface DraftWorkspaceApi {
  /** Starts the server side (list, reconciliation). Called by the workspace page. */
  activate: () => void;
  hydrated: boolean;
  /** The last server preview of a draft (owner-only URLs, five-minute expiry), if loaded. */
  preview: (key: string) => DraftPreviewData | null;
  /** (Re)loads the server preview; callers reload before `expiresAt`. */
  loadPreview: (key: string) => Promise<void>;
  /** False when this browser keeps nothing across a reload (memory store). */
  durable: boolean;
  items: WorkspaceDraft[];
  listError: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  selectedKey: string | null;
  select: (key: string | null) => void;
  /** Selects a draft by server id, loading it from the server if this device does not know it. Null if absent. */
  open: (draftId: string) => Promise<string | null>;
  findByDraftId: (draftId: string) => WorkspaceDraft | undefined;
  addFiles: (
    files: readonly File[],
    channelId: number,
  ) => Promise<{ added: string[]; rejected: RejectedUploadFile[] }>;
  edit: (key: string, patch: DraftFieldPatch) => void;
  /** Leaving a field: save now rather than after the debounce. */
  commit: (key: string) => void;
  retrySave: (key: string) => void;
  resolveConflict: (key: string, choice: 'reload' | 'keep') => Promise<void>;
  chooseThumbnailFile: (
    key: string,
    image: Blob,
    filename: string,
    source: 'import' | 'ai',
  ) => Promise<ThumbnailChoiceResult>;
  chooseAutomaticThumbnail: (key: string) => void;
  retryThumbnail: (key: string) => void;
  thumbnailPreviewUrl: (key: string) => string | null;
  publish: (key: string) => Promise<void>;
  unpublish: (key: string) => Promise<void>;
  /** Re-sends the SAME publication command whose answer was lost. */
  verifyPublication: (key: string) => void;
  deleteDraft: (key: string) => Promise<boolean>;
  /** Gives a draft its file: resume, adopt a server attempt, or start a new attempt. */
  attachFile: (key: string, file: File) => Promise<string | null>;
  /** Drafts whose transfer waits for the original file on this device, with the file it needs. */
  waitingForFile: Array<{ key: string; title: string; filename: string; sizeBytes: number }>;
  /** Resumes every waiting draft whose file is among `files`; the rest is returned untouched. */
  resumeWithFiles: (files: readonly File[]) => Promise<{ resumed: number; unmatched: File[] }>;
  retryProcessing: (key: string) => Promise<string | null>;
  retryCreate: (key: string) => void;
  /** Hides a published draft from this device's list. Server state is untouched. */
  dismiss: (key: string) => void;
  /** Something would be lost if this tab closed now (unsaved field, local image, unsent command). */
  atRisk: boolean;
  /** Ready-to-publish computation for one draft, local state included. */
  readiness: (key: string) => ReturnType<typeof publishReadiness>;
}

interface Options {
  queue: UploadQueueApi;
  storageNamespace: string;
  recovery?: SessionRecovery;
  /** Injected by tests; default is the shared SDK client. */
  draftsApi?: CreatorDraftsApi;
  uploadsApi?: UploadApi;
  store?: DraftWorkspaceStore;
}

function nowIso(): string {
  return new Date().toISOString();
}

function isLostAnswer(error: unknown): boolean {
  return (
    error instanceof UploadApiError &&
    (error.status === 0 || error.status === 429 || error.status >= 500)
  );
}

/** `DRAFT_NOT_FOUND` (404, also a foreign draft) or `DRAFT_DELETED` (410): the draft is gone for this account. */
function isGoneError(error: unknown): boolean {
  return error instanceof UploadApiError &&
    ((error.status === 404 && error.code === DRAFT_ERROR_CODES.notFound) ||
      (error.status === 410 && error.code === DRAFT_ERROR_CODES.deleted));
}

function errorCode(error: unknown): string | null {
  return error instanceof UploadApiError ? error.code : null;
}

/** A creator-facing sentence for a draft-route failure; never a raw code. */
export function describeDraftError(error: unknown): string {
  if (error instanceof AuthenticationRequiredError) return 'Sign in again to continue. Your changes are kept.';
  if (error instanceof UploadApiError) {
    if (error.status === 403) return 'This account cannot change this draft.';
    if (isGoneError(error)) return 'This draft no longer exists.';
    if (error.status === 404) return 'The upload service is unavailable. Your changes are kept — try again later.';
    if (error.code === DRAFT_ERROR_CODES.uploadExpired) return 'This upload expired. Your details are kept — send the file again.';
    return describeUploadError(error.code, error.message);
  }
  return 'Something went wrong. Your changes are kept — try again.';
}

/** True when the committed projection already holds what was sent (resolves a lost PATCH answer). */
function serverHolds(view: CreatorDraftView, sent: DraftFieldPatch): boolean {
  if ('title' in sent && view.title !== (sent.title ?? '').trim()) return false;
  if ('description' in sent && view.description !== (sent.description ?? null)) return false;
  if ('tags' in sent) {
    const left = view.tags ?? [];
    const right = sent.tags ?? [];
    if (left.length !== right.length || left.some((tag, index) => tag !== right[index])) return false;
  }
  return true;
}

function newestEntryFor(entries: readonly UploadQueueViewEntry[], key: string): UploadQueueViewEntry | null {
  let found: UploadQueueViewEntry | null = null;
  for (const entry of entries) {
    if (entry.creatorDraft?.clientDraftId !== key) continue;
    if (!found || entry.createdAt > found.createdAt) found = entry;
  }
  return found;
}

/** Converts an image the AI tools returned in another format to JPEG, the format UP-BE accepts. */
async function asAcceptedImage(image: Blob): Promise<Blob | null> {
  if (THUMBNAIL_TYPES.includes(image.type)) return image;
  if (!image.type.startsWith('image/') || typeof createImageBitmap === 'undefined') return null;
  try {
    const bitmap = await createImageBitmap(image);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  } catch {
    return null;
  }
}

export function useDraftWorkspace(options: Options): DraftWorkspaceApi {
  const { queue, storageNamespace, recovery } = options;
  const draftsApi = useMemo(
    () => options.draftsApi ?? getBasetubeClient().creatorDrafts,
    [options.draftsApi],
  );
  const uploadsApi = useMemo(() => options.uploadsApi ?? getBasetubeClient().uploads, [options.uploadsApi]);
  const storeRef = useRef<DraftWorkspaceStore>(options.store ?? createDraftWorkspaceStore(storageNamespace));
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const recordsRef = useRef(new Map<string, DraftWorkspaceRecord>());
  const runtimeRef = useRef(new Map<string, DraftRuntime>());
  const [version, setVersion] = useState(0);
  /** True once the server list has been merged (or failed to load). */
  const [hydrated, setHydrated] = useState(false);
  const [localReady, setLocalReady] = useState(false);
  const [serverWanted, setServerWanted] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const mountedRef = useRef(true);

  const chainsRef = useRef(new Map<string, Promise<void>>());
  const debounceRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const retryTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const retryCountsRef = useRef(new Map<string, number>());
  const creatingRef = useRef(new Map<string, Promise<void>>());
  const deleteAfterCreateRef = useRef(new Set<string>());
  const thumbnailUploadsRef = useRef(new Set<string>());
  /** Blobs chosen in this tab, so the first upload does not wait on IndexedDB. */
  const memoryBlobsRef = useRef(new Map<string, Blob>());

  const bump = useCallback(() => {
    if (mountedRef.current) setVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const timers = [debounceRef.current, retryTimersRef.current];
    return () => {
      mountedRef.current = false;
      timers.forEach((map) => map.forEach((timer) => clearTimeout(timer)));
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const run = useCallback(
    <T,>(call: () => Promise<T>): Promise<T> => {
      if (!mountedRef.current) return Promise.reject(new AuthenticationRequiredError());
      return recovery ? recovery.run(call) : call();
    },
    [recovery],
  );

  const rec = useCallback((key: string) => recordsRef.current.get(key) ?? null, []);
  const rt = useCallback((key: string) => runtimeRef.current.get(key) ?? IDLE_RUNTIME, []);

  const setRuntime = useCallback(
    (key: string, patch: Partial<DraftRuntime>) => {
      runtimeRef.current.set(key, { ...rt(key), ...patch });
      bump();
    },
    [bump, rt],
  );

  /** Writes a record to memory at once and to the device store; reports a failed local write. */
  const putRecord = useCallback(
    async (record: DraftWorkspaceRecord) => {
      if (!mountedRef.current) return;
      const next = { ...record, updatedAt: nowIso() };
      recordsRef.current.set(next.clientDraftId, next);
      bump();
      try {
        await storeRef.current.put(next);
        if (rt(next.clientDraftId).persistFailed) setRuntime(next.clientDraftId, { persistFailed: false });
      } catch {
        setRuntime(next.clientDraftId, { persistFailed: true });
      }
    },
    [bump, rt, setRuntime],
  );

  const setPreview = useCallback((key: string, blob: Blob | null) => {
    const current = previewUrlsRef.current[key];
    if (current) URL.revokeObjectURL(current);
    const next = { ...previewUrlsRef.current };
    if (blob) next[key] = URL.createObjectURL(blob);
    else delete next[key];
    previewUrlsRef.current = next;
    if (mountedRef.current) setPreviewUrls(next);
  }, []);

  /**
   * Folds a server projection in. Lower revisions are stale and ignored; at
   * the same or a higher revision the server's technical state is taken, while
   * pending fields keep the creator's text.
   */
  const applyServerView = useCallback(
    async (key: string, view: CreatorDraftView, sent?: DraftFieldPatch, observation = false) => {
      const record = rec(key);
      if (!record || !mountedRef.current) return;
      // Wait for our own write acknowledgement before interpreting a concurrent read.
      if (observation && (rt(key).save === 'saving' || record.thumbnail?.status === 'selecting' ||
        ['publishing', 'verifying'].includes(rt(key).publish))) return;
      if (record.server && view.revision < record.server.revision) return;
      // A background read must not silently advance the revision used by an
      // unsaved edit and thereby bypass the backend conflict check.
      if (observation && record.server && view.revision > record.server.revision) {
        const edited = record.pending ?? {};
        const fieldsChanged = Object.keys(edited).some((field) => {
          const name = field as keyof DraftFieldPatch;
          return JSON.stringify(record.server![name]) !== JSON.stringify(view[name]);
        });
        const thumbnailChanged = record.thumbnail && record.thumbnail.status !== 'selected' &&
          record.server.thumbnail.assetId !== view.thumbnail.assetId;
        if (fieldsChanged || thumbnailChanged) {
          setRuntime(key, { save: 'conflict', conflict: view, saveError: null });
          return;
        }
      }
      const pending = sent ? remainingAfterAck(record.pending, sent) : record.pending;
      await putRecord({
        ...record,
        draftId: view.id,
        server: view,
        pending,
        desired: visibleFields(view, pending),
      });
    },
    [putRecord, rec, rt, setRuntime],
  );

  /** Serialises every mutation of one draft. */
  const enqueue = useCallback((key: string, task: () => Promise<void>): Promise<void> => {
    const previous = chainsRef.current.get(key) ?? Promise.resolve();
    const next = previous.then(task).catch(() => undefined);
    chainsRef.current.set(key, next);
    return next;
  }, []);

  const scheduleRetry = useCallback(
    (key: string, kind: string, delays: readonly number[], task: () => void): boolean => {
      const counterKey = `${kind}:${key}`;
      const attempt = retryCountsRef.current.get(counterKey) ?? 0;
      if (attempt >= delays.length) return false;
      retryCountsRef.current.set(counterKey, attempt + 1);
      const existing = retryTimersRef.current.get(counterKey);
      if (existing) clearTimeout(existing);
      retryTimersRef.current.set(
        counterKey,
        setTimeout(() => {
          retryTimersRef.current.delete(counterKey);
          task();
        }, delays[attempt]),
      );
      return true;
    },
    [],
  );

  const resetRetry = useCallback((key: string, kind: string) => {
    const counterKey = `${kind}:${key}`;
    retryCountsRef.current.delete(counterKey);
    const timer = retryTimersRef.current.get(counterKey);
    if (timer) clearTimeout(timer);
    retryTimersRef.current.delete(counterKey);
  }, []);

  /** A 409 revision conflict: fetch the server version and stop until the creator decides. */
  const enterConflict = useCallback(
    async (key: string) => {
      const record = rec(key);
      if (!record?.draftId) return;
      let server: CreatorDraftView | null = null;
      try {
        server = await run(() => draftsApi.get(record.draftId as string));
      } catch {
        server = null;
      }
      setRuntime(key, {
        save: 'conflict',
        conflict: server,
        saveError: server ? null : 'This draft changed elsewhere. Reload it to see the saved version.',
      });
    },
    [draftsApi, rec, run, setRuntime],
  );

  // ── autosave ──────────────────────────────────────────────────────────────

  const flushSaveRef = useRef<(key: string) => Promise<void>>(async () => undefined);

  const saveLoop = useCallback(
    async (key: string): Promise<void> => {
      for (;;) {
        const record = rec(key);
        if (!record?.draftId || !record.server) return;
        if (rt(key).save === 'conflict' || rt(key).gone) return;
        if (!hasPendingEdits(record.pending)) {
          if (rt(key).save !== 'idle') setRuntime(key, { save: 'idle', saveError: null });
          resetRetry(key, 'save');
          return;
        }
        if (validateDraftFields(record.desired).length > 0) {
          setRuntime(key, { save: 'invalid', saveError: null });
          return;
        }
        const sent: DraftFieldPatch = { ...record.pending };
        const draftId = record.draftId;
        setRuntime(key, { save: 'saving', saveError: null });
        let view: CreatorDraftView;
        try {
          view = await run(() => draftsApi.patch(draftId, patchBodyFor(sent, record.server!.revision)));
        } catch (error) {
          if (isAuthenticationRefusal(error)) {
            setRuntime(key, { save: 'auth_required', saveError: null });
            return;
          }
          if (errorCode(error) === DRAFT_ERROR_CODES.revisionConflict) {
            await enterConflict(key);
            return;
          }
          if (isGoneError(error)) {
            setRuntime(key, { gone: true, save: 'failed', saveError: describeDraftError(error) });
            return;
          }
          if (isLostAnswer(error)) {
            // The PATCH may have landed: read before sending anything again.
            try {
              const current = await run(() => draftsApi.get(draftId));
              if (current.revision > record.server!.revision && serverHolds(current, sent)) {
                await applyServerView(key, current, sent);
                continue;
              }
            } catch {
              /* still unreachable */
            }
            const offline = (error as UploadApiError).status === 0;
            const retrying = scheduleRetry(key, 'save', TRANSIENT_RETRY_DELAYS_MS, () => {
              void flushSaveRef.current(key);
            });
            setRuntime(key, {
              save: offline && retrying ? 'offline' : 'failed',
              saveError: offline && retrying ? null : describeDraftError(error),
            });
            return;
          }
          setRuntime(key, { save: 'failed', saveError: describeDraftError(error) });
          return;
        }
        resetRetry(key, 'save');
        await applyServerView(key, view, sent);
      }
    },
    [applyServerView, draftsApi, enterConflict, rec, resetRetry, rt, run, scheduleRetry, setRuntime],
  );

  const flushSave = useCallback(
    (key: string): Promise<void> => {
      const timer = debounceRef.current.get(key);
      if (timer) {
        clearTimeout(timer);
        debounceRef.current.delete(key);
      }
      return enqueue(key, () => saveLoop(key));
    },
    [enqueue, saveLoop],
  );
  flushSaveRef.current = flushSave;

  // ── thumbnails ────────────────────────────────────────────────────────────

  /** Applies a patch to the thumbnail choice only if it is still choice `seq` (the latest wins). */
  const updateThumbnail = useCallback(
    async (key: string, seq: number, patch: Partial<LocalThumbnailChoice>): Promise<boolean> => {
      const record = rec(key);
      if (!record?.thumbnail || record.thumbnail.seq !== seq) return false;
      await putRecord({ ...record, thumbnail: { ...record.thumbnail, ...patch } });
      return true;
    },
    [putRecord, rec],
  );

  const selectThumbnail = useCallback(
    async (key: string, seq: number): Promise<void> => {
      const record = rec(key);
      const choice = record?.thumbnail;
      if (!record?.draftId || !record.server || !choice || choice.seq !== seq) return;
      if (rt(key).save === 'conflict') return;
      const assetId = choice.kind === 'automatic' ? null : choice.assetId;
      if (choice.kind === 'custom' && !assetId) return;
      const already =
        record.server.thumbnail.assetId === assetId &&
        (assetId !== null || record.server.thumbnail.source === 'automatic');
      if (already) {
        await updateThumbnail(key, seq, { status: 'selected', errorCode: null, errorMessage: null });
        return;
      }
      await updateThumbnail(key, seq, { status: 'selecting', errorCode: null, errorMessage: null });
      const draftId = record.draftId;
      try {
        const view = await run(() =>
          draftsApi.selectThumbnail(draftId, { expectedRevision: record.server!.revision, assetId }),
        );
        await applyServerView(key, view);
        await updateThumbnail(key, seq, { status: 'selected' });
      } catch (error) {
        if (errorCode(error) === DRAFT_ERROR_CODES.revisionConflict) {
          await updateThumbnail(key, seq, { status: choice.kind === 'custom' ? 'uploaded' : 'selecting' });
          await enterConflict(key);
          return;
        }
        if (isLostAnswer(error)) {
          // Selection is idempotent by desired state: a read tells whether it landed.
          try {
            const current = await run(() => draftsApi.get(draftId));
            if (current.thumbnail.assetId === assetId) {
              await applyServerView(key, current);
              await updateThumbnail(key, seq, { status: 'selected' });
              return;
            }
          } catch {
            /* unknown */
          }
        }
        await updateThumbnail(key, seq, {
          status: 'failed',
          errorCode: isAuthenticationRefusal(error) ? 'AUTH_REQUIRED' : errorCode(error),
          errorMessage: describeDraftError(error),
        });
      }
    },
    [applyServerView, draftsApi, enterConflict, rec, rt, run, updateThumbnail],
  );

  const processThumbnail = useCallback(
    async (key: string): Promise<void> => {
      const record = rec(key);
      const choice = record?.thumbnail;
      if (!record?.draftId || !choice || choice.status === 'selected') return;
      const seq = choice.seq;
      if (choice.kind === 'custom' && !choice.assetId) {
        const uploadKey = `${key}#${seq}`;
        if (thumbnailUploadsRef.current.has(uploadKey)) return;
        thumbnailUploadsRef.current.add(uploadKey);
        try {
          await updateThumbnail(key, seq, { status: 'uploading', errorCode: null, errorMessage: null });
          const blobKey = choice.blobKey as string;
          const blob = memoryBlobsRef.current.get(blobKey) ?? (await storeRef.current.getBlob(blobKey).catch(() => null));
          if (!blob) {
            await updateThumbnail(key, seq, {
              status: 'failed',
              errorCode: 'THUMBNAIL_FILE_MISSING',
              errorMessage: 'This browser did not keep the image. Choose it again.',
            });
            return;
          }
          const draftId = record.draftId;
          const asset = await run(() =>
            draftsApi.uploadThumbnailAsset(draftId, {
              clientAssetId: choice.clientAssetId as string,
              file: blob,
              filename: choice.filename ?? 'thumbnail.jpg',
            }),
          );
          // A newer choice made meanwhile wins: this asset is simply not selected.
          if (!(await updateThumbnail(key, seq, { status: 'uploaded', assetId: asset.assetId }))) return;
        } catch (error) {
          await updateThumbnail(key, seq, {
            status: 'failed',
            errorCode: isAuthenticationRefusal(error) ? 'AUTH_REQUIRED' : errorCode(error),
            errorMessage: describeDraftError(error),
          });
          return;
        } finally {
          thumbnailUploadsRef.current.delete(uploadKey);
        }
      }
      await enqueue(key, () => selectThumbnail(key, seq));
    },
    [draftsApi, enqueue, rec, run, selectThumbnail, updateThumbnail],
  );

  // ── publication ───────────────────────────────────────────────────────────

  const sendPublicationRef = useRef<(key: string) => Promise<void>>(async () => undefined);

  const sendPublication = useCallback(
    async (key: string): Promise<void> => {
      const record = rec(key);
      const operation = record?.publication;
      if (!record?.draftId || !operation) return;
      const draftId = record.draftId;
      try {
        const view = await run(() =>
          draftsApi.setPublication(draftId, {
            clientOperationId: operation.clientOperationId,
            expectedRevision: operation.expectedRevision,
            state: operation.state,
          }),
        );
        resetRetry(key, 'publish');
        await applyServerView(key, view);
        const latest = rec(key);
        if (latest) await putRecord({ ...latest, publication: null });
        setRuntime(key, {
          publish: 'idle',
          publishError: null,
          publishedJustNow: operation.state === 'published' && view.publicationState === 'published',
        });
      } catch (error) {
        if (isAuthenticationRefusal(error)) {
          // The command keeps its identity and is replayed after sign-in.
          setRuntime(key, { publish: 'auth_required', publishError: null });
          return;
        }
        if (isLostAnswer(error)) {
          const retrying = scheduleRetry(key, 'publish', TRANSIENT_RETRY_DELAYS_MS, () => {
            void enqueue(key, () => sendPublicationRef.current(key));
          });
          setRuntime(key, {
            publish: retrying ? 'verifying' : 'failed',
            publishError: retrying ? null : 'We could not confirm the publication yet. Check again.',
          });
          return;
        }
        // A definite answer: the command is settled one way or the other.
        const latest = rec(key);
        if (latest) await putRecord({ ...latest, publication: null });
        resetRetry(key, 'publish');
        const code = errorCode(error);
        if (code === DRAFT_ERROR_CODES.notReady) {
          try {
            await applyServerView(key, await run(() => draftsApi.get(draftId)));
          } catch {
            /* blockers stay as last known */
          }
          setRuntime(key, { publish: 'blocked', publishError: null });
          return;
        }
        if (code === DRAFT_ERROR_CODES.revisionConflict) {
          setRuntime(key, { publish: 'blocked', publishError: null });
          await enterConflict(key);
          return;
        }
        setRuntime(key, { publish: 'failed', publishError: describeDraftError(error) });
      }
    },
    [applyServerView, draftsApi, enqueue, enterConflict, putRecord, rec, resetRetry, run, scheduleRetry, setRuntime],
  );
  sendPublicationRef.current = sendPublication;

  const localPublishState = useCallback(
    (key: string, ignorePublishing = false): LocalPublishState => {
      const record = rec(key);
      const runtime = rt(key);
      return {
        unsavedEdits: hasPendingEdits(record?.pending) || runtime.save === 'saving' || runtime.save === 'scheduled',
        saveFailed: runtime.save === 'failed' || runtime.save === 'offline' || runtime.save === 'invalid',
        conflict: runtime.save === 'conflict',
        titleInvalid: record ? validateDraftFields(record.desired).some((problem) => problem.startsWith('TITLE')) : false,
        thumbnailUnsaved: !!record?.thumbnail && record.thumbnail.status !== 'selected',
        publishing:
          !ignorePublishing && (!!record?.publication || ['publishing', 'verifying'].includes(runtime.publish)),
        authRequired: runtime.save === 'auth_required' || runtime.publish === 'auth_required' || !!recovery?.blocked,
      };
    },
    [rec, recovery, rt],
  );

  const commandPublication = useCallback(
    async (key: string, state: DraftPublicationState) => {
      const before = rec(key);
      if (!before?.draftId || !before.server || before.publication) return;
      setRuntime(key, { publish: 'publishing', publishError: null, publishedJustNow: false });
      // Finish the autosave first and wait for its confirmation.
      await flushSave(key);
      await (chainsRef.current.get(key) ?? Promise.resolve());
      const record = rec(key);
      if (!record?.server || !record.draftId) {
        setRuntime(key, { publish: 'blocked', publishError: null });
        return;
      }
      if (state === 'published') {
        const { ready } = publishReadiness(record.server, localPublishState(key, true));
        if (!ready) {
          setRuntime(key, { publish: 'blocked', publishError: null });
          return;
        }
      } else if (hasPendingEdits(record.pending) || rt(key).save !== 'idle') {
        setRuntime(key, { publish: 'blocked', publishError: null });
        return;
      }
      // The revision is frozen here, under a durable identity, before sending.
      await putRecord({
        ...record,
        publication: {
          clientOperationId: crypto.randomUUID(),
          state,
          expectedRevision: record.server.revision,
          createdAt: nowIso(),
        },
      });
      await enqueue(key, () => sendPublication(key));
    },
    [enqueue, flushSave, localPublishState, putRecord, rec, rt, sendPublication, setRuntime],
  );

  // ── creation ──────────────────────────────────────────────────────────────

  const removeLocal = useCallback(
    async (key: string) => {
      if (!mountedRef.current) return;
      const record = rec(key);
      recordsRef.current.delete(key);
      runtimeRef.current.delete(key);
      if (record?.thumbnail?.blobKey) {
        memoryBlobsRef.current.delete(record.thumbnail.blobKey);
        await storeRef.current.removeBlob(record.thumbnail.blobKey).catch(() => undefined);
      }
      setPreview(key, null);
      await storeRef.current.remove(key).catch(() => undefined);
      for (const entry of queueRef.current.entries) {
        if (entry.creatorDraft?.clientDraftId === key) await queueRef.current.discardEntry(entry.localId);
      }
      setSelectedKey((current) => (current === key ? null : current));
      bump();
    },
    [bump, rec, setPreview],
  );

  const ensureCreatedRef = useRef<(key: string) => Promise<void>>(async () => undefined);

  const ensureCreated = useCallback(
    (key: string): Promise<void> => {
      const inFlight = creatingRef.current.get(key);
      if (inFlight) return inFlight;
      const task = (async () => {
        const record = rec(key);
        if (!record || record.draftId) return;
        setRuntime(key, { create: 'creating', createError: null });
        const creationBody = record.creationBody ?? {
          clientDraftId: key,
          channelId: record.channelId,
          title: record.desired.title.trim() || filenameStem(record.filename ?? 'Untitled video'),
          description: record.desired.description,
          tags: record.desired.tags,
        };
        if (!record.creationBody) await putRecord({ ...record, creationBody });
        if (!mountedRef.current) return;
        let view: CreatorDraftView;
        try {
          const result = await run(() => draftsApi.create(creationBody));
          view = result.draft;
        } catch (error) {
          if (isAuthenticationRefusal(error)) {
            setRuntime(key, { create: 'auth_required', createError: null });
            return;
          }
          if (isLostAnswer(error)) {
            const retrying = scheduleRetry(key, 'create', CREATE_RETRY_DELAYS_MS, () => {
              void ensureCreatedRef.current(key);
            });
            setRuntime(key, {
              create: retrying ? 'retry_wait' : 'failed',
              createError: retrying ? null : describeDraftError(error),
            });
            return;
          }
          setRuntime(key, { create: 'failed', createError: describeDraftError(error) });
          return;
        }
        resetRetry(key, 'create');
        if (deleteAfterCreateRef.current.delete(key)) {
          // Deleted while the creation was on the wire: delete what it created.
          await run(() => draftsApi.remove(view.id, view.revision)).catch(() => undefined);
          return;
        }
        const latest = rec(key);
        if (!latest) return;
        // Edits typed before the answer stay the creator's: they become the
        // first save, against the revision the server just returned.
        const pending = diffAgainstServer(latest.desired, view);
        await putRecord({ ...latest, draftId: view.id, server: view, pending });
        setRuntime(key, { create: 'idle', createError: null });
        await queueRef.current.attachDraftId(key, view.id);
        if (pending) void flushSave(key);
        if (latest.thumbnail && latest.thumbnail.status !== 'selected') void processThumbnail(key);
      })().finally(() => creatingRef.current.delete(key));
      creatingRef.current.set(key, task);
      return task;
    },
    [draftsApi, flushSave, processThumbnail, putRecord, rec, resetRetry, run, scheduleRetry, setRuntime],
  );
  ensureCreatedRef.current = ensureCreated;

  // ── refresh from the server ──────────────────────────────────────────────

  const refreshing = useRef(new Set<string>());
  const refresh = useCallback(
    async (key: string) => {
      const record = rec(key);
      if (!record?.draftId || refreshing.current.has(key)) return;
      refreshing.current.add(key);
      try {
        const view = await run(() => draftsApi.get(record.draftId as string));
        await applyServerView(key, view, undefined, true);
        if (rt(key).gone) setRuntime(key, { gone: false });
      } catch (error) {
        if (isGoneError(error)) setRuntime(key, { gone: true });
      } finally {
        refreshing.current.delete(key);
      }
    },
    [applyServerView, draftsApi, rec, rt, run, setRuntime],
  );

  /** Merges server projections, creating records for drafts this device did not know. */
  const mergeServerViews = useCallback(
    async (views: readonly CreatorDraftView[]) => {
      for (const view of views) {
        const existing = Array.from(recordsRef.current.values()).find((record) => record.draftId === view.id);
        if (existing) {
          // eslint-disable-next-line no-await-in-loop
          await applyServerView(existing.clientDraftId, view, undefined, true);
          continue;
        }
        const key = `${SERVER_KEY_PREFIX}${view.id}`;
        const record: DraftWorkspaceRecord = {
          clientDraftId: key,
          draftId: view.id,
          channelId: view.channelId,
          filename: null,
          desired: { title: view.title, description: view.description, tags: view.tags },
          pending: null,
          server: view,
          thumbnail: null,
          publication: null,
          createdAt: view.updatedAt,
          updatedAt: nowIso(),
        };
        // eslint-disable-next-line no-await-in-loop
        await putRecord(record);
      }
    },
    [applyServerView, putRecord],
  );

  // ── boot: device records first, then the server list ─────────────────────
  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    void (async () => {
      let records: DraftWorkspaceRecord[] = [];
      try {
        records = await storeRef.current.list();
      } catch {
        records = [];
      }
      if (cancelled) return;
      const now = Date.now();
      for (const record of records) {
        const idle =
          record.server?.publicationState === 'published' &&
          !hasPendingEdits(record.pending) &&
          !record.publication &&
          (!record.thumbnail || record.thumbnail.status === 'selected');
        if ((record.dismissed || idle) && now - new Date(record.updatedAt).getTime() > PUBLISHED_RECORD_TTL_MS) {
          void storeRef.current.remove(record.clientDraftId).catch(() => undefined);
          if (record.thumbnail?.blobKey) void storeRef.current.removeBlob(record.thumbnail.blobKey).catch(() => undefined);
          continue;
        }
        recordsRef.current.set(record.clientDraftId, record);
        if (record.publication) runtimeRef.current.set(record.clientDraftId, { ...IDLE_RUNTIME, publish: 'verifying' });
        if (record.thumbnail?.kind === 'custom' && record.thumbnail.blobKey) {
          const blobKey = record.thumbnail.blobKey;
          const key = record.clientDraftId;
          void storeRef.current
            .getBlob(blobKey)
            .then((blob) => {
              if (blob && !isCancelled()) setPreview(key, blob);
            })
            .catch(() => undefined);
        }
      }
      bump();
      setLocalReady(true);
      // Something of this account is already in preparation on this device:
      // reconcile it with the server without waiting for the workspace page.
      if (recordsRef.current.size > 0 || queueRef.current.entries.some((entry) => entry.creatorDraft)) {
        setServerWanted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Boot once per mounted account; the provider remounts on account change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── then the server list, once, when the workspace is needed ─────────────
  // Not on every page of the app for every signed-in account: only once the
  // workspace is opened (`activate`) or this device already holds drafts.
  const serverBootedRef = useRef(false);
  useEffect(() => {
    if (!localReady || !serverWanted || serverBootedRef.current) return;
    serverBootedRef.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const page = await run(() => draftsApi.list({ state: 'draft', limit: LIST_PAGE_SIZE }));
        if (cancelled) return;
        await mergeServerViews(page.items);
        setNextCursor(page.nextCursor);
        setListError(null);
        const listed = new Set(page.items.map((item) => item.id));
        const unlisted = Array.from(recordsRef.current.values())
          .filter((record) => record.draftId && !listed.has(record.draftId))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, LIST_PAGE_SIZE);
        for (const record of unlisted) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const view = await run(() => draftsApi.get(record.draftId as string));
            // eslint-disable-next-line no-await-in-loop
            await applyServerView(record.clientDraftId, view, undefined, true);
          } catch (error) {
            // Deleted elsewhere: nothing local is worth keeping for a draft that is gone.
            if (isGoneError(error)) {
              // eslint-disable-next-line no-await-in-loop
              await removeLocal(record.clientDraftId);
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setListError(
            isAuthenticationRefusal(error)
              ? 'Sign in again to see your drafts.'
              : 'Your saved drafts could not be loaded. What is on this device is shown.',
          );
        }
      }
      if (cancelled) return;
      setHydrated(true);

      // Finish what the reload interrupted, in identity order.
      for (const record of Array.from(recordsRef.current.values())) {
        const key = record.clientDraftId;
        if (!record.draftId) {
          void ensureCreated(key);
          continue;
        }
        if (hasPendingEdits(record.pending)) void flushSave(key);
        if (record.thumbnail && record.thumbnail.status !== 'selected') void processThumbnail(key);
        if (record.publication) void enqueue(key, () => sendPublication(key));
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once; the callbacks it uses are stable for the mounted account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localReady, serverWanted]);

  const activate = useCallback(() => setServerWanted(true), []);

  // ── bind queue rows to their drafts ──────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    for (const entry of queue.entries) {
      const binding = entry.creatorDraft;
      if (!binding) continue;
      const record = rec(binding.clientDraftId);
      if (record?.draftId && binding.draftId !== record.draftId) {
        void queue.attachDraftId(binding.clientDraftId, record.draftId);
      }
    }
  }, [hydrated, queue, rec, version]);

  // A transfer changing phase is news the server projection should reflect.
  const lastPhaseRef = useRef(new Map<string, string>());
  useEffect(() => {
    for (const entry of queue.entries) {
      const key = entry.creatorDraft?.clientDraftId;
      if (!key) continue;
      const signature = `${entry.status}|${entry.videoStatus ?? ''}|${uploadPhase(entry)}`;
      if (lastPhaseRef.current.get(entry.localId) === signature) continue;
      lastPhaseRef.current.set(entry.localId, signature);
      if (['uploaded', 'processing', 'ready', 'aborted', 'failed', 'held'].includes(entry.status)) void refresh(key);
    }
  }, [queue.entries, refresh]);

  // ── periodic refresh of drafts still being prepared ──────────────────────
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (cancelled) return;
      if (!recovery?.blocked) {
        const working = Array.from(recordsRef.current.values())
          .filter(
            (record) =>
              record.server &&
              !record.server.playbackReady &&
              (record.server.uploadId !== null || record.server.transferConfirmed) &&
              ['none', 'wait'].includes(record.server.recovery.action) &&
              !rt(record.clientDraftId).gone,
          )
          .slice(0, MAX_REFRESH_PER_TICK);
        for (const record of working) {
          // eslint-disable-next-line no-await-in-loop
          await refresh(record.clientDraftId);
        }
      }
      if (!cancelled) {
        timer = setTimeout(() => void tick(), document.hidden ? REFRESH_HIDDEN_MS : REFRESH_VISIBLE_MS);
      }
    };
    timer = setTimeout(() => void tick(), REFRESH_VISIBLE_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hydrated, recovery, refresh, rt]);

  /** One bounded pass over everything waiting on the network or on a session. */
  const reconcile = useCallback(() => {
    for (const record of Array.from(recordsRef.current.values())) {
      const key = record.clientDraftId;
      const runtime = rt(key);
      if (!record.draftId) {
        if (runtime.create !== 'creating' && runtime.create !== 'failed') {
          resetRetry(key, 'create');
          void ensureCreated(key);
        }
        continue;
      }
      if (hasPendingEdits(record.pending) && ['offline', 'auth_required', 'failed'].includes(runtime.save)) {
        resetRetry(key, 'save');
        void flushSave(key);
      }
      if (record.publication && runtime.publish !== 'publishing') {
        resetRetry(key, 'publish');
        void enqueue(key, () => sendPublication(key));
      }
      if (record.thumbnail?.status === 'failed' && record.thumbnail.errorCode === 'AUTH_REQUIRED') {
        void processThumbnail(key);
      }
    }
  }, [enqueue, ensureCreated, flushSave, processThumbnail, resetRetry, rt, sendPublication]);

  useEffect(() => {
    if (!hydrated) return;
    let last = 0;
    const onWake = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - last < 5_000) return;
      last = now;
      reconcile();
    };
    window.addEventListener('online', onWake);
    document.addEventListener('visibilitychange', onWake);
    const unsubscribe = recovery?.subscribe((blocked) => {
      if (!blocked) reconcile();
      else bump();
    });
    return () => {
      window.removeEventListener('online', onWake);
      document.removeEventListener('visibilitychange', onWake);
      unsubscribe?.();
    };
  }, [bump, hydrated, reconcile, recovery]);

  // ── public actions ───────────────────────────────────────────────────────

  const addFiles = useCallback(
    async (files: readonly File[], channelId: number) => {
      const { accepted, rejected } = await queueRef.current.enqueueDraftFiles(files, channelId);
      const added: string[] = [];
      for (const entry of accepted) {
        const key = entry.creatorDraft!.clientDraftId;
        const createdAt = nowIso();
        // eslint-disable-next-line no-await-in-loop
        await putRecord({
          clientDraftId: key,
          draftId: null,
          channelId,
          filename: entry.filename,
          desired: { title: filenameStem(entry.filename), description: null, tags: null },
          pending: null,
          server: null,
          thumbnail: null,
          publication: null,
          createdAt,
          updatedAt: createdAt,
        });
        added.push(key);
        void ensureCreated(key);
      }
      // Adding files never takes the editor away from the video being edited.
      setSelectedKey((current) => current ?? added[0] ?? null);
      return { added, rejected };
    },
    [ensureCreated, putRecord],
  );

  const edit = useCallback(
    (key: string, patch: DraftFieldPatch) => {
      const record = rec(key);
      if (!record) return;
      const pending = mergePendingEdits(record.pending, patch);
      void putRecord({ ...record, desired: { ...record.desired, ...patch }, pending });
      const runtime = rt(key);
      if (runtime.save !== 'conflict') setRuntime(key, { save: 'scheduled', saveError: null });
      const existing = debounceRef.current.get(key);
      if (existing) clearTimeout(existing);
      debounceRef.current.set(
        key,
        setTimeout(() => {
          debounceRef.current.delete(key);
          void flushSave(key);
        }, AUTOSAVE_DEBOUNCE_MS),
      );
    },
    [flushSave, putRecord, rec, rt, setRuntime],
  );

  const commit = useCallback((key: string) => void flushSave(key), [flushSave]);

  const retrySave = useCallback(
    (key: string) => {
      resetRetry(key, 'save');
      if (rt(key).save !== 'conflict') setRuntime(key, { save: 'scheduled', saveError: null });
      void flushSave(key);
    },
    [flushSave, resetRetry, rt, setRuntime],
  );

  const resolveConflict = useCallback(
    async (key: string, choice: 'reload' | 'keep') => {
      const record = rec(key);
      let server = rt(key).conflict;
      if (!record?.draftId) return;
      if (!server) {
        try {
          server = await run(() => draftsApi.get(record.draftId as string));
        } catch (error) {
          setRuntime(key, { saveError: describeDraftError(error) });
          return;
        }
      }
      if (choice === 'reload') {
        // The saved version replaces the local one, including the thumbnail choice.
        await putRecord({
          ...record,
          server,
          pending: null,
          desired: { title: server.title, description: server.description, tags: server.tags },
          thumbnail: null,
        });
        setPreview(key, null);
        setRuntime(key, { save: 'idle', saveError: null, conflict: null });
        return;
      }
      // Keep mine: explicitly re-apply every local value on the current revision.
      const pending = diffAgainstServer(record.desired, server);
      await putRecord({ ...record, server, pending });
      setRuntime(key, { save: pending ? 'scheduled' : 'idle', saveError: null, conflict: null });
      if (pending) await flushSave(key);
      if (record.thumbnail && record.thumbnail.status !== 'selected') void processThumbnail(key);
    },
    [draftsApi, flushSave, processThumbnail, putRecord, rec, rt, run, setPreview, setRuntime],
  );

  const chooseThumbnailFile = useCallback(
    async (key: string, image: Blob, filename: string, source: 'import' | 'ai'): Promise<ThumbnailChoiceResult> => {
      const record = rec(key);
      if (!record) return { ok: false, message: 'This draft is no longer open.' };
      const accepted = source === 'ai' ? await asAcceptedImage(image) : image;
      if (!accepted || !THUMBNAIL_TYPES.includes(accepted.type)) {
        return { ok: false, message: 'Choose a JPG or PNG image.' };
      }
      if (accepted.size > THUMBNAIL_MAX_BYTES) return { ok: false, message: 'This image is over the 5 MB limit.' };
      const latest = rec(key) ?? record;
      const seq = (latest.thumbnail?.seq ?? 0) + 1;
      const clientAssetId = crypto.randomUUID();
      const blobKey = `${key}:${clientAssetId}`;
      memoryBlobsRef.current.set(blobKey, accepted);
      let blobPersisted = true;
      try {
        await storeRef.current.putBlob(blobKey, accepted);
        blobPersisted = storeRef.current.durable;
      } catch {
        blobPersisted = false;
      }
      const previousBlob = latest.thumbnail?.blobKey;
      await putRecord({
        ...latest,
        thumbnail: {
          seq,
          kind: 'custom',
          source,
          clientAssetId,
          blobKey,
          blobPersisted,
          filename: source === 'ai' ? 'ai-thumbnail.jpg' : filename,
          assetId: null,
          status: 'pending_upload',
          errorCode: null,
          errorMessage: null,
        },
      });
      setPreview(key, accepted);
      if (previousBlob && previousBlob !== blobKey) {
        memoryBlobsRef.current.delete(previousBlob);
        void storeRef.current.removeBlob(previousBlob).catch(() => undefined);
      }
      void processThumbnail(key);
      return {
        ok: true,
        message: blobPersisted
          ? null
          : 'This browser will not keep the image if the page reloads before it is saved.',
      };
    },
    [processThumbnail, putRecord, rec, setPreview],
  );

  const chooseAutomaticThumbnail = useCallback(
    (key: string) => {
      const record = rec(key);
      if (!record) return;
      const previousBlob = record.thumbnail?.blobKey;
      void putRecord({
        ...record,
        thumbnail: {
          seq: (record.thumbnail?.seq ?? 0) + 1,
          kind: 'automatic',
          source: 'automatic',
          clientAssetId: null,
          blobKey: null,
          blobPersisted: true,
          filename: null,
          assetId: null,
          status: 'selecting',
          errorCode: null,
          errorMessage: null,
        },
      }).then(() => void processThumbnail(key));
      setPreview(key, null);
      if (previousBlob) {
        memoryBlobsRef.current.delete(previousBlob);
        void storeRef.current.removeBlob(previousBlob).catch(() => undefined);
      }
    },
    [processThumbnail, putRecord, rec, setPreview],
  );

  const retryThumbnail = useCallback((key: string) => void processThumbnail(key), [processThumbnail]);

  const deleteDraft = useCallback(
    async (key: string): Promise<boolean> => {
      const record = rec(key);
      if (!record) return true;
      setRuntime(key, { deleting: true, deleteError: null });
      if (!record.draftId) {
        if (creatingRef.current.has(key)) deleteAfterCreateRef.current.add(key);
        await removeLocal(key);
        return true;
      }
      const draftId = record.draftId;
      let deleted = false;
      await enqueue(key, async () => {
        const revision = rec(key)?.server?.revision ?? record.server?.revision ?? 0;
        try {
          await run(() => draftsApi.remove(draftId, revision));
          deleted = true;
        } catch (error) {
          if (isGoneError(error)) {
            deleted = true;
            return;
          }
          if (error instanceof UploadApiError && (error.status === 409 || error.status === 412)) {
            await refresh(key);
            setRuntime(key, {
              deleting: false,
              deleteError: 'This draft changed since you opened it. Review it, then delete it again.',
            });
            return;
          }
          setRuntime(key, { deleting: false, deleteError: describeDraftError(error) });
        }
      });
      if (deleted) await removeLocal(key);
      return deleted;
    },
    [draftsApi, enqueue, rec, refresh, removeLocal, run, setRuntime],
  );

  const attachFile = useCallback(
    async (key: string, file: File): Promise<string | null> => {
      const record = rec(key);
      if (!record) return 'This draft is no longer open.';
      const q = queueRef.current;
      let entry = newestEntryFor(q.entries, key);
      // An expired attempt cannot be resumed: a fresh `clientAttemptId` goes
      // to the same draft (metadata and thumbnail survive).
      if (record.server?.recovery.action === 'replace_file') {
        if (record.server.videoId !== null) return "This video's file can no longer be replaced.";
        if (entry) await q.discardEntry(entry.localId);
        entry = null;
        const fresh = await q.enqueueDraftAttempt(file, record.channelId, {
          clientDraftId: key,
          draftId: record.draftId,
        });
        return fresh.entry ? null : (fresh.rejected?.message ?? 'This file cannot be uploaded.');
      }
      if (entry?.status === 'reselect_required') {
        return (await q.reselectForEntry(entry.localId, file))
          ? null
          : `This is not the same file. Choose “${entry.filename}” again.`;
      }
      if (entry && ['held'].includes(entry.status)) {
        return 'We could not confirm the previous attempt started, so a new one is not allowed yet.';
      }
      const server = record.server;
      const serverAttemptOpen =
        !!server?.uploadId &&
        !server.transferConfirmed &&
        (server.uploadState === 'initiated' || server.uploadState === 'uploading') &&
        !entry;
      if (serverAttemptOpen && server?.uploadId && record.draftId) {
        try {
          const summary = await run(() => uploadsApi.get(server.uploadId as string));
          const adopted = await q.adoptDraftAttempt(summary, { clientDraftId: key, draftId: record.draftId });
          return (await q.reselectForEntry(adopted.localId, file))
            ? null
            : `This is not the same file. Choose “${adopted.filename}”.`;
        } catch (error) {
          return describeDraftError(error);
        }
      }
      if (entry && ['failed', 'aborted'].includes(entry.status)) await q.removeEntry(entry.localId);
      const result = await q.enqueueDraftAttempt(file, record.channelId, {
        clientDraftId: key,
        draftId: record.draftId,
      });
      return result.entry ? null : (result.rejected?.message ?? 'This file cannot be uploaded.');
    },
    [rec, run, uploadsApi],
  );

  /**
   * One picker for every draft waiting for its file (after a reload, or on
   * another device): each chosen file resumes the attempt it matches — same
   * name, size and type — so only the missing parts are sent. Files that
   * match nothing are handed back, never turned into new drafts here.
   */
  const resumeWithFiles = useCallback(async (files: readonly File[]) => {
    const q = queueRef.current;
    const used = new Set<string>();
    const unmatched: File[] = [];
    let resumed = 0;
    for (const file of files) {
      let matched = false;
      for (const entry of q.entries) {
        if (!entry.creatorDraft || entry.status !== 'reselect_required' || used.has(entry.localId)) continue;
        // eslint-disable-next-line no-await-in-loop
        if (await q.reselectForEntry(entry.localId, file)) {
          used.add(entry.localId);
          resumed += 1;
          matched = true;
          break;
        }
      }
      if (!matched) unmatched.push(file);
    }
    return { resumed, unmatched };
  }, []);

  // A server attempt this device has no row for (another browser, cleared
  // storage): read its summary once so the page can name the file it needs.
  const adoptedRef = useRef(new Set<string>());
  useEffect(() => {
    if (!hydrated) return;
    const q = queueRef.current;
    const open = Array.from(recordsRef.current.values()).filter((record) => {
      const server = record.server;
      return (
        !!record.draftId &&
        !!server?.uploadId &&
        !server.transferConfirmed &&
        (server.uploadState === 'initiated' || server.uploadState === 'uploading') &&
        server.recovery.action !== 'replace_file' &&
        !adoptedRef.current.has(server.uploadId) &&
        !q.entries.some((entry) => entry.uploadId === server.uploadId || entry.creatorDraft?.clientDraftId === record.clientDraftId)
      );
    });
    for (const record of open.slice(0, 10)) {
      const uploadId = record.server!.uploadId as string;
      adoptedRef.current.add(uploadId);
      void run(() => uploadsApi.get(uploadId))
        .then((summary) =>
          q.adoptDraftAttempt(summary, { clientDraftId: record.clientDraftId, draftId: record.draftId }),
        )
        // Unreadable for now: the row keeps its generic "choose the same file"
        // state; it is read again on the next visit, not in a loop.
        .catch(() => undefined);
    }
  }, [hydrated, run, uploadsApi, version]);

  /**
   * Restarts a failed preparation without sending the bytes again. Before the
   * video exists it is the draft route (inspection retry); once it exists, the
   * existing video retry route — as the contract prescribes.
   */
  const retryProcessing = useCallback(
    async (key: string): Promise<string | null> => {
      const record = rec(key);
      const server = record?.server;
      if (!record?.draftId || !server) return 'This video is not ready to retry yet.';
      const draftId = record.draftId;
      try {
        if (server.videoId === null) {
          // In the draft's serial chain, with the revision the last mutation returned.
          let failure: unknown = null;
          await enqueue(key, async () => {
            const current = rec(key)?.server ?? server;
            try {
              await applyServerView(
                key,
                await run(() => draftsApi.retryProcessing(draftId, { expectedRevision: current.revision })),
              );
            } catch (error) {
              failure = error;
            }
          });
          if (failure) throw failure;
          return null;
        }
        await retryVideoProcessing(server.videoId);
        await refresh(key);
        return null;
      } catch (error) {
        const code = errorCode(error);
        if (code === DRAFT_ERROR_CODES.originalUnavailable) {
          return 'The original file is no longer kept. Send the file again.';
        }
        if (code === DRAFT_ERROR_CODES.videoAlreadyExists) {
          await refresh(key);
          return 'Preparation already restarted.';
        }
        return 'Preparation could not be restarted. Try again in a moment.';
      }
    },
    [applyServerView, draftsApi, enqueue, rec, refresh, run],
  );

  // ── server preview: owner-only URLs that expire after five minutes ───────
  const [previews, setPreviews] = useState<Record<string, DraftPreviewData>>({});
  const previewLoadingRef = useRef(new Set<string>());
  const loadPreview = useCallback(
    async (key: string) => {
      const draftId = rec(key)?.draftId;
      if (!draftId || previewLoadingRef.current.has(key)) return;
      previewLoadingRef.current.add(key);
      try {
        const preview = await run(() => draftsApi.getPreview(draftId));
        if (mountedRef.current) setPreviews((current) => ({ ...current, [key]: preview }));
      } catch {
        /* the preview is optional: the editor keeps its placeholder */
      } finally {
        previewLoadingRef.current.delete(key);
      }
    },
    [draftsApi, rec, run],
  );

  const retryCreate = useCallback(
    (key: string) => {
      resetRetry(key, 'create');
      void ensureCreated(key);
    },
    [ensureCreated, resetRetry],
  );

  const dismiss = useCallback(
    (key: string) => {
      const record = rec(key);
      if (!record || record.server?.publicationState !== 'published') return;
      void putRecord({ ...record, dismissed: true });
      setSelectedKey((current) => (current === key ? null : current));
    },
    [putRecord, rec],
  );

  /** Opens a draft by its server id (a bookmark, "Continue preparing"), loading it if needed. */
  const open = useCallback(
    async (draftId: string): Promise<string | null> => {
      const known = Array.from(recordsRef.current.values()).find((record) => record.draftId === draftId);
      if (known) {
        if (known.dismissed) await putRecord({ ...known, dismissed: false });
        setSelectedKey(known.clientDraftId);
        return known.clientDraftId;
      }
      try {
        const view = await run(() => draftsApi.get(draftId));
        await mergeServerViews([view]);
        const loaded = Array.from(recordsRef.current.values()).find((record) => record.draftId === draftId);
        if (!loaded) return null;
        setSelectedKey(loaded.clientDraftId);
        return loaded.clientDraftId;
      } catch {
        return null;
      }
    },
    [draftsApi, mergeServerViews, putRecord, run],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    try {
      const page = await run(() => draftsApi.list({ state: 'draft', limit: LIST_PAGE_SIZE, cursor: nextCursor }));
      await mergeServerViews(page.items);
      setNextCursor(page.nextCursor);
      setListError(null);
    } catch {
      setListError('More drafts could not be loaded. Try again.');
    }
  }, [draftsApi, mergeServerViews, nextCursor, run]);

  // ── derived view ─────────────────────────────────────────────────────────

  const items = useMemo<WorkspaceDraft[]>(
    () =>
      Array.from(recordsRef.current.values())
        .filter((record) => !record.dismissed)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((record) => ({
          key: record.clientDraftId,
          record,
          runtime: rt(record.clientDraftId),
          entry: newestEntryFor(queue.entries, record.clientDraftId),
        })),
    // `version` is the change signal for the ref-held records.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queue.entries, version, rt],
  );

  const waitingForFile = useMemo(
    () =>
      items
        .filter(({ entry }) => entry?.status === 'reselect_required')
        .map(({ key, record, entry }) => ({
          key,
          title: record.desired.title.trim() || entry!.filename,
          filename: entry!.filename,
          sizeBytes: entry!.sizeBytes,
        })),
    [items],
  );

  const atRisk = useMemo(
    () =>
      items.some(
        ({ record }) =>
          record.draftId === null ||
          hasPendingEdits(record.pending) ||
          !!record.publication ||
          (!!record.thumbnail && record.thumbnail.status !== 'selected'),
      ),
    [items],
  );

  const findByDraftId = useCallback(
    (draftId: string) => items.find((item) => item.record.draftId === draftId),
    [items],
  );

  const readiness = useCallback(
    (key: string) => publishReadiness(rec(key)?.server ?? null, localPublishState(key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localPublishState, rec, version],
  );

  return {
    activate,
    hydrated,
    preview: (key: string) => previews[key] ?? null,
    loadPreview,
    durable: storeRef.current.durable,
    items,
    listError,
    hasMore: nextCursor !== null,
    loadMore,
    selectedKey,
    select: setSelectedKey,
    open,
    findByDraftId,
    addFiles,
    edit,
    commit,
    retrySave,
    resolveConflict,
    chooseThumbnailFile,
    chooseAutomaticThumbnail,
    retryThumbnail,
    thumbnailPreviewUrl: (key: string) => previewUrls[key] ?? null,
    publish: (key: string) => commandPublication(key, 'published'),
    unpublish: (key: string) => commandPublication(key, 'draft'),
    verifyPublication: (key: string) => {
      resetRetry(key, 'publish');
      setRuntime(key, { publish: 'verifying', publishError: null });
      void enqueue(key, () => sendPublication(key));
    },
    deleteDraft,
    attachFile,
    waitingForFile,
    resumeWithFiles,
    retryProcessing,
    retryCreate,
    dismiss,
    atRisk,
    readiness,
  };
}

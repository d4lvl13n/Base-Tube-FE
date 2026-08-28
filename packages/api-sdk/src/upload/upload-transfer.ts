/**
 * One upload, end to end: create the server row, push the parts straight to
 * storage, and hand the server an authoritative part list to complete with.
 *
 * Rewritten from the AmazingAerial `upload-transfer.ts` for the merged
 * `video_uploads` row (contract §6.1) and the multipart-only policy (§4);
 * the algorithm is the one in `UPLOAD_V2_IMPLEMENTATION_GUIDE.md` §6.2.
 *
 * Two invariants are load-bearing:
 *  - the client never decides what was uploaded. `ListParts` on the server is
 *    the only source of truth for which parts exist, because a PUT can succeed
 *    without the browser ever seeing the response (CORS, a dropped socket).
 *  - a part is only re-sent when the server says it is missing, so a resume
 *    after a reload costs only the bytes that never landed.
 */
import type { CompletedPart, CompleteUploadBody, MultipartPartCapability } from './contracts';
import {
  abortableSleep,
  DirectUploadError,
  normalizeEtag,
  putBlobWithProgress,
} from './direct-upload-transport';
import { UploadApiError, type UploadApi } from './endpoints';
import { isTerminalServerStatus, statusFromServer } from './status';
import type { UploadQueueEntry } from './types';

const MULTIPART_CONCURRENCY = 3;
const CAPABILITY_BATCH = 10;
const COMPLETION_RETRY_SECONDS = 120;
const MAX_INITIALIZATION_ATTEMPTS = 30;
const MAX_COMPLETION_ROUNDS = 5;

export interface UploadTransferDependencies {
  api: UploadApi;
  putBlob: typeof putBlobWithProgress;
  sleep: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  /**
   * Awaited immediately before `PUT .../completion`.
   *
   * Completion is the moment the backend creates the `Video` row, after which
   * `PATCH /videos/uploads/:id` answers 409 `UPLOAD_STATE_CONFLICT`. The queue
   * uses this to flush its debounced draft-metadata PATCH while it can still
   * land, so the title the creator typed is the title that gets published.
   */
  beforeComplete?: () => void | Promise<void>;
}

export type QueueEntryUpdate = (
  patch: Partial<UploadQueueEntry>,
  options?: { persist?: boolean },
) => void | Promise<void>;

/** Builds the default dependency set for a given client. */
export function createTransferDependencies(
  api: UploadApi,
  overrides: Partial<Omit<UploadTransferDependencies, 'api'>> = {},
): UploadTransferDependencies {
  return { api, putBlob: putBlobWithProgress, sleep: abortableSleep, ...overrides };
}

function isCompletedPartsRenewalError(error: unknown): boolean {
  return (
    error instanceof UploadApiError &&
    error.code === 'UPLOAD_PARTS_INVALID' &&
    /completed parts cannot be renewed/iu.test(error.message)
  );
}

function partBlob(file: File, partNumber: number, partSizeBytes: number): Blob {
  const start = (partNumber - 1) * partSizeBytes;
  return file.slice(start, Math.min(start + partSizeBytes, file.size));
}

function sortParts(parts: readonly CompletedPart[]): CompletedPart[] {
  return [...parts].sort((a, b) => a.partNumber - b.partNumber);
}

/**
 * Builds the completion claim.
 *
 * `parts` is always the server's own `completedParts` list, so its ETags are
 * the authoritative ones. If even that list has no ETag for a part there is
 * nothing legitimate left to send — the backend requires `z.string().min(1)`
 * — so this fails loudly rather than posting a body that is a guaranteed 400.
 */
function completionBody(parts: readonly CompletedPart[]): CompleteUploadBody {
  return {
    parts: sortParts(parts).map(({ partNumber, etag }) => {
      const normalized = normalizeEtag(etag);
      if (!normalized) {
        throw new DirectUploadError(
          'Storage did not report an ETag for every part',
          null,
          'CAPABILITY_INVALID',
        );
      }
      return { partNumber, etag: normalized };
    }),
  };
}

/**
 * Creates the server row, retrying while the multipart initialization lease is
 * held by another in-flight request (202, §7.2). The `clientAttemptId` makes
 * every retry a replay of the same attempt, never a second upload.
 */
async function ensureUpload(
  entry: UploadQueueEntry,
  file: File,
  dependencies: UploadTransferDependencies,
  update: QueueEntryUpdate,
  signal?: AbortSignal,
): Promise<{ capabilities: MultipartPartCapability[] }> {
  if (entry.uploadId) return { capabilities: [] };

  const body = {
    clientAttemptId: entry.clientAttemptId,
    channelId: entry.channelId,
    title: entry.title,
    description: entry.description,
    isPublic: entry.isPublic,
    tags: entry.tags,
    filename: entry.filename,
    declaredContentType: entry.contentType,
    declaredSizeBytes: file.size,
    lastModifiedAt: entry.lastModified > 0 ? new Date(entry.lastModified).toISOString() : null,
  };

  for (let attempt = 0; attempt < MAX_INITIALIZATION_ATTEMPTS; attempt += 1) {
    const result = await dependencies.api.create(body);
    if (result.kind === 'ready') {
      entry.uploadId = result.data.uploadId;
      entry.partSizeBytes = result.data.partSizeBytes;
      entry.partCount = result.data.partCount;
      await update({
        uploadId: entry.uploadId,
        partSizeBytes: entry.partSizeBytes,
        partCount: entry.partCount,
        status: 'uploading',
      });
      return { capabilities: result.data.capabilities ?? [] };
    }
    if (result.data.uploadId) {
      entry.uploadId = result.data.uploadId;
      await update({ uploadId: entry.uploadId });
    }
    await dependencies.sleep(Math.max(1, result.data.retryAfterSeconds) * 1_000, signal);
  }

  throw new DirectUploadError(
    'The upload could not be initialized in time',
    null,
    'UPLOAD_INITIALIZATION_TIMEOUT',
  );
}

/**
 * Signs every missing part, ten at a time (the server's per-request ceiling).
 * A part the server refuses to sign is only acceptable when `ListParts`
 * already has it — otherwise the geometry is wrong and retrying cannot help.
 */
async function capabilitiesForParts(
  uploadId: string,
  partNumbers: readonly number[],
  dependencies: UploadTransferDependencies,
  seeded: ReadonlyMap<number, MultipartPartCapability>,
): Promise<{ capabilities: Map<number, MultipartPartCapability>; alreadyComplete: Set<number> }> {
  const capabilities = new Map<number, MultipartPartCapability>();
  for (const partNumber of partNumbers) {
    const existing = seeded.get(partNumber);
    if (existing) capabilities.set(partNumber, existing);
  }
  const alreadyComplete = new Set<number>();
  let remaining = partNumbers.filter((partNumber) => !capabilities.has(partNumber));

  while (remaining.length > 0) {
    const requested = remaining.slice(0, CAPABILITY_BATCH);
    try {
      const response = await dependencies.api.renewCapabilities(uploadId, requested);
      for (const capability of response.capabilities ?? []) {
        capabilities.set(capability.partNumber, capability);
      }
      const unsigned = requested.filter((partNumber) => !capabilities.has(partNumber));
      if (unsigned.length > 0) {
        const state = await dependencies.api.getState(uploadId);
        const completed = new Set(state.completedParts.map((part) => part.partNumber));
        for (const partNumber of unsigned) {
          if (!completed.has(partNumber)) {
            throw new DirectUploadError(
              'Not every multipart capability was returned',
              null,
              'CAPABILITY_INVALID',
            );
          }
          alreadyComplete.add(partNumber);
        }
      }
    } catch (error) {
      if (!isCompletedPartsRenewalError(error)) throw error;
      const state = await dependencies.api.getState(uploadId);
      const completed = new Set(state.completedParts.map((part) => part.partNumber));
      for (const partNumber of requested) {
        if (completed.has(partNumber)) alreadyComplete.add(partNumber);
      }
      if (requested.every((partNumber) => !alreadyComplete.has(partNumber))) throw error;
    }
    remaining = remaining.slice(requested.length);
  }

  return { capabilities, alreadyComplete };
}

async function listedCompletedPart(
  uploadId: string,
  partNumber: number,
  dependencies: UploadTransferDependencies,
): Promise<CompletedPart | null> {
  const state = await dependencies.api.getState(uploadId);
  return state.completedParts.find((part) => part.partNumber === partNumber) ?? null;
}

/** Pushes every missing part, three at a time, and returns the server's view. */
async function transferParts(
  entry: UploadQueueEntry,
  file: File,
  uploadId: string,
  partSizeBytes: number,
  partCount: number,
  known: readonly CompletedPart[],
  seededCapabilities: ReadonlyMap<number, MultipartPartCapability>,
  dependencies: UploadTransferDependencies,
  update: QueueEntryUpdate,
  signal?: AbortSignal,
): Promise<CompletedPart[]> {
  const completed = new Map(known.map((part) => [part.partNumber, part]));
  const missing = Array.from({ length: partCount }, (_, index) => index + 1).filter(
    (partNumber) => !completed.has(partNumber),
  );

  if (missing.length > 0) {
    const { capabilities } = await capabilitiesForParts(
      uploadId,
      missing,
      dependencies,
      seededCapabilities,
    );

    const inFlight = new Map<number, number>();
    // A PUT can succeed without JavaScript seeing the ETag (bucket CORS).
    // Those bytes are real, so they count towards progress even though the
    // authoritative part list has not caught up yet.
    const awaitingAuthoritativeReceipt = new Map<number, number>();
    let cursor = 0;

    const emitProgress = () => {
      const persisted = [...completed.values()].reduce((sum, part) => sum + part.sizeBytes, 0);
      const awaiting = [...awaitingAuthoritativeReceipt.values()].reduce((sum, value) => sum + value, 0);
      const loaded = persisted + awaiting + [...inFlight.values()].reduce((sum, value) => sum + value, 0);
      void update({ progress: Math.min(99, Math.round((loaded / file.size) * 100)) }, { persist: false });
    };

    const recordCompleted = async (part: CompletedPart) => {
      completed.set(part.partNumber, part);
      entry.completedParts = sortParts([...completed.values()]);
      await update({ completedParts: entry.completedParts });
    };

    const worker = async () => {
      while (cursor < missing.length) {
        const partNumber = missing[cursor++]!;
        if (completed.has(partNumber)) continue;
        let capability = capabilities.get(partNumber);
        if (!capability) {
          const listed = await listedCompletedPart(uploadId, partNumber, dependencies);
          if (!listed) {
            throw new DirectUploadError(
              'Not every multipart capability was returned',
              null,
              'CAPABILITY_INVALID',
            );
          }
          await recordCompleted(listed);
          continue;
        }

        const blob = partBlob(file, partNumber, partSizeBytes);
        const onProgress = (loaded: number) => {
          inFlight.set(partNumber, loaded);
          emitProgress();
        };

        let result: { etag: string | null };
        try {
          result = await dependencies.putBlob(capability, blob, onProgress, signal);
        } catch (error) {
          // An expired signature is the one storage failure worth one silent
          // retry: renew this single part and push it again.
          if (error instanceof DirectUploadError && [401, 403].includes(error.status ?? 0)) {
            const renewed = await dependencies.api.renewCapabilities(uploadId, [partNumber]);
            capability = renewed.capabilities?.[0] ?? capability;
            result = await dependencies.putBlob(capability, blob, onProgress, signal);
          } else {
            throw error;
          }
        }

        inFlight.delete(partNumber);
        if (!result.etag) {
          awaitingAuthoritativeReceipt.set(partNumber, blob.size);
          emitProgress();
          continue;
        }
        awaitingAuthoritativeReceipt.delete(partNumber);
        await recordCompleted({ partNumber, etag: result.etag, sizeBytes: blob.size });
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(MULTIPART_CONCURRENCY, missing.length) }, () => worker()),
    );
  }

  const authoritative = await dependencies.api.getState(uploadId);
  if (authoritative.completedParts.length !== partCount) {
    throw new DirectUploadError(
      'Upload confirmation is delayed; retrying safely',
      null,
      'PART_CONFIRMATION_PENDING',
    );
  }
  return sortParts(authoritative.completedParts);
}

export async function executeUploadTransfer(
  initialEntry: UploadQueueEntry,
  file: File | null,
  dependencies: UploadTransferDependencies,
  update: QueueEntryUpdate,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const entry = { ...initialEntry };
  const { signal } = options;
  await update({ status: 'reserving', errorCode: null, errorMessage: null, retryAt: null });

  let seededCapabilities = new Map<number, MultipartPartCapability>();
  if (!entry.uploadId) {
    if (!file) {
      throw new DirectUploadError(
        'Reselect the original file to continue',
        null,
        'FILE_RESELECT_REQUIRED',
      );
    }
    const created = await ensureUpload(entry, file, dependencies, update, signal);
    seededCapabilities = new Map(created.capabilities.map((c) => [c.partNumber, c]));
  }

  const uploadId = entry.uploadId!;

  for (let round = 0; round < MAX_COMPLETION_ROUNDS; round += 1) {
    const state = await dependencies.api.getState(uploadId);
    const serverStatus = statusFromServer(state.uploadState);
    if (isTerminalServerStatus(serverStatus)) {
      await update({ status: serverStatus, completedParts: state.completedParts });
      return;
    }

    const partSizeBytes = state.partSizeBytes ?? entry.partSizeBytes;
    const partCount = state.partCount ?? entry.partCount;
    if (!partSizeBytes || !partCount) {
      throw new DirectUploadError('Multipart geometry is missing', null, 'UPLOAD_STATE_INVALID');
    }
    entry.partSizeBytes = partSizeBytes;
    entry.partCount = partCount;
    entry.completedParts = state.completedParts;

    let parts: CompletedPart[];
    if (state.completedParts.length === partCount) {
      // Every part is already in storage — this attempt only owes a completion
      // call, which is exactly the post-reload recovery path.
      parts = sortParts(state.completedParts);
      await update({
        status: 'uploaded',
        progress: 100,
        partSizeBytes,
        partCount,
        completedParts: parts,
      });
    } else {
      if (!file) {
        throw new DirectUploadError(
          'Reselect the original file to continue',
          null,
          'FILE_RESELECT_REQUIRED',
        );
      }
      await update({
        status: 'uploading',
        partSizeBytes,
        partCount,
        completedParts: state.completedParts,
      });
      parts = await transferParts(
        entry,
        file,
        uploadId,
        partSizeBytes,
        partCount,
        state.completedParts,
        seededCapabilities,
        dependencies,
        update,
        signal,
      );
      seededCapabilities = new Map();
      await update({ completedParts: parts, progress: 100, status: 'uploaded' });
    }

    const body = completionBody(parts);
    // Last chance for pending draft metadata: after this call the row has a
    // `video_id` and PATCH is a 409.
    await dependencies.beforeComplete?.();
    const completion = await dependencies.api.complete(uploadId, body);
    if (completion.uploadState === 'uploading') {
      // The server found parts missing after all; loop and send only those.
      continue;
    }
    const status =
      completion.uploadState === 'completing' ? 'uploaded' : statusFromServer(completion.uploadState);
    await update({
      status,
      videoId: completion.videoId ?? entry.videoId ?? null,
      retryAt: status === 'uploaded' ? Date.now() + COMPLETION_RETRY_SECONDS * 1_000 : null,
    });
    return;
  }

  throw new DirectUploadError(
    'Upload confirmation is delayed; retrying safely',
    null,
    'PART_CONFIRMATION_PENDING',
  );
}

/**
 * Turns any transfer failure into the queue's next move. Everything the server
 * calls definite is `failed`; everything ambiguous waits and retries, because
 * a resumed multipart session costs only the missing parts.
 */
export function classifyTransferFailure(error: unknown): {
  status: 'retry_wait' | 'failed' | 'held';
  code: string;
  message: string;
  retryAfterSeconds: number | null;
} {
  if (error instanceof UploadApiError) {
    if (error.code === 'UPLOAD_INITIALIZATION_UNKNOWN') {
      return { status: 'held', code: error.code, message: error.message, retryAfterSeconds: null };
    }
    if (
      isCompletedPartsRenewalError(error) ||
      error.status === 429 ||
      error.status >= 500 ||
      error.status === 0
    ) {
      return {
        status: 'retry_wait',
        code: error.code,
        message: isCompletedPartsRenewalError(error)
          ? 'Upload confirmation is delayed; retrying safely'
          : error.code === 'UPLOAD_ADMISSION_BUSY'
            ? 'Waiting for a secure upload slot'
            : error.message,
        retryAfterSeconds: error.retryAfterSeconds ?? (isCompletedPartsRenewalError(error) ? 2 : 10),
      };
    }
    return { status: 'failed', code: error.code, message: error.message, retryAfterSeconds: null };
  }
  if (error instanceof DirectUploadError) {
    const permanentCodes = ['SIGNED_LENGTH_MISMATCH', 'CAPABILITY_INVALID', 'UPLOAD_STATE_INVALID'];
    const status = error.status ?? 0;
    // A storage 4xx is the bucket's verdict on this exact request: a malformed
    // part, a policy denial, an object that no longer exists. Re-sending the
    // same bytes to the same signed URL cannot change it. 401/403 are in that
    // set too — `transferParts` has already spent the one signature renewal
    // they deserve, so reaching here means renewal did not help.
    // 429 is the exception: it is the bucket asking for a pause, not a verdict.
    const permanentStatus = status >= 400 && status < 500 && status !== 429;
    const permanent = permanentCodes.includes(error.code) || permanentStatus;
    return {
      status: permanent ? 'failed' : 'retry_wait',
      code: error.code,
      message: error.message,
      retryAfterSeconds: permanent ? null : 10,
    };
  }
  return {
    status: 'retry_wait',
    code: 'UPLOAD_INTERRUPTED',
    message: error instanceof Error ? error.message : 'Upload interrupted',
    retryAfterSeconds: 10,
  };
}

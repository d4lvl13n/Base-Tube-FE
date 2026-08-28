/**
 * Pure queue-state helpers. No React, no network, no storage — everything here
 * is a function of (entries, clock).
 *
 * Ported from the AmazingAerial `upload-queue-store.ts`. `selectQueueCandidates`
 * and `hydrateUploadQueue` are unchanged in behaviour; the batch/item plumbing
 * and `createReplacementQueueEntry` are gone (contract §6.1 merges the rows).
 */
import { isTerminalServerStatus } from './status';
import type { PersistedUploadRecord, UploadQueueEntry } from './types';
import { matchReselectedFiles, type ValidatedUploadFile } from './validation';

/**
 * After a reload the browser cannot hand the file back, so anything that was
 * still moving bytes has to wait for the user to reselect it.
 */
const RESELECT_AFTER_RELOAD = new Set<UploadQueueEntry['status']>([
  'queued',
  'reserving',
  'retry_wait',
  'uploading',
]);

/** Strips the non-serialisable `File` handle before persisting. */
export function persistedRecord(entry: UploadQueueEntry): PersistedUploadRecord {
  const record: Partial<UploadQueueEntry> = { ...entry };
  delete record.file;
  return record as PersistedUploadRecord;
}

export function hydrateUploadQueue(records: readonly PersistedUploadRecord[]): UploadQueueEntry[] {
  return records.map((record) => {
    // All bytes are already in storage: completion needs no file at all.
    const completionRecoverable = record.uploadId !== null && record.progress === 100;
    return {
      ...record,
      file: null,
      status: completionRecoverable
        ? 'uploaded'
        : RESELECT_AFTER_RELOAD.has(record.status)
          ? 'reselect_required'
          : record.status,
      progress: record.progress,
    };
  });
}

/** The filename without its extension — the seed for the draft title. */
export function filenameStem(filename: string): string {
  const index = filename.lastIndexOf('.');
  const stem = index <= 0 ? filename : filename.slice(0, index);
  return stem.trim() || filename;
}

export function createQueueEntry(
  channelId: number,
  validated: ValidatedUploadFile,
  idFactory: () => string = () => crypto.randomUUID(),
): UploadQueueEntry {
  const now = new Date().toISOString();
  const clientAttemptId = idFactory();
  return {
    localId: clientAttemptId,
    clientAttemptId,
    uploadId: null,
    channelId,
    title: filenameStem(validated.file.name),
    description: null,
    isPublic: false,
    tags: null,
    filename: validated.file.name,
    sizeBytes: validated.file.size,
    lastModified: validated.file.lastModified,
    contentType: validated.contentType,
    partSizeBytes: null,
    partCount: null,
    completedParts: [],
    status: 'queued',
    progress: 0,
    errorCode: null,
    errorMessage: null,
    retryAt: null,
    videoId: null,
    videoStatus: null,
    createdAt: now,
    updatedAt: now,
    file: validated.file,
  };
}

export function patchQueueEntry(
  entries: readonly UploadQueueEntry[],
  localId: string,
  patch: Partial<UploadQueueEntry>,
): UploadQueueEntry[] {
  const updatedAt = new Date().toISOString();
  return entries.map((entry) => (entry.localId === localId ? { ...entry, ...patch, updatedAt } : entry));
}

export function attachReselectedFiles(
  entries: readonly UploadQueueEntry[],
  files: readonly File[],
): { entries: UploadQueueEntry[]; attached: number; unmatched: File[] } {
  const waiting = entries.filter((entry) => entry.status === 'reselect_required');
  const { matches, unmatched } = matchReselectedFiles(waiting, files);
  const fileById = new Map(matches.map(({ record, file }) => [record.localId, file]));
  return {
    entries: entries.map((entry) => {
      const file = fileById.get(entry.localId);
      return file
        ? {
            ...entry,
            file,
            status: 'queued' as const,
            errorCode: null,
            errorMessage: null,
            retryAt: null,
            updatedAt: new Date().toISOString(),
          }
        : entry;
    }),
    attached: matches.length,
    unmatched,
  };
}

/**
 * A fresh attempt against the same file. A new `clientAttemptId` is mandatory:
 * the server row is immutable once it is `failed`/`held`/`aborted` (§7.1), so a
 * replacement is a new row, never a revived one.
 */
export function replaceQueueAttempt(
  entry: UploadQueueEntry,
  idFactory: () => string = () => crypto.randomUUID(),
): UploadQueueEntry {
  const clientAttemptId = idFactory();
  return {
    ...entry,
    localId: clientAttemptId,
    clientAttemptId,
    uploadId: null,
    partSizeBytes: null,
    partCount: null,
    completedParts: [],
    status: entry.file ? 'queued' : 'reselect_required',
    progress: 0,
    errorCode: null,
    errorMessage: null,
    retryAt: null,
    videoId: null,
    videoStatus: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Which entries may start right now.
 *
 * Resumable attempts (a server row already exists) get the slots first — those
 * cost the server nothing new and finishing them frees admission capacity.
 * Fresh attempts are additionally capped by the number of unfinished server
 * attempts, so the client never trips the per-user in-flight cap (§7.2.4).
 */
export function selectQueueCandidates(
  entries: readonly UploadQueueEntry[],
  activeIds: ReadonlySet<string>,
  paused: boolean,
  now: number,
  activeLimit = 4,
  admissionRetryAt: number | null = null,
): UploadQueueEntry[] {
  if (paused || (admissionRetryAt !== null && admissionRetryAt > now)) return [];
  const available = Math.max(0, activeLimit - activeIds.size);
  if (available === 0) return [];

  const eligible = entries.filter(
    (entry) =>
      !activeIds.has(entry.localId) &&
      (entry.file !== null || (entry.status === 'uploaded' && entry.progress === 100)) &&
      (entry.status === 'queued' ||
        (entry.status === 'retry_wait' && (entry.retryAt ?? 0) <= now) ||
        (entry.status === 'uploaded' && (entry.retryAt ?? 0) <= now)),
  );
  const unfinishedServerAttempts = entries.filter(hasUnfinishedServerAttempt);
  const resumable = eligible.filter(hasUnfinishedServerAttempt).slice(0, available);
  const remainingTransferSlots = available - resumable.length;
  const newAttemptSlots = Math.max(0, activeLimit - unfinishedServerAttempts.length);
  const fresh = eligible
    .filter((entry) => entry.uploadId === null)
    .slice(0, Math.min(remainingTransferSlots, newAttemptSlots));

  return [...resumable, ...fresh];
}

function hasUnfinishedServerAttempt(entry: UploadQueueEntry): boolean {
  if (entry.uploadId === null) return false;
  return !isTerminalServerStatus(entry.status);
}

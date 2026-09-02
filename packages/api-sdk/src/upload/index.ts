/**
 * Direct-to-storage upload client (Upload V2).
 *
 * Platform-agnostic on purpose: no React, no app-level axios instance. The web
 * queue hook and (later) the mobile client both drive these functions.
 */
export * from './contracts';
export * from './types';
export {
  DirectUploadError,
  abortableSleep,
  normalizeEtag,
  putBlobWithProgress,
} from './direct-upload-transport';
export {
  UploadApiError,
  createUploadApi,
  toUploadApiError,
  type UploadApi,
} from './endpoints';
export { statusFromServer, isTerminalServerStatus, TERMINAL_SERVER_STATUSES } from './status';
export {
  attachReselectedFiles,
  createQueueEntry,
  filenameStem,
  hydrateUploadQueue,
  patchQueueEntry,
  persistedRecord,
  replaceQueueAttempt,
  selectQueueCandidates,
} from './upload-queue-store';
export {
  createIndexedDbResumeStore,
  createMemoryResumeStore,
  createUploadResumeStore,
  NON_DURABLE_NAMESPACES,
  purgeLegacyResumeDatabases,
  type UploadResumeStore,
} from './upload-resume-store';
export {
  classifyTransferFailure,
  createTransferDependencies,
  executeUploadTransfer,
  type QueueEntryUpdate,
  type UploadTransferDependencies,
} from './upload-transfer';
export {
  MAX_QUEUE_FILES,
  MAX_UPLOAD_SESSION_ITEMS,
  VIDEO_MAX_BYTES,
  classifyUploadFile,
  fileResumeFingerprint,
  matchReselectedFiles,
  validateFileSelection,
  type RejectedUploadFile,
  type UploadContentType,
  type ValidatedUploadFile,
} from './validation';

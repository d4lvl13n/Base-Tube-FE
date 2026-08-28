/**
 * Every sentence a creator can read about an upload, in one place.
 *
 * Two rules hold this file together:
 *
 *   1. A message says what happened AND what to do next. "Failed" is not a
 *      message; "This file is over the 2 GB limit" is.
 *   2. A code never reaches the screen. `UPLOAD_INITIALIZATION_UNKNOWN` is a
 *      fact about our servers, not something a creator can act on, so every
 *      code the upload path can produce is translated here.
 *
 * Style: sentence case, no exclamation marks, no emoji, ≤ 120 characters where
 * the sentence can honestly fit in that.
 *
 * `uploadPhase.ts` and `UploadQueuePanel.tsx` read from here, and
 * `src/utils/videoErrorMessages.ts` imports the same strings so the legacy
 * upload/edit paths cannot drift from the queue.
 */

export const uploadCopy = {
  /**
   * A reload drops the browser's handle on the file. The bytes already in
   * storage are still ours — only the missing parts get sent again — and that
   * is the part worth saying, because "reselect" otherwise reads as "start over".
   */
  reselectRequired:
    'Your browser let go of this file when the page reloaded. ' +
    'Choose the same file again to resume — only the missing parts are sent.',
  /** The button under that sentence. */
  reselectAction: 'Choose file',

  /** A transient network failure the queue will retry on its own. */
  retryWait: 'Connection hiccup — retrying in a moment.',

  /** The server's concurrency verdict: 8 unfinished uploads per creator. */
  admissionBusy: 'Waiting for an upload slot — you can have 8 in flight at once.',

  /**
   * The server answered the initialization ambiguously, so we cannot tell
   * whether an upload exists. Retrying could duplicate it; removing cannot.
   */
  unconfirmedStart:
    "We couldn't confirm this upload started. Remove it and add the file again.",

  fileTooLarge: 'This file is over the 2 GB limit.',
  unsupportedType: 'We accept MP4, MOV and AVI files.',

  /** The bytes arrived but no decoder could make a video out of them. */
  unplayableFile:
    "This file isn't a video we can play — it may be corrupted or use an " +
    'unsupported format. Try re-exporting it as MP4 (H.264).',

  /** The file on disk changed underneath an in-flight upload. */
  fileChanged: 'The file changed during upload. Add it again.',

  /** Transcoding gave up after its retries. Our fault, and it is retryable. */
  processingFailed:
    'Processing failed on our side. Retry from Videos Management, or add the file again.',

  intakePaused: 'Uploads are paused for maintenance — try again shortly.',
  storageBusy: 'Our storage is busy — retrying automatically.',
  wrongChannel: 'Choose one of your own channels.',

  /** Parts are in storage; the server has not acknowledged all of them yet. */
  confirmingParts: 'Confirming the last parts — retrying in a moment.',

  /** The same file is already on its way up under another queue entry. */
  duplicateAttempt: 'This file is already uploading. Check the queue before adding it again.',

  /** Cancel was requested but the transfer did not stop. */
  abortFailed: "We couldn't stop this upload. It may still finish.",

  /** The creator cancelled. */
  cancelled: 'You stopped this upload — add the file again to start over.',

  signInRequired: 'Sign in to continue.',
  invalidFilename: 'Rename the file without slashes or control characters.',

  /** Last resort: still says what to do, even when we do not know what broke. */
  unknownFailure: 'Something went wrong with this upload. Add the file again.',
} as const;

export type UploadCopyKey = keyof typeof uploadCopy;

/**
 * Every error code the upload path can put in front of a creator.
 *
 * Keys come from three places: the backend's `UploadErrorCode` /
 * `UploadRowErrorCode`, the SDK's own `DirectUploadError` codes, and the
 * client-side file rejections in `@basetube/api`'s `validation.ts`.
 */
const ERROR_COPY: Record<string, string> = {
  // ── backend, 400 ────────────────────────────────────────────────────────
  INVALID_UPLOAD_METADATA: uploadCopy.unsupportedType,
  UPLOAD_FILE_TOO_LARGE: uploadCopy.fileTooLarge,
  UPLOAD_PARTS_INVALID: uploadCopy.confirmingParts,
  // 413 has no JSON envelope — it is the reverse proxy's body-size verdict.
  PAYLOAD_TOO_LARGE: uploadCopy.fileTooLarge,

  // ── backend, 403 / 409 ──────────────────────────────────────────────────
  CHANNEL_FORBIDDEN: uploadCopy.wrongChannel,
  IDEMPOTENCY_CONFLICT: uploadCopy.duplicateAttempt,
  UPLOAD_INITIALIZATION_UNKNOWN: uploadCopy.unconfirmedStart,

  // ── backend, 422 / 429 / 503 ────────────────────────────────────────────
  MEDIA_VALIDATION_FAILED: uploadCopy.unplayableFile,
  MEDIA_SIZE_MISMATCH: uploadCopy.fileChanged,
  UPLOAD_ADMISSION_BUSY: uploadCopy.admissionBusy,
  UPLOAD_INTAKE_PAUSED: uploadCopy.intakePaused,
  STORAGE_UNAVAILABLE: uploadCopy.storageBusy,

  // ── processing ──────────────────────────────────────────────────────────
  PROCESSING_RETRIES_EXHAUSTED: uploadCopy.processingFailed,

  // ── SDK transfer ────────────────────────────────────────────────────────
  FILE_RESELECT_REQUIRED: uploadCopy.reselectRequired,
  PART_CONFIRMATION_PENDING: uploadCopy.confirmingParts,
  UPLOAD_INTERRUPTED: uploadCopy.retryWait,
  UPLOAD_INITIALIZATION_TIMEOUT: uploadCopy.retryWait,
  SIGNED_LENGTH_MISMATCH: uploadCopy.fileChanged,
  CAPABILITY_INVALID: uploadCopy.unknownFailure,
  UPLOAD_STATE_INVALID: uploadCopy.unknownFailure,
  UPLOAD_ABORT_FAILED: uploadCopy.abortFailed,

  // ── client-side file rejection ──────────────────────────────────────────
  UNSUPPORTED_TYPE: uploadCopy.unsupportedType,
  FILE_TOO_LARGE: uploadCopy.fileTooLarge,
  INVALID_FILENAME: uploadCopy.invalidFilename,

  // ── legacy upload/edit paths ────────────────────────────────────────────
  INVALID_VIDEO_FORMAT: uploadCopy.unsupportedType,
  VIDEO_UPLOAD_FAILED: uploadCopy.retryWait,
  FILE_UPLOAD_ERROR: uploadCopy.unknownFailure,
  UNAUTHORIZED: uploadCopy.signInRequired,
};

/** Longest server sentence we are willing to hand to a creator unedited. */
const MAX_SERVER_MESSAGE_LENGTH = 160;

/**
 * True when a server-supplied string is a sentence rather than debris.
 *
 * Anything longer than a couple of lines, anything carrying a stack frame, and
 * anything that is really a serialized payload is machine talk: it names files,
 * fields and status codes the creator cannot act on.
 */
export function isReadableServerMessage(message: unknown): message is string {
  if (typeof message !== 'string') return false;
  const trimmed = message.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_SERVER_MESSAGE_LENGTH) return false;
  // Newlines mean a stack trace or a multi-line dump, never a sentence.
  if (/[\n\r]/.test(trimmed)) return false;
  // JSON, or a fragment of it.
  if (/^[[{"]/.test(trimmed) || /"[a-z_]+"\s*:/i.test(trimmed)) return false;
  // Stack frames and module paths.
  if (/\bat\s+\S+\s*\(|\.[jt]sx?:\d+|\bError:\s/.test(trimmed)) return false;
  // Axios's own filler, which says nothing a creator can use.
  if (/^Request failed with status code/i.test(trimmed)) return false;
  // A bare code shouted at the user (`UPLOAD_STATE_INVALID`).
  if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(trimmed)) return false;
  return true;
}

/** The mapped sentence for a code, or null when the code is new to us. */
export function uploadErrorCopyFor(code: string | null | undefined): string | null {
  return (code && ERROR_COPY[code]) || null;
}

/**
 * The sentence for an upload error.
 *
 * A known code always wins: it is the one thing we can translate exactly. A
 * readable server message is the next best thing — new backend errors get a
 * useful sentence before this file learns their code. Everything else falls
 * back to a message that still tells the creator what to do.
 */
export function describeUploadError(
  code: string | null | undefined,
  fallbackMessage?: string | null,
): string {
  if (code && ERROR_COPY[code]) return ERROR_COPY[code];
  if (isReadableServerMessage(fallbackMessage)) return fallbackMessage.trim();
  return uploadCopy.unknownFailure;
}

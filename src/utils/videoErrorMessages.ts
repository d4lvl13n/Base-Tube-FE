/**
 * Error copy for the legacy upload and the video-edit paths.
 *
 * These screens predate the upload queue, but a creator does not know that: an
 * over-size file has to read the same here as it does in the queue panel. So
 * every sentence comes from `uploadCopy` — this module owns the *shape* of the
 * answer (code, message, whether a retry is worth offering), never the words.
 */
import axios from 'axios';
import { describeUploadError, uploadCopy } from '../components/upload/uploadCopy';
import { parseApiError, isRetryableServiceError } from './apiError';

export interface VideoErrorResult {
  code: string | null;
  message: string;
  canRetry: boolean;
}

export const PAYLOAD_TOO_LARGE_MESSAGE = uploadCopy.fileTooLarge;

/**
 * `parseApiError` invents these when the error carries nothing usable. They
 * read like sentences but say nothing, so they must not win over the shared
 * fallback, which at least tells the creator what to do next.
 */
const GENERIC_FILLER = new Set([
  'Something went wrong',
  'Something went wrong. Please try again.',
]);

export function getVideoErrorMessage(error: unknown): VideoErrorResult {
  const { code, message } = parseApiError(error);

  // 413 usually comes from the reverse proxy (nginx `client_max_body_size`),
  // so there is no JSON envelope to read a code from.
  if (axios.isAxiosError(error) && error.response?.status === 413) {
    return {
      code: 'PAYLOAD_TOO_LARGE',
      message: PAYLOAD_TOO_LARGE_MESSAGE,
      canRetry: false,
    };
  }

  // A known code wins; an unknown one falls back to the server's own sentence
  // when it reads like one, and to the shared last-resort line when it does not.
  return {
    code,
    message: describeUploadError(code, GENERIC_FILLER.has(message.trim()) ? null : message),
    canRetry: isRetryableServiceError(code),
  };
}

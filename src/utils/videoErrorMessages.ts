import axios from 'axios';
import { parseApiError, isRetryableServiceError } from './apiError';

export interface VideoErrorResult {
  code: string | null;
  message: string;
  canRetry: boolean;
}

export const PAYLOAD_TOO_LARGE_MESSAGE =
  'File too large for the server limit. Try a smaller file.';

const VIDEO_ERROR_MAP: Record<string, string> = {
  INVALID_VIDEO_FORMAT:
    'Invalid video format or missing file. Use a supported format and try again.',
  VIDEO_UPLOAD_FAILED:
    'Upload failed. Please check your connection and try again.',
  VIDEO_VALIDATION_FAILED: 'Please check your video details and try again.',
  FILE_UPLOAD_ERROR: 'File could not be uploaded. Check size and format limits.',
  UNAUTHORIZED: 'Please sign in to continue.',
  PAYLOAD_TOO_LARGE: PAYLOAD_TOO_LARGE_MESSAGE,
};

const DEFAULT_MESSAGE = 'Upload failed. Please try again.';

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

  if (code && VIDEO_ERROR_MAP[code]) {
    return {
      code,
      message: VIDEO_ERROR_MAP[code],
      canRetry: isRetryableServiceError(code),
    };
  }

  const hasServerMessage =
    typeof message === 'string' &&
    message.trim().length > 0 &&
    message !== DEFAULT_MESSAGE &&
    !/^Request failed with status code/i.test(message);

  return {
    code,
    message: hasServerMessage ? message : DEFAULT_MESSAGE,
    canRetry: isRetryableServiceError(code),
  };
}

import { parseApiError, isRetryableServiceError } from './apiError';

export interface ProfileErrorResult {
  code: string | null;
  message: string;
  canRetry: boolean;
}

const PROFILE_ERROR_MAP: Record<string, string> = {
  PROFILE_IMAGE_UPLOAD_FAILED:
    'Avatar upload failed. Please try again in a moment.',
  USER_NOT_FOUND: 'Account not found. Please sign in again.',
  PROFILE_UPDATE_FAILED:
    'Could not update your profile. Please try again or contact support.',
  UNAUTHORIZED: 'Please sign in to continue.',
};

const DEFAULT_MESSAGE = 'Could not update your profile. Please try again.';

export function getProfileErrorMessage(error: unknown): ProfileErrorResult {
  const { code, message } = parseApiError(error);

  if (code && PROFILE_ERROR_MAP[code]) {
    return {
      code,
      message: PROFILE_ERROR_MAP[code],
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

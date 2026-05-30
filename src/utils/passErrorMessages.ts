import { parseApiError, isRateLimitError, isRetryableServiceError } from './apiError';

export type PassErrorAction = 'link-youtube' | 'verify-channel' | null;

export interface PassErrorResult {
  code: string | null;
  message: string;
  action: PassErrorAction;
  canRetry: boolean;
}

const PASS_ERROR_MAP: Record<
  string,
  { message: string; action: PassErrorAction; canRetry?: boolean }
> = {
  INVALID_PASS_INPUT: {
    message: 'Add a title, price (min $1), and at least one YouTube video URL.',
    action: null,
  },
  PASS_URL_ALREADY_USED: {
    message:
      'This URL already has a content pass. Use a different video URL.',
    action: null,
    canRetry: false,
  },
  PASS_CHAIN_REGISTRATION_FAILED: {
    message:
      'On-chain registration failed and nothing was saved. You can safely try again.',
    action: null,
    canRetry: true,
  },
  PASS_CREATE_RATE_LIMIT_EXCEEDED: {
    message:
      "You've reached today's limit for creating passes. Please try again tomorrow.",
    action: null,
  },
  CHANNEL_NOT_LINKED: {
    message: "Your YouTube channel isn't connected yet. Link it to continue.",
    action: 'link-youtube',
  },
  YOUTUBE_CHANNEL_NOT_VERIFIED: {
    message:
      "Your YouTube channel hasn't been verified. Complete verification to create passes.",
    action: 'verify-channel',
  },
  CHANNEL_NOT_APPROVED: {
    message: "Your channel is pending approval. We'll notify you when it's ready.",
    action: 'verify-channel',
  },
  UNSUPPORTED_PLATFORM: {
    message: 'Only YouTube videos are supported right now.',
    action: null,
  },
  VIDEO_OWNERSHIP_VERIFICATION_FAILED: {
    message:
      "We couldn't verify you own this video. Make sure it belongs to your linked YouTube channel.",
    action: null,
  },
  PASS_CREATE_FAILED: {
    message: 'Could not create your pass. Please try again or contact support.',
    action: null,
  },
  UNAUTHORIZED: {
    message: 'Please sign in to continue.',
    action: null,
  },
  PASS_CHANNEL_NOT_APPROVED: {
    message:
      "This creator's channel hasn't been approved yet. Purchases are temporarily unavailable.",
    action: null,
  },
  PASS_CONTENT_INVALID: {
    message: "This pass contains content that's no longer available.",
    action: null,
  },
};

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

export function getPassErrorMessage(error: unknown): PassErrorResult {
  const { code, message } = parseApiError(error);

  if (code && PASS_ERROR_MAP[code]) {
    const mapped = PASS_ERROR_MAP[code];
    return {
      code,
      message: mapped.message,
      action: mapped.action,
      canRetry: mapped.canRetry ?? isRetryableServiceError(code),
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
    action: null,
    canRetry: isRetryableServiceError(code) && !isRateLimitError(code),
  };
}

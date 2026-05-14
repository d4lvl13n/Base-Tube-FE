import axios from 'axios';

export type PassErrorAction = 'link-youtube' | 'verify-channel' | null;

export interface PassErrorResult {
  code: string | null;
  message: string;
  action: PassErrorAction;
}

const PASS_ERROR_MAP: Record<string, { message: string; action: PassErrorAction }> = {
  // Pass creation codes (POST /api/v1/passes)
  CHANNEL_NOT_LINKED: {
    message: "Your YouTube channel isn't connected yet. Link it to continue.",
    action: 'link-youtube',
  },
  YOUTUBE_CHANNEL_NOT_VERIFIED: {
    message: "Your YouTube channel hasn't been verified. Complete verification to create passes.",
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
    message: "We couldn't verify you own this video. Make sure it belongs to your linked YouTube channel.",
    action: null,
  },
  PASS_CREATE_RATE_LIMIT_EXCEEDED: {
    message: "You've created too many passes recently. Please wait a few minutes.",
    action: null,
  },
  // Checkout / crypto quote codes
  PASS_CHANNEL_NOT_APPROVED: {
    message: "This creator's channel hasn't been approved yet. Purchases are temporarily unavailable.",
    action: null,
  },
  PASS_CONTENT_INVALID: {
    message: "This pass contains content that's no longer available.",
    action: null,
  },
};

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Extract a structured error from an API failure (typically from axios).
 *
 * Tries three shapes the backend may use:
 *   1. `{ error: { code, message } }`  — structured API error
 *   2. `{ error: "<string>" }`          — flat error string
 *   3. `{ code: "<string>" }`           — code at top level
 *
 * Returns a user-facing message + an optional action hint so the UI can
 * render an inline recovery button (e.g. "Connect YouTube").
 */
export function getPassErrorMessage(error: unknown): PassErrorResult {
  const fallback: PassErrorResult = { code: null, message: DEFAULT_MESSAGE, action: null };

  if (!error) return fallback;

  let code: string | null = null;
  let serverMessage: string | null = null;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, any> | undefined;
    if (data) {
      if (typeof data.error === 'object' && data.error !== null) {
        code = data.error.code ?? null;
        serverMessage = data.error.message ?? data.error.userMessage ?? null;
      } else if (typeof data.error === 'string') {
        code = data.code ?? null;
        serverMessage = data.error;
      }
      if (!code && typeof data.code === 'string') {
        code = data.code;
      }
      if (!serverMessage && typeof data.message === 'string') {
        serverMessage = data.message;
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        serverMessage = data.errors
          .map((e: any) => e.msg || e.message || 'Invalid input')
          .join(', ');
      }
    }
  } else if (error instanceof Error) {
    serverMessage = error.message;
  }

  if (code && PASS_ERROR_MAP[code]) {
    return { code, ...PASS_ERROR_MAP[code] };
  }

  return {
    code,
    message: serverMessage || DEFAULT_MESSAGE,
    action: null,
  };
}

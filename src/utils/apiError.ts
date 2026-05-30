import axios from 'axios';

export interface ParsedApiError {
  code: string | null;
  message: string;
  details?: unknown;
}

/**
 * Parse the standard API error envelope from a response body.
 * Returns null if the body is not a recognized error shape.
 */
export function parseApiErrorFromBody(
  body: unknown
): { code: string; message: string } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  if (b.success === false && b.error && typeof b.error === 'object') {
    const err = b.error as Record<string, unknown>;
    if (typeof err.code === 'string') {
      return {
        code: err.code,
        message:
          typeof err.message === 'string' ? err.message : 'Something went wrong',
      };
    }
  }

  // Legacy pass create only
  if (typeof b.error === 'string') {
    return { code: 'UNKNOWN', message: b.error };
  }

  return null;
}

/**
 * Extract structured error fields from an axios error, Error, or raw response body.
 * Prefers `error.code` over free-text / HTTP status alone.
 */
export function parseApiError(error: unknown): ParsedApiError {
  const fallback: ParsedApiError = {
    code: null,
    message: 'Something went wrong. Please try again.',
  };

  if (!error) return fallback;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const fromBody = parseApiErrorFromBody(data);
    if (fromBody) {
      return { code: fromBody.code, message: fromBody.message };
    }
    return { code: null, message: error.message || fallback.message };
  }

  const fromBody = parseApiErrorFromBody(error);
  if (fromBody) {
    return { code: fromBody.code, message: fromBody.message };
  }

  if (error instanceof Error) {
    return { code: null, message: error.message };
  }

  if (typeof error === 'string') {
    return { code: null, message: error };
  }

  return fallback;
}

/** True when the API signals a rate limit (distinct from retryable 503). */
export function isRateLimitError(code: string | null): boolean {
  return (
    code === 'CHANNEL_LIMIT_EXCEEDED' ||
    code === 'PASS_CREATE_RATE_LIMIT_EXCEEDED' ||
    code === 'AUTH_RATE_LIMIT' ||
    code === 'RATE_LIMIT_EXCEEDED'
  );
}

/** True when the user should retry the same action (e.g. 503 upload). */
export function isRetryableServiceError(code: string | null): boolean {
  return (
    code === 'CHANNEL_IMAGE_UPLOAD_FAILED' ||
    code === 'VIDEO_UPLOAD_FAILED' ||
    code === 'PROFILE_IMAGE_UPLOAD_FAILED' ||
    code === 'PASS_CHAIN_REGISTRATION_FAILED' ||
    code === 'SERVICE_UNAVAILABLE'
  );
}

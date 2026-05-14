import axios from 'axios';

/**
 * Retry policy for POST /api/v1/purchases/:id/crypto/confirm.
 *
 * The backend says:
 * - 200 → finalized, move to success.
 * - 409 "already confirmed with a different transaction hash" → hard conflict.
 *   Stop immediately. User action required.
 * - 409 "not found" / "not yet mined" / "log not matched" (and similar) → transient.
 *   Backend hasn't indexed the receipt yet. Retry with backoff.
 * - Anything else → treat network errors and 5xx as retryable; treat 4xx
 *   (other than 409) as terminal.
 *
 * The classifier is a pure function so it can be unit-tested without network mocks.
 */

export class CryptoConfirmHardConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoConfirmHardConflictError';
  }
}

export type ConfirmErrorKind =
  | 'transient'         // retry with backoff
  | 'retryable-other'   // 5xx / network — retry with backoff
  | 'hard-conflict'     // stop, user-visible error
  | 'terminal';         // stop, propagate as-is

const TRANSIENT_PATTERNS: RegExp[] = [
  /not\s+found/i,
  /not\s+yet\s+mined/i,
  /not\s+mined/i,
  /log\s+not\s+matched/i,
  /pending/i,
  /indexing/i,
  /receipt/i,
];

const HARD_CONFLICT_ALREADY = /already\s+confirmed/i;
const HARD_CONFLICT_DIFFERENT = /different/i;

/**
 * Classify a confirm error into a retry decision.
 *
 * @param status HTTP status (0 for network errors)
 * @param message server-provided message (or axios message for network errors)
 */
export function classifyConfirmError(
  status: number,
  message: string,
): ConfirmErrorKind {
  const msg = message || '';

  if (status === 409) {
    // Hard conflict: this purchase was finalized with a different tx hash.
    // The FE cannot retry — user needs to act.
    if (HARD_CONFLICT_ALREADY.test(msg) && HARD_CONFLICT_DIFFERENT.test(msg)) {
      return 'hard-conflict';
    }
    // Transient: backend hasn't seen the tx / logs yet.
    if (TRANSIENT_PATTERNS.some((p) => p.test(msg))) {
      return 'transient';
    }
    // Unknown 409 shape — fail safe, don't spam retries.
    return 'hard-conflict';
  }

  // Network error (status 0) or 5xx — worth another go.
  if (status === 0 || status >= 500) {
    return 'retryable-other';
  }

  // 2xx shouldn't land here, but be defensive.
  if (status >= 200 && status < 300) {
    return 'terminal';
  }

  // Other 4xx (400/401/403/404) — terminal from the FE's perspective.
  return 'terminal';
}

/**
 * Extract a stable { status, message } tuple from any thrown error, so the
 * classifier can make a decision without caring about the underlying shape.
 *
 * Handles axios errors (the common case), plain Errors, and unknowns.
 */
export function extractConfirmErrorDetails(err: unknown): { status: number; message: string } {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const data = err.response?.data as
      | { error?: string | { message?: string; code?: string }; message?: string }
      | undefined;
    const message =
      (typeof data?.error === 'string' ? data.error : data?.error?.message) ||
      data?.message ||
      err.message ||
      'Request failed';
    return { status, message };
  }
  if (err instanceof Error) return { status: 0, message: err.message };
  return { status: 0, message: 'Unknown error' };
}

export const DEFAULT_CONFIRM_BACKOFFS_MS = [1000, 2000, 4000];

export interface ConfirmWithRetryOptions {
  /** Milliseconds to wait before each retry. Length determines max retries. */
  backoffs?: number[];
  /** Called immediately before each attempt with the 1-indexed attempt number. */
  onAttempt?: (attemptNumber: number) => void;
  /** Called when the classifier decides to stop. Exposes the classifier result. */
  onGiveUp?: (kind: ConfirmErrorKind, attemptNumber: number) => void;
  /** Override the error extraction (mainly for testing). */
  getErrorDetails?: (err: unknown) => { status: number; message: string };
  /** Override the sleep (mainly for testing). */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Run `attempt` up to `backoffs.length + 1` times with the given backoffs.
 *
 * - Success on any attempt → resolve with its result.
 * - Classifier says `hard-conflict` → throw CryptoConfirmHardConflictError, no retry.
 * - Classifier says `terminal` → propagate the original error, no retry.
 * - Classifier says `transient` or `retryable-other` → wait and retry.
 * - All attempts exhausted → throw the last error.
 *
 * This function is intentionally pure (no imports from react-query / axios
 * interceptor state). All side effects come through the injected `attempt`.
 */
export async function confirmWithRetry<T>(
  attempt: () => Promise<T>,
  opts: ConfirmWithRetryOptions = {},
): Promise<T> {
  const backoffs = opts.backoffs ?? DEFAULT_CONFIRM_BACKOFFS_MS;
  const getErrorDetails = opts.getErrorDetails ?? extractConfirmErrorDetails;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const maxAttempts = backoffs.length + 1;

  let lastErr: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    opts.onAttempt?.(i + 1);
    try {
      return await attempt();
    } catch (err) {
      lastErr = err;
      const { status, message } = getErrorDetails(err);
      const kind = classifyConfirmError(status, message);

      if (kind === 'hard-conflict') {
        opts.onGiveUp?.(kind, i + 1);
        throw new CryptoConfirmHardConflictError(message);
      }
      if (kind === 'terminal') {
        opts.onGiveUp?.(kind, i + 1);
        throw err;
      }
      // transient or retryable-other
      const hasMoreAttempts = i < maxAttempts - 1;
      if (!hasMoreAttempts) {
        opts.onGiveUp?.(kind, i + 1);
        throw err;
      }
      await sleep(backoffs[i]);
    }
  }
  throw lastErr;
}

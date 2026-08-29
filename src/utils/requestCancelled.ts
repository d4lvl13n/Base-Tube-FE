import axios from 'axios';

/**
 * Did this request stop because someone aborted it, rather than fail?
 *
 * Two spellings reach us. Axios reports its own cancellations through
 * `isCancel`; an `AbortController` firing during the underlying fetch surfaces
 * as a native `AbortError`, which `isCancel` does not recognise. Both mean the
 * same thing — nobody is waiting for this answer any more — and neither is
 * worth three retries and seven seconds of backoff.
 *
 * One helper, so a caller cannot recognise one spelling and miss the other.
 */
export function wasCancelled(error: unknown): boolean {
  if (axios.isCancel(error)) return true;
  if (typeof error !== 'object' || error === null) return false;
  const name = (error as { name?: string }).name;
  return name === 'AbortError' || name === 'CanceledError';
}

/** The predicate form, for `retryWithBackoff`. */
export const retryUnlessCancelled = (error: unknown): boolean => !wasCancelled(error);

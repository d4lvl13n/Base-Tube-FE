/**
 * One shared answer to "the session expired" for every upload and draft call.
 *
 * Modelled on the AmazingAerial `UploadAuthTransport`, reduced to what the
 * axios-based SDK needs:
 *
 *   - a recognised authentication refusal (HTTP 401 with the API's JSON error
 *     envelope) triggers ONE session refresh, shared by every request that hit
 *     it at the same time;
 *   - if the refresh yields a session, the refused call is sent once more —
 *     a 401 means the server did not act on it, so this is not a blind replay;
 *   - otherwise the coordinator is "blocked": callers wait (or are told to
 *     wait) until `resume()` succeeds after the person signs in again.
 *
 * 403 and 404 are NEVER treated as an expired session, and a network failure
 * or a lost response is never retried here: those are resolved by reading
 * state or by idempotency keys, by the caller.
 *
 * Platform-agnostic: the refresh itself is injected (Clerk on web).
 */
import { UploadApiError } from '../upload/endpoints';

export class AuthenticationRequiredError extends Error {
  readonly code = 'AUTH_REQUIRED';
  constructor() {
    super('Sign in again to continue.');
    this.name = 'AuthenticationRequiredError';
  }
}

/** A 401 that came from our API (it carries the JSON envelope), not from storage or a proxy. */
export function isAuthenticationRefusal(error: unknown): boolean {
  if (error instanceof AuthenticationRequiredError) return true;
  if (!(error instanceof UploadApiError) || error.status !== 401) return false;
  // `toUploadApiError` falls back to REQUEST_FAILED when the body had no envelope.
  return error.code !== 'REQUEST_FAILED';
}

export interface SessionRecovery {
  /** True while a refused session waits for the person to sign in again. */
  readonly blocked: boolean;
  /**
   * Runs `call`; on a recognised refusal, refreshes once (shared) and retries
   * once. Throws `AuthenticationRequiredError` if the session cannot be renewed.
   */
  run: <T>(call: () => Promise<T>) => Promise<T>;
  /** Called after a sign-in: refreshes and, on success, unblocks. */
  resume: () => Promise<boolean>;
  /** Subscribes to blocked/unblocked changes. Returns the unsubscribe function. */
  subscribe: (listener: (blocked: boolean) => void) => () => void;
}

export function createSessionRecovery(refresh: () => Promise<boolean>): SessionRecovery {
  let inFlight: Promise<boolean> | null = null;
  /** Bumped on every successful refresh, so a late refusal can tell it is already stale. */
  let generation = 0;
  let blocked = false;
  const listeners = new Set<(blocked: boolean) => void>();

  const setBlocked = (value: boolean) => {
    if (blocked === value) return;
    blocked = value;
    listeners.forEach((listener) => listener(value));
  };

  const sharedRefresh = (): Promise<boolean> => {
    inFlight ??= refresh()
      .catch(() => false)
      .then((ok) => {
        if (ok) generation += 1;
        return ok;
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  };

  return {
    get blocked() {
      return blocked;
    },

    async run<T>(call: () => Promise<T>): Promise<T> {
      if (blocked) throw new AuthenticationRequiredError();
      const startedAt = generation;
      try {
        return await call();
      } catch (error) {
        if (!isAuthenticationRefusal(error)) throw error;
        // Another request already renewed the session after this one left:
        // retry with the new token without asking Clerk again.
        const renewed = generation !== startedAt || (await sharedRefresh());
        if (!renewed) {
          setBlocked(true);
          throw new AuthenticationRequiredError();
        }
        try {
          return await call();
        } catch (retryError) {
          if (isAuthenticationRefusal(retryError)) {
            setBlocked(true);
            throw new AuthenticationRequiredError();
          }
          throw retryError;
        }
      }
    },

    async resume() {
      const ok = await sharedRefresh();
      if (ok) setBlocked(false);
      return ok;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

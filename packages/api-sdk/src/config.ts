import type { AxiosAdapter } from 'axios';

/**
 * Returns a bearer token to attach to requests, or null when unauthenticated.
 *
 * On web this typically yields the Clerk session token. On mobile it yields
 * either the Clerk token (Clerk Expo SDK) or the Web3 JWT once the backend
 * accepts it as a bearer token (see Mobile Readiness Brief, G.1).
 */
export type TokenProvider = () => string | null | Promise<string | null>;

export interface BasetubeClientConfig {
  /** Backend base URL, e.g. `https://beta.base.tube`. No trailing slash required. */
  baseUrl: string;

  /** Optional bearer-token provider (Clerk session token or Web3 JWT). */
  getToken?: TokenProvider;

  /**
   * Send credentials (cookies) with requests. Required for the web Web3
   * cookie-auth flow; should be `false` on native, which uses bearer tokens.
   */
  withCredentials?: boolean;

  /** Per-request timeout in milliseconds. Defaults to 30000. */
  timeoutMs?: number;

  /** Extra static headers merged into every request. */
  headers?: Record<string, string>;

  /**
   * Number of automatic retries on HTTP 429 (honours `Retry-After`).
   * Defaults to 1. Set to 0 to disable.
   */
  maxRateLimitRetries?: number;

  /** Invoked when any request returns 401, for app-level re-auth handling. */
  onUnauthorized?: () => void;

  /**
   * Custom axios adapter. Primarily used for tests and SSR; production
   * clients omit this and use the platform default.
   */
  adapter?: AxiosAdapter;
}

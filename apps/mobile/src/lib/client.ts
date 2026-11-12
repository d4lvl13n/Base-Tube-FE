import { createBasetubeClient } from '@basetube/api';
import { getSessionToken } from './auth';
import { reportAccountRestriction } from './accountStatus';

/**
 * Backend base URL. Configured via `EXPO_PUBLIC_API_URL`; defaults to the
 * production backend. For local development, point this at a local backend.
 */
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://beta.base.tube';

/**
 * Shared API client. `getToken` reads the live Clerk session token via the
 * auth bridge (registered in app/_layout.tsx once Clerk loads). Native uses
 * bearer tokens only — no cookies (see Mobile Readiness Brief, G.1).
 *
 * `onAccountRestricted` is the one central handler for a suspended / banned
 * account (403 ACCOUNT_SUSPENDED / ACCOUNT_BANNED); `AccountGate` in
 * app/_layout.tsx turns it into the "Account suspended" screen.
 */
export const api = createBasetubeClient({
  baseUrl,
  getToken: getSessionToken,
  withCredentials: false,
  onAccountRestricted: reportAccountRestriction,
});

export const API_BASE_URL = baseUrl;

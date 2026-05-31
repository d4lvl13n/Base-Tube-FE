import { createBasetubeClient } from '@basetube/api';
import { getSessionToken } from './auth';

/**
 * Backend base URL. Configured via `EXPO_PUBLIC_API_URL`; defaults to the
 * production backend. For local development, point this at a local backend.
 */
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.base.tube';

/**
 * Shared API client. `getToken` reads the live Clerk session token via the
 * auth bridge (registered in app/_layout.tsx once Clerk loads). Native uses
 * bearer tokens only — no cookies (see Mobile Readiness Brief, G.1).
 */
export const api = createBasetubeClient({
  baseUrl,
  getToken: getSessionToken,
  withCredentials: false,
});

export const API_BASE_URL = baseUrl;

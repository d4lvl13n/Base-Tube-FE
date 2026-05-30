import { createBasetubeClient } from '@basetube/api';

/**
 * Backend base URL. Configured via `EXPO_PUBLIC_API_URL`; defaults to the
 * production backend. For local development, point this at a local backend
 * or mock server.
 */
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://backend.base.tube';

/**
 * Shared API client. Auth is unauthenticated for phase 1 (public endpoints).
 * Phase 2 wires `getToken` to the Clerk Expo session token, and later the
 * Web3 JWT once the backend accepts it as a bearer token.
 */
export const api = createBasetubeClient({
  baseUrl,
  // getToken: () => clerkSession?.getToken() ?? null,  // wired in phase 2
});

export const API_BASE_URL = baseUrl;

import { createBasetubeClient, type BasetubeClient } from '@basetube/api';

/**
 * The shared SDK client for the web app.
 *
 * The web has two auth methods: Clerk (bearer token) and Web3 (an httpOnly
 * cookie). `getToken` only has something to hand over in the Clerk case;
 * `withCredentials` carries the Web3 cookie for the other.
 */
let client: BasetubeClient | null = null;

export function getBasetubeClient(): BasetubeClient {
  if (client) return client;

  const baseUrl = process.env.REACT_APP_API_URL;
  if (!baseUrl) {
    throw new Error('REACT_APP_API_URL is not set; the upload client cannot be created.');
  }

  client = createBasetubeClient({
    baseUrl,
    getToken: async () => {
      // Mirrors `src/api/index.ts`: only the Web3 flow writes `auth_method`,
      // so a Clerk session leaves it unset — testing for `!== 'web3'` is what
      // actually attaches the token. (The guide's snippet says `=== 'clerk'`,
      // which no code path ever sets.)
      if (localStorage.getItem('auth_method') !== 'web3') {
        try {
          return (await window.Clerk?.session?.getToken()) ?? null;
        } catch {
          return null;
        }
      }
      return null;
    },
    withCredentials: true,
    onUnauthorized: () => window.dispatchEvent(new CustomEvent('auth:unauthorized')),
  });
  return client;
}

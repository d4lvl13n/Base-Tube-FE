// src/global.d.ts
export {};

declare global {
  interface Window {
    Clerk?: {
      session?: {
        /** `skipCache` forces a fresh token — the one silent renewal the upload recovery allows. */
        getToken: (options?: { template?: string; skipCache?: boolean }) => Promise<string | null>;
      } | null;
      /** Opens Clerk's sign-in modal (used by "Sign in again" when silent renewal failed). */
      openSignIn?: (options?: Record<string, unknown>) => void;
    };
  }
}

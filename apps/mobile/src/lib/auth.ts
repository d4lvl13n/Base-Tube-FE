import type { TokenProvider } from '@basetube/api';

/**
 * Bridges Clerk's per-component `useAuth().getToken` to the module-level SDK
 * client (created once at import time). `AuthBridge` in app/_layout.tsx registers
 * the live getter after Clerk loads; the SDK's request interceptor then attaches
 * the current session token as a bearer on every request.
 */
let tokenGetter: TokenProvider = () => null;

export function setTokenGetter(getter: TokenProvider): void {
  tokenGetter = getter;
}

export const getSessionToken: TokenProvider = () => tokenGetter();

import { createSessionRecovery, type SessionRecovery } from '@basetube/api';

/**
 * The web half of the shared session recovery (UP-UX §10).
 *
 * Clerk can renew a session silently (`getToken({ skipCache: true })`), so a
 * refused Clerk call gets that one shared refresh. The Web3 cookie has no
 * silent renewal: its refresh answers "no" at once and the creator goes
 * through the existing wallet sign-in, which is what UP-UX asks for.
 *
 * One instance per signed-in account — the upload provider creates it inside
 * its account-keyed subtree, so a blocked session never leaks into the next
 * account's queue.
 */
export function createWebSessionRecovery(): SessionRecovery {
  return createSessionRecovery(async () => {
    if (localStorage.getItem('auth_method') === 'web3') return false;
    const session = window.Clerk?.session;
    if (!session) return false;
    try {
      const token = await session.getToken({ skipCache: true });
      return typeof token === 'string' && token.length > 0;
    } catch {
      return false;
    }
  });
}

/**
 * The "Sign in again" action: a silent renewal first, and only when that
 * fails, the visible sign-in for the account's own method.
 */
export async function requestReauthentication(recovery: SessionRecovery): Promise<boolean> {
  if (await recovery.resume()) return true;
  if (localStorage.getItem('auth_method') !== 'web3' && window.Clerk?.openSignIn) {
    window.Clerk.openSignIn();
    return false;
  }
  // The wallet flow owns its own screen; sending the creator there keeps the
  // upload state (it lives in IndexedDB and in the provider above the router).
  window.location.assign(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
  return false;
}

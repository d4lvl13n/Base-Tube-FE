import { useCallback } from 'react';
import { useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth as useWeb3Auth } from '../contexts/AuthContext';

/**
 * useRequireAuth returns a function that, when called, ensures the user is authenticated.
 * If the user is already authenticated (via Clerk **or** Web3Auth) we immediately resolve true.
 * Otherwise we open Clerk's sign-in modal.  When the modal finishes and a session is created
 * the promise resolves true, allowing callers to continue the flow (e.g. create a checkout session).
 */
export function useRequireAuth() {
  const { isSignedIn } = useClerkAuth();
  const { openSignIn } = useClerk();
  const { isAuthenticated } = useWeb3Auth();

  /**
   * Returns true as soon as we have an authenticated session.
   */
  const requireAuth = useCallback(async (): Promise<boolean> => {
    // Already authenticated via Clerk or Web3Auth
    if (isSignedIn || isAuthenticated) {
      return true;
    }

    // Open Clerk modal. This returns an object describing what happened.
    try {
      const res: any = await openSignIn();
      if (res && res.createdSessionId) {
        // A new Clerk session was created -> authenticated.
        return true;
      }
      return false;
    } catch (err) {
      console.warn('User closed sign-in modal or sign-in failed', err);
      return false;
    }
  }, [isSignedIn, isAuthenticated, openSignIn]);

  return requireAuth;
} 
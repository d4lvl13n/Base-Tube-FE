import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth as useWeb3Auth } from '../contexts/AuthContext';

/**
 * Runs `action` for a signed-in person (Clerk or wallet). A signed-out
 * visitor is sent to the general sign-in page, which brings them back to the
 * page they were on (`redirect_url`, read by Clerk's sign-in). No modal.
 * While either session is still loading, nothing happens.
 */
export function useSignedInAction() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { isAuthenticated, isRestoring } = useWeb3Auth();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (action: () => void) => {
      if (isSignedIn || isAuthenticated) {
        action();
        return;
      }
      if (!isLoaded || isRestoring) return;
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
    },
    [isAuthenticated, isLoaded, isRestoring, isSignedIn, location.pathname, location.search, navigate],
  );
}

import { useSignedVideoUrl } from './usePass';
import { useAccess } from './useOnchainPass';
import { useRequireAuth } from './useRequireAuth';
import { useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth as useWeb3Auth } from '../contexts/AuthContext';

/**
 * Hook for accessing token-gated content (any type of content that requires a Pass).
 * Provides a unified way to check access, prompt authentication, and get a signed URL.
 * 
 * @param videoId The ID of the video to check access for
 * @param options Additional options
 * @returns Access state and control methods
 */
export function useTokenGate(
  videoId?: string | null,
  options: {
    autoAuth?: boolean;
    maxRetries?: number;
    passId?: string;
  } = {}
) {
  const {
    autoAuth = false,
    maxRetries = 3,
    passId
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [needsAuthPrompt, setNeedsAuthPrompt] = useState(false);
  
  const requireAuth = useRequireAuth();
  
  // Determine current authentication status (Clerk or Web3)
  const { isSignedIn } = useClerkAuth();
  const { isAuthenticated: isWeb3Authenticated } = useWeb3Auth();
  const isLoggedIn = isSignedIn || isWeb3Authenticated;

  // Optional onchain access assertion to avoid unnecessary signed-url calls
  const { data: accessResp, isLoading: isAccessLoading } = useAccess(passId, { enabled: Boolean(passId) });
  const hasOnchainAccess = Boolean(accessResp?.data?.hasAccess);

  const {
    data: signedUrl,
    error,
    isLoading,
    refetch
  } = useSignedVideoUrl(
    videoId,
    Boolean(videoId && isLoggedIn && (!passId || hasOnchainAccess))
  );

  // Distinguish common error codes (Axios style)
  const statusCode = error && 'response' in error ? (error as any).response?.status : undefined;
  const is401 = statusCode === 401;
  const is403 = statusCode === 403;
  
  // Check if we should prompt authentication (401 or not logged in)
  useEffect(() => {
    if (autoAuth && (is401 || !isLoggedIn) && !needsAuthPrompt) {
      setNeedsAuthPrompt(true);
    }
  }, [autoAuth, is401, isLoggedIn, needsAuthPrompt]);

  // Try to authenticate if needed
  useEffect(() => {
    const authenticate = async () => {
      if (needsAuthPrompt) {
        const ok = await requireAuth();
        if (ok) {
          refetch();
        }
        setNeedsAuthPrompt(false);
      }
    };
    authenticate();
  }, [needsAuthPrompt, requireAuth, refetch]);

  // Handle retries for 403 errors (logged-in but no access)
  useEffect(() => {
  if (is403 && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [is403, retryCount, maxRetries, refetch]);

  // Helper function to prompt authentication manually
  const promptAuth = useCallback(async () => {
    const ok = await requireAuth();
    if (ok) {
      refetch();
      return true;
    }
    return false;
  }, [requireAuth, refetch]);

  return {
    signedUrl,
    isLoading: isLoading || isAccessLoading,
    error,
    is401,
    is403: is403 || (passId ? !hasOnchainAccess && !isAccessLoading && isLoggedIn : false),
    retryCount,
    hasAccess: Boolean(signedUrl) || hasOnchainAccess,
    needsLogin: !isLoggedIn,
    needsAuth: is403,
    promptAuth
  };
} 
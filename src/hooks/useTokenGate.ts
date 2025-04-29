import { useSignedVideoUrl } from './usePass';
import { useRequireAuth } from './useRequireAuth';
import { useState, useEffect, useCallback } from 'react';

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
    redirectOnAuth?: boolean;
    maxRetries?: number;
  } = {}
) {
  const {
    autoAuth = false,
    redirectOnAuth = false,
    maxRetries = 3
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [needsAuth, setNeedsAuth] = useState(false);
  
  const requireAuth = useRequireAuth();
  
  const {
    data: signedUrl,
    error,
    isLoading,
    refetch
  } = useSignedVideoUrl(videoId, Boolean(videoId));

  // Handle the 403 Forbidden case (no access)
  const is403 = error && 'response' in error && (error as any).response?.status === 403;
  
  // Check if we should try to authenticate
  useEffect(() => {
    if (is403 && autoAuth && !needsAuth) {
      setNeedsAuth(true);
    }
  }, [is403, autoAuth, needsAuth]);

  // Try to authenticate if needed
  useEffect(() => {
    const authenticate = async () => {
      if (needsAuth) {
        const ok = await requireAuth();
        if (ok) {
          // User authenticated, retry fetching the signed URL
          refetch();
        }
        setNeedsAuth(false);
      }
    };
    
    authenticate();
  }, [needsAuth, requireAuth, refetch]);

  // Handle retries for 403 errors
  useEffect(() => {
    if (is403 && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }, 3000); // Retry every 3 seconds
      
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
    isLoading,
    error,
    is403,
    retryCount,
    hasAccess: Boolean(signedUrl),
    needsAuth: is403,
    promptAuth
  };
} 
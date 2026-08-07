import { useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { youtubeAuthApi, YouTubeVerificationStatus, YouTubeOAuthReturnTo } from '../api/youtubeAuth';

export type YouTubeLinkStatus = 'unknown' | 'linked' | 'unlinked' | 'loading';

export interface UseYouTubeAuthReturn {
  /** Current link/verification status */
  status: YouTubeLinkStatus;
  /** Optional channel metadata returned by backend */
  channel?: YouTubeVerificationStatus['channel'];
  /** YouTube channel title (when linked) */
  channelTitle?: string | null;
  /** The BaseTube channel handle (when linked) — to route to the synced channel */
  handle?: string | null;
  /** True when this page load is the return from a completed OAuth redirect */
  justLinked: boolean;
  /**
   * Opens the Google consent screen.
   * @param returnTo where the backend returns the user afterwards
   *   ('create' = back to the channel-creation success view,
   *    'audit'  = back to the channel packaging audit).
   */
  startOAuth: (returnTo?: YouTubeOAuthReturnTo) => Promise<void>;
  /** Re-fetch the link status (e.g. after redirect) */
  refetch: () => Promise<void>;
  /** Disconnect the linked channel */
  unlink: () => Promise<void>;
}

/**
 * React hook that manages YouTube channel linking & verification state.
 * Internally relies on the backend integration endpoints:
 *   GET    /api/integrations/youtube/status   – check status
 *   GET    /api/integrations/youtube/auth     – start OAuth (returns { url })
 *   DELETE /api/integrations/youtube          – unlink current channel
 */
export function useYouTubeAuth(): UseYouTubeAuthReturn {
  const { isLoaded, getToken } = useClerkAuth();
  const [status, setStatus] = useState<YouTubeLinkStatus>('unknown');
  const [channel, setChannel] = useState<YouTubeVerificationStatus['channel']>();
  const [channelTitle, setChannelTitle] = useState<string | null>();
  const [handle, setHandle] = useState<string | null>();
  const [justLinked, setJustLinked] = useState(false);

  /** Fetches current status */
  const fetchStatus = useCallback(async (forceRefresh = false) => {
    if (!isLoaded) {
      console.log('Clerk not loaded yet, skipping YouTube status check');
      return;
    }

    setStatus('loading');
    
    try {
      const token = await getToken();
      if (!token) {
        console.warn('No auth token available for YouTube status check');
        setStatus('unlinked');
        return;
      }

      console.log('Fetching YouTube verification status...');
      const res = await youtubeAuthApi.getStatus();
      console.log('YouTube verification result:', res);
      setChannel(res.channel);
      setChannelTitle(res.channel_title ?? res.channel?.title ?? null);
      setHandle(res.handle ?? null);
      setStatus(res.verified ? 'linked' : 'unlinked');
    } catch (err) {
      console.warn('Failed to fetch YouTube auth status:', err);
      setStatus('unlinked');
    }
  }, [isLoaded, getToken]);

  /** Initiates OAuth flow */
  const startOAuth = useCallback(async (returnTo?: YouTubeOAuthReturnTo) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available for YouTube OAuth');
        return;
      }

      const url = await youtubeAuthApi.startOAuth(returnTo);
      window.location.href = url;
    } catch (err) {
      console.error('Failed to initiate YouTube OAuth flow:', err);
    }
  }, [getToken]);

  /** Disconnect the linked channel */
  const unlink = useCallback(async () => {
    try {
      await youtubeAuthApi.unlink();
      await fetchStatus(true);
    } catch (err) {
      console.error('Failed to unlink YouTube channel:', err);
    }
  }, [fetchStatus]);

  // Initial fetch on mount
  useEffect(() => {
    if (isLoaded) {
      fetchStatus();
    }
  }, [isLoaded]);

  // Check for ytLinked param (indicating OAuth callback)
  useEffect(() => {
    const hasRedirectParam = window.location.search.includes('ytLinked');
    if (hasRedirectParam) {
      console.log('YouTube OAuth redirect detected, refreshing status');
      setJustLinked(true);
      fetchStatus(true);

      // Clean up URL by removing ytLinked parameter
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('ytLinked');
        window.history.replaceState({}, document.title, url.toString());
      } catch (e) {
        console.error('Error cleaning up URL:', e);
      }
    }
  }, []);

  return {
    status,
    channel,
    channelTitle,
    handle,
    justLinked,
    startOAuth,
    refetch: () => fetchStatus(true),
    unlink
  };
}
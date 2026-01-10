import { useState, useCallback, useRef } from 'react';
import { passApi, PlaybackError } from '../api/pass';
import { PlayTokenData, PlayTokenErrorCode } from '../types/pass';

interface CachedToken {
  data: PlayTokenData;
  fetchedAt: number;
}

// Refresh token 5 minutes before it expires
const TOKEN_CACHE_BUFFER = 5 * 60 * 1000;

/**
 * Hook for fetching and caching video play tokens
 *
 * Provides token caching to avoid unnecessary API calls when replaying videos.
 * Tokens are automatically refreshed when they're close to expiring.
 *
 * @example
 * ```tsx
 * const { getToken, isLoading, error, clearCache } = usePlayToken();
 *
 * const handlePlay = async (videoId: string) => {
 *   try {
 *     const token = await getToken(videoId);
 *     openVideoPlayer(token);
 *   } catch (err) {
 *     if (err instanceof PlaybackError) {
 *       handlePlaybackError(err);
 *     }
 *   }
 * };
 * ```
 */
export function usePlayToken() {
  const cache = useRef<Map<string, CachedToken>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PlaybackError | null>(null);

  /**
   * Get a play token for a video, using cache when available
   * @param videoId The video UUID to get a token for
   * @returns The play token data with playback URLs
   * @throws PlaybackError on failure
   */
  const getToken = useCallback(async (videoId: string): Promise<PlayTokenData> => {
    setError(null);

    // Check cache
    const cached = cache.current.get(videoId);
    if (cached) {
      const expiresAt = new Date(cached.data.expires_at).getTime();
      const now = Date.now();

      // Use cached token if still valid (with buffer)
      if (expiresAt - now > TOKEN_CACHE_BUFFER) {
        return cached.data;
      }
    }

    // Fetch new token
    setIsLoading(true);
    try {
      const data = await passApi.getPlayToken(videoId);

      // Cache the token
      cache.current.set(videoId, {
        data,
        fetchedAt: Date.now(),
      });

      return data;
    } catch (err) {
      if (err instanceof PlaybackError) {
        setError(err);
        throw err;
      }
      const playbackError = new PlaybackError('SERVER_ERROR', 'Failed to get playback URL', 500);
      setError(playbackError);
      throw playbackError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear cached tokens
   * @param videoId Optional video ID to clear specific token, or clear all if not provided
   */
  const clearCache = useCallback((videoId?: string) => {
    if (videoId) {
      cache.current.delete(videoId);
    } else {
      cache.current.clear();
    }
  }, []);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    getToken,
    isLoading,
    error,
    clearCache,
    clearError,
  };
}

/**
 * Utility function to handle common playback errors
 * Returns user-friendly messages and recommended actions
 */
export function getPlaybackErrorMessage(error: PlaybackError): {
  message: string;
  action: 'login' | 'purchase' | 'retry' | 'wait' | 'none';
} {
  switch (error.code) {
    case 'UNAUTHORIZED':
      return {
        message: 'Please sign in to watch this video.',
        action: 'login',
      };
    case 'NO_ACCESS':
      return {
        message: 'You need to purchase this pass to watch.',
        action: 'purchase',
      };
    case 'NOT_FOUND':
      return {
        message: 'This video is no longer available.',
        action: 'none',
      };
    case 'PLAY_TOKEN_RATE_LIMIT_EXCEEDED':
      return {
        message: 'Too many playback requests. Please wait a few minutes.',
        action: 'wait',
      };
    default:
      return {
        message: 'Failed to load video. Please try again.',
        action: 'retry',
      };
  }
}

// Re-export PlaybackError for convenience
export { PlaybackError };

import api from './index';

/**
 * Allowlisted post-OAuth return destinations. These are KEYS, not URLs — the
 * backend signs them into the OAuth state and maps each to a fixed path in its
 * callback (`create` → /create-channel, `dashboard` → /dashboard/creator,
 * `audit` → /ai-thumbnails/channel-audit). Sending anything else silently
 * collapses to `dashboard`.
 */
export type YouTubeOAuthReturnTo = 'create' | 'dashboard' | 'audit';

/**
 * Response shape for GET /api/integrations/youtube/status
 */
export interface YouTubeVerificationStatus {
  verified: boolean;
  linked?: boolean;
  /** YouTube channel title (backend field: channel_title) */
  channel_title?: string | null;
  /** The BaseTube channel handle — used to route to the synced channel after a one-click link */
  handle?: string | null;
  // The backend may also return channel metadata when linked
  channel?: {
    id?: string;
    title?: string;
    thumbnail_url?: string;
  };
}

export const youtubeAuthApi = {
  /**
   * Check whether the current user has linked & verified a YouTube channel
   */
  getStatus: async (): Promise<YouTubeVerificationStatus> => {
    try {
      console.log('Checking YouTube verification status...');
      const res = await api.get('/api/integrations/youtube/status');
      console.log('YouTube status response:', res.data);
      
      // Some backend responses wrap data under { data: {...} }
      // Unwrap if necessary for consistency
      const data = 'data' in res.data ? res.data.data : res.data;
      return data as YouTubeVerificationStatus;
    } catch (error) {
      console.error('Failed to get YouTube verification status:', error);
      // Default to unverified on error
      return { verified: false };
    }
  },

  /**
   * Start the YouTube OAuth flow.
   * The backend returns an object containing the Google consent URL.
   */
  startOAuth: async (returnTo?: YouTubeOAuthReturnTo): Promise<string> => {
    try {
      console.log('Starting YouTube OAuth flow...');
      // Backend must generate the URL with correct redirect_uri pointing to its own /callback.
      // returnTo=create brings the user back to the channel-creation success view.
      const res = await api.get<{ url: string }>('/api/integrations/youtube/auth', {
        params: returnTo ? { returnTo } : undefined,
      });
      console.log('YouTube OAuth URL response:', res.data);

      const data = 'data' in res.data ? (res.data as any).data : res.data;
      return data.url;
    } catch (error) {
      console.error('Failed to start YouTube OAuth flow:', error);
      throw error;
    }
  },

  /**
   * Disconnect the currently linked YouTube channel
   */
  unlink: async (): Promise<void> => {
    try {
      console.log('Unlinking YouTube channel...');
      await api.delete('/api/integrations/youtube');
      console.log('YouTube channel unlinked successfully');
    } catch (error) {
      console.error('Failed to unlink YouTube channel:', error);
      throw error;
    }
  }
}; 
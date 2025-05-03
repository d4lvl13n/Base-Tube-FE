import api from './index';

/**
 * Response shape for GET /api/integrations/youtube/status
 */
export interface YouTubeVerificationStatus {
  verified: boolean;
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
  startOAuth: async (): Promise<string> => {
    try {
      console.log('Starting YouTube OAuth flow...');
      // Backend must generate the URL with correct redirect_uri pointing to its own /callback
      const res = await api.get<{ url: string }>('/api/integrations/youtube/auth');
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
import api from './index';

interface YouTubeVideoMetadata {
  title: string;
  duration?: number; // Duration in seconds
  thumbnail_url?: string;
}

/**
 * API helper for fetching YouTube metadata
 */
export const youtubeApi = {
  /**
   * Fetch video metadata from YouTube
   * This function calls our backend proxy to get YouTube data
   * @param videoUrl The YouTube video URL or ID
   */
  getVideoMetadata: async (videoUrl: string): Promise<YouTubeVideoMetadata> => {
    try {
      // Call our backend proxy endpoint to fetch YouTube metadata
      // This assumes we have a backend endpoint set up to handle this request
      const response = await api.get('/api/v1/youtube/metadata', {
        params: { url: videoUrl }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching YouTube metadata:', error);
      // Return a basic object with empty title if the API call fails
      return { title: '' };
    }
  }
};

// Helper to extract YouTube video ID
export function getYouTubeID(url: string | undefined): string {
  if (!url) return '';
  const regExpWatch = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const regExpShort = /^.*(youtu.be\/)([^#&?]*).*/;
  let match = url.match(regExpWatch);
  if (match && match[2].length === 11) return match[2];
  match = url.match(regExpShort);
  if (match && match[2].length === 11) return match[2];
  return '';
} 
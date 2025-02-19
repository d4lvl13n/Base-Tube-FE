import api from './index';

interface EmbedVideoResponse {
  success: boolean;
  data: {
    id: number;
    title: string;
    video_url: string;
    video_urls: {
      [key: string]: string;  // Different quality versions
    };
    thumbnail_url: string;
    duration: number;
    aspectRatio?: string; // Optional, defaults to "16:9"
  };
  message?: string;
}

/**
 * Get video data specifically formatted for embedded player
 * @param videoId - The ID of the video to embed
 * @returns Promise with the video data formatted for embedding
 */
export const getVideoEmbed = async (videoId: string): Promise<{
  id: number;
  title: string;
  video_url: string;
  video_urls: {
    [key: string]: string;  // Different quality versions
  };
  thumbnail_url: string;
  duration: number;
}> => {
  try {
    // Uses public endpoint without credentials
    const response = await api.get(`/api/v1/videos/embed/${videoId}`, {
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data: EmbedVideoResponse = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch embedded video data');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching embedded video:', error);
    throw error;
  }
};
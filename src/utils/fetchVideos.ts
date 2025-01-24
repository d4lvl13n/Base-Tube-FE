// src/utils/fetchVideos.ts

import { Video } from '../types/video';
import {
  getTrendingVideos,
  getAllVideos,
  getRecommendedVideos,
} from '../api/video';

export const fetchVideos = async (
  category: string,
  page: number = 1,
  limit: number = 10
): Promise<Video[]> => {
  try {
    if (category === 'Trending') {
      const response = await getTrendingVideos({ page, limit });
      return response.success ? response.data.videos : [];
    } else if (category === 'New') {
      return await getAllVideos(page, limit);
    } else if (category === 'For You') {
      const response = await getRecommendedVideos(page, limit);
      // Map recommended videos to match Video type
      return response.videos.map((video: any) => ({
        ...video,
        user_id: video.creator_id,
        channel_id: video.creator_id,
        video_path: video.url,
        thumbnail_path: video.thumbnail,
        // Add any other required Video properties with default values
      }));
    } else if (category === 'NFT') {
      return [];
    } else {
      const response = await getTrendingVideos({ page, limit });
      return response.success ? response.data.videos : [];
    }
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

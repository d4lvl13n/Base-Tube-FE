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
      return await getRecommendedVideos(page, limit);
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

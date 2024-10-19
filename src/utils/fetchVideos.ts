// src/utils/fetchVideos.ts

import { Video } from '../types/video';
import {
  getTrendingVideos,
  getAllVideos,
  getRecommendedVideos,
} from '../api/video';

export const fetchVideosByCategory = async (
  category: string,
  page: number,
  limit: number
): Promise<Video[]> => {
  if (category === 'Trending') {
    return await getTrendingVideos(page, limit);
  } else if (category === 'New') {
    return await getAllVideos(page, limit);
  } else if (category === 'For You') {
    return await getRecommendedVideos(page, limit);
  } else if (category === 'NFT Content Pass') {
    // For now, return empty array
    return [];
  } else {
    return await getTrendingVideos(page, limit);
  }
};

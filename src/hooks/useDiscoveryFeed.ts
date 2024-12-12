// src/hooks/useDiscoveryFeed.ts

import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { getDiscoveryFeed } from '../api/discovery';
import type { GetDiscoveryOptions, DiscoveryResponse, DiscoveryVideo } from '../types/discovery';
import type { Video } from '../types/video';

// Define a type for the transformed page data
interface TransformedDiscoveryResponse {
  data: Video[];
  success: boolean;
  pagination: DiscoveryResponse['pagination'];
  message?: string;
  error?: string;
}

// Helper function to transform DiscoveryVideo to Video
const transformToVideo = (discoveryVideo: DiscoveryVideo): Video => {
  return {
    id: discoveryVideo.id,
    user_id: Number(discoveryVideo.user_id),
    channel_id: discoveryVideo.channel_id,
    title: discoveryVideo.title,
    description: discoveryVideo.description || '',
    video_path: '',
    processed_video_paths: discoveryVideo.processed_video_paths,
    thumbnail_path: discoveryVideo.thumbnail_path,
    duration: discoveryVideo.duration,
    views: discoveryVideo.views_count,
    likes: discoveryVideo.likes_count,
    dislikes: 0,
    is_public: discoveryVideo.is_public,
    is_featured: discoveryVideo.is_featured,
    trending_score: discoveryVideo.trending_score,
    is_nft_content: false,
    createdAt: discoveryVideo.createdAt,
    updatedAt: discoveryVideo.updatedAt,
    channel: discoveryVideo.channel,
    comment_count: 0,
    like_count: discoveryVideo.likes_count,
    user: undefined
  };
};

export const useDiscoveryFeed = (options: GetDiscoveryOptions) => {
  const { sort, timeFrame, limit } = options;

  return useInfiniteQuery<
    DiscoveryResponse,
    Error,
    InfiniteData<TransformedDiscoveryResponse>
  >({
    queryKey: ['discovery', sort, timeFrame, limit],
    queryFn: async ({ pageParam }) => {
      const actualPage = typeof pageParam === 'number' ? pageParam : 1;
      return getDiscoveryFeed({ ...options, page: actualPage });
    },
    initialPageParam: 1,
    select: (data: InfiniteData<DiscoveryResponse>): InfiniteData<TransformedDiscoveryResponse> => {
      return {
        pages: data.pages.map(page => ({
          ...page,
          data: page.data.map(transformToVideo)
        })),
        pageParams: data.pageParams
      };
    },
    getNextPageParam: (lastPage) => {
      console.log('Pagination info:', {
        currentPage: lastPage.pagination.page,
        hasMore: lastPage.pagination.hasMore,
        totalItems: lastPage.pagination.total
      });
      
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false
  });
};
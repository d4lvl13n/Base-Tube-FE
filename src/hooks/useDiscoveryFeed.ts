// src/hooks/useDiscoveryFeed.ts

import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { getDiscoveryFeed } from '../api/discovery';
import type { GetDiscoveryOptions, DiscoveryResponse, DiscoveryVideo } from '../types/discovery';
import { Video, VideoStatus } from '../types/video';

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
  // Determine status based on video properties
  const determineStatus = (): VideoStatus => {
    if (discoveryVideo.video_urls && Object.keys(discoveryVideo.video_urls).length > 0) {
      return 'completed';
    }
    if (discoveryVideo.processed_video_paths?.length) {
      return 'completed';
    }
    return 'pending';
  };

  // Map the string status to our valid status type
  const mapStatus = (status: string | undefined): VideoStatus => {
    if (!status) return determineStatus();
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'completed';
      case 'processing':
      case 'in_progress':
        return 'processing';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return determineStatus();
    }
  };

  return {
    // Basic info
    id: discoveryVideo.id,
    user_id: Number(discoveryVideo.user_id),
    channel_id: discoveryVideo.channel_id,
    title: discoveryVideo.title,
    description: discoveryVideo.description || '',
    
    // Video paths and URLs
    video_path: '',
    video_urls: discoveryVideo.video_urls || {},
    processed_video_paths: discoveryVideo.processed_video_paths,
    
    // Thumbnail info
    thumbnail_path: discoveryVideo.thumbnail_path,
    thumbnail_url: discoveryVideo.thumbnail_url,
    
    // Stats
    duration: discoveryVideo.duration,
    views_count: discoveryVideo.views_count,
    views: discoveryVideo.views_count,
    likes_count: discoveryVideo.likes_count,
    likes: discoveryVideo.likes_count,
    dislikes: 0,
    like_count: discoveryVideo.likes_count,
    comment_count: 0,
    
    // Flags
    is_public: discoveryVideo.is_public,
    is_featured: discoveryVideo.is_featured,
    is_nft_content: false,
    
    // Status - using the mapping function
    status: mapStatus(discoveryVideo.status),
    
    // Scores
    trending_score: discoveryVideo.trending_score,
    engagement_score: discoveryVideo.engagement_score || 0,
    
    // Timestamps
    createdAt: discoveryVideo.createdAt,
    updatedAt: discoveryVideo.updatedAt,
    
    // Relations
    channel: discoveryVideo.channel,
    user: undefined,
    
    // Categories
    time_category: discoveryVideo.time_category || 'older'
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
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false
  });
};
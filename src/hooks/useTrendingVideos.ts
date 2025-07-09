import { useState, useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
// We keep both type systems because:
// 1. TrendingVideoResponse matches our API response structure
// 2. Video type is used throughout the rest of the application
import { TrendingVideoResponse, Video, VideoStatus } from '../types/video';
import { 
  TimeFrame, 
  DiscoveryVideo,
  GetDiscoveryOptions
} from '../types/discovery';
import { getTrendingVideos } from '../api/video';
import { queryKeys } from '../utils/queryKeys';

// Define the return type for our hook to maintain consistent interface
interface UseTrendingVideosReturn {
  videos: Video[];          // Using Video type as it's the standard across the app
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  timeFrame: TimeFrame;     // Using TimeFrame from discovery as it's more specific
  loadMore: () => void;
  refresh: () => void;
}

// Transform function to convert DiscoveryVideo to Video format
// This is necessary because the API returns data in DiscoveryVideo format
// but our app components expect Video format
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

export const useTrendingVideos = (initialParams: GetDiscoveryOptions = {}): UseTrendingVideosReturn => {
  // Use refs for values that shouldn't trigger re-renders
  const stableParams = useRef(initialParams);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(initialParams.timeFrame || 'week');

  interface PageData {
    videos: Video[];
    hasMore: boolean;
    total: number;
    actualTimeFrame: TimeFrame;
  }

  const infiniteQuery = useInfiniteQuery<PageData>({
    queryKey: queryKeys.videos.trending(timeFrame, stableParams.current),
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number || 1;
      const params: GetDiscoveryOptions = {
        ...stableParams.current,
        page,
        timeFrame,
        sort: 'trending',
        limit: stableParams.current.limit || 10
      };

      console.log('Fetching trending videos with params:', params);
      // Use TrendingVideoResponse type as it matches the API response structure
      const response = await getTrendingVideos(params) as TrendingVideoResponse;
      console.log('Raw API Response:', response);

      if (response.success && Array.isArray(response.data)) {
        // If no videos found for current timeframe and we're on first page, try 'all' timeframe
        if (response.data.length === 0 && timeFrame !== 'all' && page === 1) {
          console.log('No videos found for timeframe:', timeFrame, 'trying all timeframe');
          setTimeFrame('all');
          // Return empty result, the query will refetch with new timeFrame
          return { videos: [], hasMore: false, total: 0, actualTimeFrame: 'all' };
        }

        // Transform the response data to match Video type expected by the app
        const transformedVideos = response.data.map(transformToVideo);
        console.log('Transformed videos:', transformedVideos);
        
        return {
          videos: transformedVideos,
          hasMore: response.data.hasMore || false,
          total: response.data.total || 0,
          actualTimeFrame: timeFrame
        };
      } else {
        console.warn('API request succeeded but returned no videos:', response);
        return { videos: [], hasMore: false, total: 0, actualTimeFrame: timeFrame };
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 1 * 60 * 1000, // 1 minute - video lists are dynamic but cached
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: (failureCount, error: any) => {
        console.error('Error fetching trending videos:', error);
      return failureCount < 2;
    },
  });

  // Flatten the paginated data
  const videos = infiniteQuery.data?.pages.flatMap(page => page.videos) || [];
  const total = infiniteQuery.data?.pages?.[0]?.total || 0;
  const hasMore = infiniteQuery.hasNextPage || false;

  // Simplified load more function
  const loadMore = useCallback(() => {
    if (hasMore && !infiniteQuery.isFetchingNextPage) {
      infiniteQuery.fetchNextPage();
    }
  }, [hasMore, infiniteQuery.isFetchingNextPage, infiniteQuery.fetchNextPage]);

  // Refresh function
  const refresh = useCallback(() => {
    infiniteQuery.refetch();
  }, [infiniteQuery.refetch]);

  return {
    videos,
    loading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    hasMore,
    total,
    timeFrame,
    loadMore,
    refresh,
  };
};
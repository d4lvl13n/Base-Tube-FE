import { useState, useEffect, useCallback, useRef } from 'react';
// We keep both type systems because:
// 1. TrendingVideoResponse matches our API response structure
// 2. Video type is used throughout the rest of the application
import { TrendingVideoResponse, Video } from '../types/video';
import { 
  TimeFrame, 
  DiscoveryVideo,
  GetDiscoveryOptions
} from '../types/discovery';
import { getTrendingVideos } from '../api/video';

// Define the return type for our hook to maintain consistent interface
interface UseTrendingVideosReturn {
  videos: Video[];          // Using Video type as it's the standard across the app
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  timeFrame: TimeFrame;     // Using TimeFrame from discovery as it's more specific
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Transform function to convert DiscoveryVideo to Video format
// This is necessary because the API returns data in DiscoveryVideo format
// but our app components expect Video format
const transformToVideo = (discoveryVideo: DiscoveryVideo): Video => {
  return {
    id: discoveryVideo.id,
    user_id: Number(discoveryVideo.user_id),  // Convert string to number for consistency
    channel_id: discoveryVideo.channel_id,
    title: discoveryVideo.title,
    description: discoveryVideo.description || '',
    video_path: '',  // Default empty as it's not provided in discovery
    processed_video_paths: discoveryVideo.processed_video_paths,
    thumbnail_path: discoveryVideo.thumbnail_path,
    duration: discoveryVideo.duration,
    views: discoveryVideo.views_count,
    likes: discoveryVideo.likes_count,
    dislikes: 0,    // Default value as it's not in discovery
    is_public: discoveryVideo.is_public,
    is_featured: discoveryVideo.is_featured,
    trending_score: discoveryVideo.trending_score,
    is_nft_content: false,  // Default value
    createdAt: discoveryVideo.createdAt,
    updatedAt: discoveryVideo.updatedAt,
    channel: discoveryVideo.channel,
    comment_count: 0,       // Default value
    like_count: discoveryVideo.likes_count,
    user: undefined,        // Not provided in discovery
    time_category: discoveryVideo.time_category || 'older',
    engagement_score: discoveryVideo.engagement_score || 0
  };
};

export const useTrendingVideos = (initialParams: GetDiscoveryOptions = {}): UseTrendingVideosReturn => {
  // Use refs for values that shouldn't trigger re-renders
  const stableParams = useRef(initialParams);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(initialParams.timeFrame || 'week');
  const [page, setPage] = useState(1);
  
  // Refs for managing request state and cleanup
  const requestInProgress = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchVideos = useCallback(async (
    isLoadMore: boolean = false, 
    currentTimeFrame: TimeFrame = timeFrame
  ): Promise<void> => {
    // Cleanup previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // Prevent multiple simultaneous requests
      if (requestInProgress.current) {
        return;
      }

      requestInProgress.current = true;
      setLoading(true);
      setError(null);

      const params: GetDiscoveryOptions = {
        ...stableParams.current,
        page: isLoadMore ? page : 1,
        timeFrame: currentTimeFrame,
        sort: 'trending',
        limit: stableParams.current.limit || 10
      };

      console.log('Fetching trending videos with params:', params);
      // Use TrendingVideoResponse type as it matches the API response structure
      const response = await getTrendingVideos(params) as TrendingVideoResponse;
      console.log('Raw API Response:', response);

      if (response.success && Array.isArray(response.data)) {
        // If no videos found for current timeframe, try 'all' timeframe
        if (response.data.length === 0 && currentTimeFrame !== 'all') {
          console.log('No videos found for timeframe:', currentTimeFrame, 'trying all timeframe');
          return fetchVideos(isLoadMore, 'all');
        }

        // Transform the response data to match Video type expected by the app
        const transformedVideos = response.data.map(transformToVideo);
        console.log('Transformed videos:', transformedVideos);
        
        setVideos(prev => isLoadMore ? [...prev, ...transformedVideos] : transformedVideos);
        setHasMore(response.data.hasMore);
        setTotal(response.data.total);
        setTimeFrame(currentTimeFrame);
      } else {
        console.warn('API request succeeded but returned no videos:', response);
      }
    } catch (error: unknown) {
      // Only handle non-abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching trending videos:', error);
        setError(error);
      }
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  }, [page, timeFrame]);

  // Initial fetch and cleanup
  useEffect(() => {
    const currentController = abortControllerRef.current;
    
    fetchVideos();

    return () => {
      if (currentController) {
        currentController.abort();
      }
    };
  }, [fetchVideos]);

  // Utility functions for pagination and refresh
  const loadMore = useCallback(() => fetchVideos(true), [fetchVideos]);
  const refresh = useCallback(() => {
    setPage(1);
    return fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    hasMore,
    total,
    timeFrame,
    loadMore,
    refresh,
  };
};
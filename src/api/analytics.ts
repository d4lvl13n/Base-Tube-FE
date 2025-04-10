import api from './index';
import { 
  WatchPatterns, 
  SocialMetrics, 
  GrowthMetrics,
  CreatorWatchHours,
  BasicViewMetrics,
  DetailedViewMetrics,
  LikeGrowthTrends,
  TopLikedVideos,
  LikeViewRatio,
  ChannelWatchPatterns,
  ChannelDemographics,
  EngagementTrends, 
  TopContentItem, 
  TopSharedItem, 
  TopComment,
  VideoPerformanceResponse,
  ChannelAnalyticsInsight
} from '../types/analytics';

// ===========================================
// VIEWER-FOCUSED ANALYTICS ENDPOINTS
// ===========================================

/**
 * Get general watch patterns focused on viewer behavior across the platform
 * This is not specific to any creator or channel
 */
export const getWatchPatterns = async (): Promise<WatchPatterns> => {
  const response = await api.get<{ success: boolean; data: WatchPatterns }>('/api/v1/analytics/watch-patterns');
  return response.data.data;
};

// ===========================================
// CREATOR-FOCUSED ANALYTICS ENDPOINTS
// ===========================================

/**
 * Get channel-specific watch patterns focused on how viewers interact with a specific channel
 * @param channelId The ID of the channel to get watch patterns for
 */
export const getChannelWatchPatterns = async (channelId: string): Promise<ChannelWatchPatterns> => {
  try {
    const response = await api.get<{ success: boolean; data: ChannelWatchPatterns }>(
      `/api/v1/creators/channels/${channelId}/watch-patterns`
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch watch patterns for channel ${channelId}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch channel watch patterns:', error);
    return handleApiError(error, 'channel watch patterns');
  }
};

/**
 * Get social engagement metrics for a specific channel
 * @param channelId The ID of the channel to get social metrics for
 */
export const getSocialMetrics = async (channelId: string): Promise<SocialMetrics> => {
  try {
    const response = await api.get<{ success: boolean; data: SocialMetrics }>(
      `/api/v1/analytics/channels/${channelId}/social-metrics`
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch social metrics for channel ${channelId}`);
    }

    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch social metrics:', error);
    throw error;
  }
};

/**
 * Get growth metrics for a specific channel over a time period
 * @param period The time period to get growth metrics for ('7d', '30d', or 'all')
 * @param channelId The ID of the channel to get growth metrics for
 */
export const getGrowthMetrics = async (period: '7d' | '30d' | 'all', channelId: string): Promise<GrowthMetrics> => {
  try {
    // Add cache-busting timestamp to prevent 304 responses
    const timestamp = new Date().getTime();
    // Construct endpoint with the correct period ('7d', '30d', or 'all')
    const response = await api.get<{ success: boolean; data: GrowthMetrics }>( 
      `/api/v1/analytics/channels/${channelId}/growth?period=${period}&_t=${timestamp}`
    );
    if (!response.data.success) {
      throw new Error(`Failed to fetch growth metrics for channel ${channelId}`);
    }
    // Assuming the backend response now includes a `period` field in `data` 
    // reflecting what was used ('7d', '30d', or potentially 'all' indicating totals)
    // No change needed here if the GrowthMetrics type already accommodates this.
    return response.data.data;
  } catch (error) {
    return handleApiError(error, 'growth metrics');
  }
};

// Cache for view metrics to reduce API calls
const metricsCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get view metrics for a specific channel, with optional detailed time period breakdowns
 * @param channelId The ID of the channel to get view metrics for
 * @param detailed Whether to include detailed time period breakdowns
 */
export const getChannelViewMetrics = async (
  channelId: string,
  detailed: boolean = false
): Promise<BasicViewMetrics | DetailedViewMetrics> => {
  const cacheKey = `views-${channelId}-${detailed}`;
  const cached = metricsCache.get(cacheKey);
  
  // Always get fresh data on each call to prevent stale data issues
  // when switching between periods
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Only use cached data if it's very recent (within 5 seconds)
    if (Date.now() - cached.timestamp < 5000) {
      return cached.data;
    }
  }

  // Add a cache-busting timestamp to prevent 304 responses
  const timestamp = new Date().getTime();
  const endpoint = `/api/v1/analytics/channels/${channelId}/views${detailed ? '?withTimePeriods=true' : ''}${detailed ? '&' : '?'}_t=${timestamp}`;
  
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
  };

  const data = await retryWithBackoff(async () => {
    const response = await api.get<{ 
      success: boolean; 
      data: BasicViewMetrics | DetailedViewMetrics 
    }>(endpoint);

    if (!response.data.success) {
      throw new Error('Failed to fetch channel view metrics');
    }

    return response.data.data;
  });

  metricsCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
};

/**
 * Utility function to check if metrics are detailed
 * @param metrics The metrics to check
 */
export const isDetailedViewMetrics = (
  metrics: BasicViewMetrics | DetailedViewMetrics
): metrics is DetailedViewMetrics => {
  return 'viewsByPeriod' in metrics;
};

/**
 * Get like growth trends for a specific channel
 * @param channelId The ID of the channel to get like growth trends for
 */
export const getLikeGrowthTrends = async (channelId: string): Promise<LikeGrowthTrends> => {
  const response = await api.get<{ success: boolean; data: LikeGrowthTrends }>(
    `/api/v1/analytics/channels/${channelId}/likes/trends`
  );
  return response.data.data;
};

/**
 * Get the most liked videos for a specific channel
 * @param channelId The ID of the channel to get top liked videos for
 */
export const getTopLikedVideos = async (channelId: string): Promise<TopLikedVideos> => {
  const response = await api.get<{ success: boolean; data: TopLikedVideos }>(
    `/api/v1/analytics/channels/${channelId}/likes/top-videos`
  );
  return response.data.data;
};

/**
 * Get the like-to-view ratio for a specific video
 * @param creatorId The ID of the creator who owns the video
 * @param videoId The ID of the video to get the like-to-view ratio for
 */
export const getLikeViewRatio = async (creatorId: string, videoId: number): Promise<LikeViewRatio> => {
  const response = await api.get<{ success: boolean; data: LikeViewRatio }>(
    `/api/v1/creators/${creatorId}/videos/${videoId}/like-ratio`
  );
  return response.data.data;
};

/**
 * Get watch hours for a specific channel, optionally filtered by time period
 * @param channelId The ID of the channel to get watch hours for
 * @param period Optional time period to filter by ('7d' or '30d')
 */
export const getChannelWatchHours = async (
  channelId: string, 
  period?: '7d' | '30d'
): Promise<CreatorWatchHours> => {
  if (!channelId) {
    throw new Error('Channel ID is required');
  }

  try {
    // Add a cache-busting timestamp to prevent 304 responses when switching periods
    const timestamp = new Date().getTime();
    const endpoint = period 
      ? `/api/v1/analytics/channels/${channelId}/watch-hours?period=${period}&_t=${timestamp}`
      : `/api/v1/analytics/channels/${channelId}/watch-hours?_t=${timestamp}`;

    const response = await api.get<{ 
      success: boolean; 
      data: {
        channelId: string;
        totalWatchHours: number;
        period?: '7d' | '30d';
        formattedHours: string;
      }
    }>(endpoint);

    if (!response.data.success) {
      throw new Error(`Failed to fetch watch hours for channel ${channelId}`);
    }

    return {
      totalWatchHours: response.data.data.totalWatchHours,
      formattedHours: response.data.data.formattedHours,
      trend: 0 // We'll need to calculate this separately if needed
    };
  } catch (error) {
    console.error('Failed to fetch channel watch hours:', error);
    throw error;
  }
};

/**
 * Gets engagement trends over time - likes, comments, and shares
 * @param channelId The channel ID
 * @param period Optional time period ('7d', '30d', 'all')
 */
export const getEngagementTrends = async (
  channelId: string,
  period?: '7d' | '30d' | 'all'
): Promise<EngagementTrends> => {
  try {
    // Add timestamp to bust browser cache
    const timestamp = new Date().getTime();
    const params: Record<string, string | number> = { _t: timestamp };
    if (period) params.period = period;
    
    const response = await api.get<{ success: boolean; data: EngagementTrends }>(
      `/api/v1/creators/channels/${channelId}/engagement/trends`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch engagement trends for channel ${channelId}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch engagement trends:', error);
    return handleApiError(error, 'engagement trends');
  }
};

/**
 * Gets the most liked videos for a channel
 * @param channelId The channel ID
 * @param limit Optional limit of videos to return
 */
export const getTopLikedContent = async (
  channelId: string,
  limit?: number
): Promise<TopContentItem[]> => {
  try {
    const params = limit ? { limit } : {};
    
    const response = await api.get<{ success: boolean; data: TopContentItem[] }>(
      `/api/v1/creators/channels/${channelId}/content/top-liked`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch top liked content for channel ${channelId}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch top liked content:', error);
    return handleApiError(error, 'top liked content');
  }
};

/**
 * Gets the most shared videos for a channel
 * @param channelId The channel ID
 * @param limit Optional limit of videos to return
 */
export const getTopSharedContent = async (
  channelId: string,
  limit?: number
): Promise<TopSharedItem[]> => {
  try {
    const params = limit ? { limit } : {};
    
    const response = await api.get<{ success: boolean; data: TopSharedItem[] }>(
      `/api/v1/creators/channels/${channelId}/content/top-shared`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch top shared content for channel ${channelId}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch top shared content:', error);
    return handleApiError(error, 'top shared content');
  }
};

/**
 * Gets top comments for a channel's videos
 * @param channelId The channel ID
 * @param period Optional time period ('7d', '30d', 'all')
 * @param limit Optional limit of comments to return
 */
export const getTopComments = async (
  channelId: string,
  period?: '7d' | '30d' | 'all',
  limit?: number
): Promise<TopComment[]> => {
  try {
    const params: Record<string, string | number> = {};
    if (period) params.period = period;
    if (limit) params.limit = limit;
    
    const response = await api.get<{ success: boolean; data: TopComment[] }>(
      `/api/v1/creators/channels/${channelId}/comments/top`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch top comments for channel ${channelId}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch top comments:', error);
    return handleApiError(error, 'top comments');
  }
};

/**
 * Gets performance metrics for all videos in a channel with pagination and sorting
 * @param channelId The channel ID
 * @param options Optional pagination, sorting and filtering parameters
 */
export const getChannelVideosPerformance = async (
  channelId: string,
  options?: {
    page?: number;
    limit?: number;
    sort_by?: 'views' | 'likes' | 'comments' | 'average_watch_duration_seconds' | 'average_percentage_viewed' | 'createdAt';
    order?: 'asc' | 'desc';
    period?: 'all' | '7d' | '30d' | '90d'; // Add period parameter for time filtering
  }
): Promise<VideoPerformanceResponse> => {
  try {
    // Default options
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const sort_by = options?.sort_by || 'createdAt';
    const order = options?.order || 'desc';
    const period = options?.period || 'all';
    
    // Add timestamp to bust browser cache
    const timestamp = new Date().getTime();
    
    // Build query parameters
    const params: Record<string, string | number> = {
      page,
      limit,
      sort_by,
      order,
      _t: timestamp // Cache-busting parameter
    };

    // Only add period if it's not 'all' since 'all' is the default
    if (period !== 'all') {
      params.period = period;
    }
    
    // Use VideoPerformanceResponse in the expected API response structure
    const response = await api.get<{ 
      success: boolean; 
      data: VideoPerformanceResponse // Use the imported type here
    }>(
      `/api/v1/creators/channels/${channelId}/videos/performance`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch video performance metrics for channel ${channelId}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch channel videos performance:', error);
    // Ensure handleApiError is defined or handle the error directly
    if (typeof handleApiError === 'function') {
      return handleApiError(error, 'video performance metrics');
    } else {
      throw error; // Re-throw if handleApiError is not available
    }
  }
};

// ===========================================
// DEPRECATED ENDPOINTS
// ===========================================

/**
 * @deprecated Use getChannelWatchHours instead, specifying the channel
 */
export const getCreatorWatchHours = async (period: '7d' | '30d'): Promise<CreatorWatchHours> => {
  try {
    const response = await api.get<{ success: boolean; data: CreatorWatchHours }>(
      `/api/v1/analytics/watch-hours?period=${period}`
    );
    if (!response.data.success) {
      throw new Error('Failed to fetch creator watch hours');
    }
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch creator watch hours:', error);
    throw error;
  }
};

/**
 * Gets channel demographic data including geo distribution and device usage
 * @param channelId The ID of the channel
 * @param period Optional time period ('last7', 'last30', 'last90', 'allTime')
 */
export const getChannelDemographics = async (
  channelId: string, 
  period?: 'last7' | 'last30' | 'last90' | 'allTime'
): Promise<ChannelDemographics> => {
  try {
    const params = period ? { period } : {};
    
    const response = await api.get<{ success: boolean; data: ChannelDemographics }>(
      `/api/v1/creators/channels/${channelId}/demographics`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch demographics for channel ${channelId}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch channel demographics:', error);
    return handleApiError(error, 'channel demographics');
  }
};

/**
 * Gets AI-generated insights for channel analytics
 * @param channelId The channel ID
 * @param periods One or more time periods to analyze ('7d', '30d', '90d', 'all')
 */
export const getChannelAnalyticsInsights = async (
  channelId: string,
  periods: ('7d' | '30d' | '90d' | 'all')[] | '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<ChannelAnalyticsInsight> => {
  try {
    // Add cache-busting timestamp to prevent 304 responses
    const timestamp = new Date().getTime();
    const params: Record<string, string | number | string[]> = { _t: timestamp };
    
    // Handle both single period and array of periods
    if (Array.isArray(periods)) {
      params.periods = periods;
    } else {
      params.period = periods;
    }
    
    const response = await api.get<{ success: boolean; data: ChannelAnalyticsInsight }>(
      `/api/v1/creators/channels/${channelId}/analytics/insights`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch analytics insights for channel ${channelId}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch analytics insights:', error);
    throw error;
  }
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Consistent error handling for API requests
 * @param error The error to handle
 * @param context Context for the error (e.g., what was being fetched)
 */
const handleApiError = (error: any, context: string) => {
  console.error(`Failed to fetch ${context}:`, error);
  // Potentially throw a more specific error or return a default error structure
  throw error;
};
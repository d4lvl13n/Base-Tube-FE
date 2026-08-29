import api from './index';
import { 
  SocialMetrics, 
  GrowthMetrics,
  BasicViewMetrics,
  DetailedViewMetrics,
  LikeGrowthTrends,
  TopLikedVideos,
  ChannelWatchPatterns,
  ChannelDemographics,
  EngagementTrends, 
  TopContentItem, 
  TopSharedItem, 
  TopComment,
  VideoPerformanceResponse
} from '../types/analytics';
import {
  INSIGHTS_SCHEMA_VERSION,
  type ChannelInsightsMeta,
  type ChannelInsightsV2,
  type InsightsPeriod
} from '../types/insights';
import { handleApiError as handleError, retryWithBackoff } from '../utils/errorHandler';
import { ErrorCode } from '../types/error';

// Matches GET /analytics/channels/:id/watch-hours
interface WatchTimeData {
  channelId: string;
  totalWatchHours: number;
  /** Exact seconds (additive); lets the UI say "1m 19s" instead of "0.0 hours". */
  totalWatchSeconds?: number;
  period: string;
  formattedHours: string;
}

// ===========================================
// CREATOR-FOCUSED ANALYTICS ENDPOINTS
// ===========================================

/**
 * Get channel-specific watch patterns focused on how viewers interact with a specific channel
 * @param channelId The ID of the channel to get watch patterns for
 */
export const getChannelWatchPatterns = async (
  channelId: string,
  period?: '7d' | '30d' | '90d' | 'all'
): Promise<ChannelWatchPatterns> => {
  const fetchPatterns = async () => {
    const response = await api.get<{ success: boolean; data: ChannelWatchPatterns }>(
      `/api/v1/creators/channels/${channelId}/watch-patterns`,
      { params: period ? { period } : {} }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch watch patterns for channel ${channelId}`);
    }
    
    return response.data.data;
  };

  try {
    return await retryWithBackoff(fetchPatterns, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch channel watch patterns',
      component: 'analytics',
      additionalData: { channelId }
    });
    
    // A failed request must surface as an error state, not as a dashboard
    // full of confident zeros — see docs/ANALYTICS_REVIEW_2026-08-29.md P-F9.
    throw userError;
  }
};

/**
 * Get social engagement metrics for a specific channel
 * @param channelId The ID of the channel to get social metrics for
 */
export const getSocialMetrics = async (channelId: string): Promise<SocialMetrics> => {
  const fetchMetrics = async () => {
    const response = await api.get<{ success: boolean; data: SocialMetrics }>(
      `/api/v1/analytics/channels/${channelId}/social-metrics`
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch social metrics for channel ${channelId}`);
    }

    return response.data.data;
  };

  try {
    return await retryWithBackoff(fetchMetrics, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch social metrics',
      component: 'analytics',
      additionalData: { channelId }
    });

    // Never substitute zeros for a failure (ANALYTICS_REVIEW P-F9).
    throw userError;
  }
};

/**
 * Get growth metrics for a specific channel over a time period
 * @param period The time period to get growth metrics for ('7d', '30d', or 'all')
 * @param channelId The ID of the channel to get growth metrics for
 */
export const getGrowthMetrics = async (period: '7d' | '30d' | 'all', channelId: string): Promise<GrowthMetrics> => {
  const fetchGrowthMetrics = async () => {
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
  };

  try {
    return await retryWithBackoff(fetchGrowthMetrics, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch growth metrics',
      component: 'analytics',
      additionalData: { channelId, period }
    });

    // Never substitute zeros for a failure (ANALYTICS_REVIEW P-F9).
    throw userError;
  }
};

/**
 * Get view metrics for a specific channel, with optional detailed time period
 * breakdowns.
 *
 * There used to be a 5 s module-level cache in front of this. React Query is
 * the cache: a second store the query client cannot see means an
 * invalidateQueries after a mutation refetches and gets served the stale value
 * anyway. Removed.
 */
export const getChannelViewMetrics = async (
  channelId: string,
  detailed: boolean = false
): Promise<BasicViewMetrics | DetailedViewMetrics> => {
  // `_t` defeats the browser HTTP cache (the endpoint does not send no-store);
  // React Query decides when we actually call this at all.
  const endpoint =
    `/api/v1/analytics/channels/${channelId}/views` +
    `${detailed ? '?withTimePeriods=true&' : '?'}_t=${Date.now()}`;

  const fetchMetrics = async () => {
    const response = await api.get<{
      success: boolean;
      data: BasicViewMetrics | DetailedViewMetrics;
    }>(endpoint);

    if (!response.data.success) {
      throw new Error(`Failed to fetch view metrics for channel ${channelId}`);
    }

    return response.data.data;
  };

  try {
    return await retryWithBackoff(fetchMetrics, 2, 1000);
  } catch (error) {
    // Never substitute zeros for a failure (ANALYTICS_REVIEW P-F9).
    throw handleError(error, {
      action: 'fetch channel view metrics',
      component: 'analytics',
      additionalData: { channelId, detailed }
    });
  }
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
 * Get watch hours for a specific channel, optionally filtered by time period
 * @param channelId The ID of the channel to get watch hours for
 * @param period Optional time period to filter by ('7d' or '30d')
 */
export const getChannelWatchHours = async (
  channelId: string,
  // Backend accepts only 7d|30d; omit for all-time (no default — '30d' here
  // silently turned the dashboard's "all-time" stat into 30-day data).
  period?: '7d' | '30d'
): Promise<WatchTimeData> => {
  const fetchWatchTime = async () => {
    const response = await api.get<{ success: boolean; data: WatchTimeData }>(
      `/api/v1/analytics/channels/${channelId}/watch-hours`,
      { params: period ? { period } : {} }
    );

    if (!response.data.success) {
      throw new Error(`Failed to fetch watch hours for channel ${channelId}`);
    }

    return response.data.data;
    };

  try {
    return await retryWithBackoff(fetchWatchTime, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch channel watch hours',
      component: 'analytics',
      additionalData: { channelId, period }
    });

    // Never substitute zeros for a failure (ANALYTICS_REVIEW P-F9).
    throw userError;
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
  const fetchEngagementTrends = async () => {
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
  };

  try {
    return await retryWithBackoff(fetchEngagementTrends, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch engagement trends',
      component: 'analytics',
      additionalData: { channelId, period }
    });

    // Never substitute zeros for a failure (ANALYTICS_REVIEW P-F9).
    throw userError;
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
  const fetchTopContent = async () => {
    const params = limit ? { limit } : {};
    
    const response = await api.get<{ success: boolean; data: TopContentItem[] }>(
      `/api/v1/creators/channels/${channelId}/content/top-liked`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch top liked content for channel ${channelId}`);
    }
    
    return response.data.data;
  };

  try {
    return await retryWithBackoff(fetchTopContent, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch top liked content',
      component: 'analytics',
      additionalData: { channelId, limit }
    });

    // Return empty array for content lists on analytics errors
    if (userError.code === ErrorCode.ANALYTICS_UNAVAILABLE ||
        userError.code === ErrorCode.DATA_PROCESSING_ERROR) {
      console.warn('Top liked content unavailable, returning empty data:', userError.message);
      return [];
    }

    throw userError;
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
  const fetchTopShared = async () => {
    const params = limit ? { limit } : {};
    
    const response = await api.get<{ success: boolean; data: TopSharedItem[] }>(
      `/api/v1/creators/channels/${channelId}/content/top-shared`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch top shared content for channel ${channelId}`);
    }
    
    return response.data.data;
  };

  try {
    return await retryWithBackoff(fetchTopShared, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch top shared content', 
      component: 'analytics',
      additionalData: { channelId, limit }
    });

    // Return empty array for content lists on analytics errors
    if (userError.code === ErrorCode.ANALYTICS_UNAVAILABLE ||
        userError.code === ErrorCode.DATA_PROCESSING_ERROR) {
      console.warn('Top shared content unavailable, returning empty data:', userError.message);
      return [];
    }

    throw userError;
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
  const fetchTopComments = async () => {
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
  };

  try {
    return await retryWithBackoff(fetchTopComments, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch top comments',
      component: 'analytics',
      additionalData: { channelId, period, limit }
    });

    // For top comments, return empty array on analytics errors
    if (userError.code === ErrorCode.ANALYTICS_UNAVAILABLE ||
        userError.code === ErrorCode.DATA_PROCESSING_ERROR) {
      console.warn('Top comments unavailable, returning empty data:', userError.message);
      return [];
    }

    throw userError;
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
  const fetchVideoPerformance = async () => {
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
  };

  try {
    return await retryWithBackoff(fetchVideoPerformance, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch video performance metrics',
      component: 'analytics',
      additionalData: { channelId, options }
    });

    // For video performance, return empty structure on analytics errors
    if (userError.code === ErrorCode.ANALYTICS_UNAVAILABLE ||
        userError.code === ErrorCode.DATA_PROCESSING_ERROR) {
      console.warn('Video performance unavailable, returning empty data:', userError.message);
      return {
        videos: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 20,
          total: 0,
          totalPages: 0
        }
      };
    }

    throw userError;
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
  const fetchDemographics = async () => {
    const params = period ? { period } : {};
    
    const response = await api.get<{ success: boolean; data: ChannelDemographics }>(
      `/api/v1/creators/channels/${channelId}/demographics`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch demographics for channel ${channelId}`);
    }
    
    return response.data.data;
  };

  try {
    return await retryWithBackoff(fetchDemographics, 2, 1000);
  } catch (error) {
    const userError = handleError(error, {
      action: 'fetch channel demographics',
      component: 'analytics',
      additionalData: { channelId, period }
    });

    // For demographics, return empty structure on analytics errors
    if (userError.code === ErrorCode.ANALYTICS_UNAVAILABLE ||
        userError.code === ErrorCode.DATA_PROCESSING_ERROR) {
      console.warn('Channel demographics unavailable, returning empty data:', userError.message);
      return {
        geoDistribution: [],
        deviceUsage: []
      };
    }

    throw userError;
  }
};

/**
 * The service is still generating this report — another request (usually the creator's
 * other tab) holds the generation lock. Not an error: the answer is on its way, and
 * starting a second identical run would just pay for it twice.
 */
export interface InsightsGenerating {
  status: 'generating';
}

export type InsightsResponse =
  | { status: 'ready'; data: ChannelInsightsV2; meta: ChannelInsightsMeta }
  | InsightsGenerating;

/**
 * Creator AI Insights v2 for ONE period.
 *
 * The old endpoint accepted a `periods[]` array, ran a data collection per period and
 * then handed the model only the first one — latency and tokens for nothing. One period
 * per request; each answer is cached on its own key, backend and client alike.
 *
 * `refresh` bypasses the backend's 24 h cache and is capped per channel per day AND per
 * account per day; the remaining channel budget comes back in `meta.refreshRemaining`,
 * and a 429 means a budget is spent (the last report is still readable). That 429 is
 * deliberately excluded from the client's generic retry — see `isInsightsRegeneration`
 * in src/api/index.ts.
 */
export const getChannelInsights = async (
  channelId: string,
  period: InsightsPeriod = '30d',
  options: { refresh?: boolean } = {}
): Promise<InsightsResponse> => {
  const params: Record<string, string> = { period };
  if (options.refresh) params.refresh = '1';

  const response = await api.get<{
    success: boolean;
    status?: 'generating';
    data?: ChannelInsightsV2;
    meta?: ChannelInsightsMeta;
  }>(`/api/v1/creators/channels/${channelId}/analytics/insights`, { params });

  if (response.status === 202 || response.data.status === 'generating') {
    return { status: 'generating' };
  }

  if (!response.data.success || !response.data.data || !response.data.meta) {
    throw new Error(`Failed to fetch insights for channel ${channelId}`);
  }

  // A payload from a contract we do not understand is not rendered half-way: the
  // sections have different meanings across versions and a partial read would be a
  // confident misstatement.
  if (response.data.data.schemaVersion !== INSIGHTS_SCHEMA_VERSION) {
    throw new Error('Insights are unavailable: this client does not understand the report format.');
  }

  return { status: 'ready', data: response.data.data, meta: response.data.meta };
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================
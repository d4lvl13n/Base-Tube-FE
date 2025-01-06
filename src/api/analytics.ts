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
  LikeViewRatio
} from '../types/analytics';

// API creator watch hours - ALL channels (should not be used in CreatorDashboard)
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

// API watch patterns viewers centric
export const getWatchPatterns = async (): Promise<WatchPatterns> => {
  const response = await api.get<{ success: boolean; data: WatchPatterns }>('/api/v1/analytics/watch-patterns');
  return response.data.data;
};

// API social metrics Viewers centric
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

// API creator growth metrics creator centric
export const getGrowthMetrics = async (period: '7d' | '30d', channelId: string): Promise<GrowthMetrics> => {
  try {
    const response = await api.get<{ success: boolean; data: GrowthMetrics }>(
      `/api/v1/analytics/channels/${channelId}/growth?period=${period}`
    );
    if (!response.data.success) {
      throw new Error(`Failed to fetch growth metrics for channel ${channelId}`);
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error, 'growth metrics');
  }
};

// New API calls for channel view metrics
const metricsCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getChannelViewMetrics = async (
  channelId: string,
  detailed: boolean = false
): Promise<BasicViewMetrics | DetailedViewMetrics> => {
  const cacheKey = `views-${channelId}-${detailed}`;
  const cached = metricsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const endpoint = `/api/v1/analytics/channels/${channelId}/views${detailed ? '?withTimePeriods=true' : ''}`;
  
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

// Utility function to check if metrics are detailed
export const isDetailedViewMetrics = (
  metrics: BasicViewMetrics | DetailedViewMetrics
): metrics is DetailedViewMetrics => {
  return 'viewsByPeriod' in metrics;
};

// Like Growth Over Time
export const getLikeGrowthTrends = async (channelId: string): Promise<LikeGrowthTrends> => {
  const response = await api.get<{ success: boolean; data: LikeGrowthTrends }>(
    `/api/v1/analytics/channels/${channelId}/likes/trends`
  );
  return response.data.data;
};

// Most Liked Videos
export const getTopLikedVideos = async (channelId: string): Promise<TopLikedVideos> => {
  const response = await api.get<{ success: boolean; data: TopLikedVideos }>(
    `/api/v1/analytics/channels/${channelId}/likes/top-videos`
  );
  return response.data.data;
};

// Like-to-View Ratio
export const getLikeViewRatio = async (creatorId: string, videoId: number): Promise<LikeViewRatio> => {
  const response = await api.get<{ success: boolean; data: LikeViewRatio }>(
    `/api/v1/creators/${creatorId}/videos/${videoId}/like-ratio`
  );
  return response.data.data;
};

// API creator watch hours - SPECIFIC channel (use this in CreatorDashboard)
export const getChannelWatchHours = async (
  channelId: string, 
  period?: '7d' | '30d'
): Promise<CreatorWatchHours> => {
  if (!channelId) {
    throw new Error('Channel ID is required');
  }

  try {
    const endpoint = period 
      ? `/api/v1/analytics/channels/${channelId}/watch-hours?period=${period}`
      : `/api/v1/analytics/channels/${channelId}/watch-hours`;

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

// Add consistent error handling
const handleApiError = (error: any, context: string) => {
  console.error(`Failed to fetch ${context}:`, error);
  throw error;
};
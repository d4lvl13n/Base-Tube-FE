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

// API creator watch hours
export const getCreatorWatchHours = async (): Promise<CreatorWatchHours> => {
  const response = await api.get<{ success: boolean; data: CreatorWatchHours }>(
    '/api/v1/analytics/creator-watch-hours'
  );
  return response.data.data;
};
// API watch patterns viewers centric
export const getWatchPatterns = async (): Promise<WatchPatterns> => {
  const response = await api.get<{ success: boolean; data: WatchPatterns }>('/api/v1/analytics/watch-patterns');
  return response.data.data;
};
// API social metrics Viewers centric
export const getSocialMetrics = async (): Promise<SocialMetrics> => {
  const response = await api.get<{ success: boolean; data: SocialMetrics }>('/api/v1/analytics/social-metrics');
  return response.data.data;
};
// API creator growth metrics creator centric
export const getGrowthMetrics = async (period: '7d' | '30d'): Promise<GrowthMetrics> => {
  const response = await api.get<{ success: boolean; data: GrowthMetrics }>(
    `/api/v1/analytics/growth?period=${period}`
  );
  return response.data.data;
};

// New API calls for channel view metrics
export const getChannelViewMetrics = async (
  channelId: string,
  detailed: boolean = false
): Promise<BasicViewMetrics | DetailedViewMetrics> => {
  const endpoint = `/api/v1/analytics/channels/${channelId}/views${detailed ? '?withTimePeriods=true' : ''}`;
  
  try {
    const response = await api.get<{ 
      success: boolean; 
      data: BasicViewMetrics | DetailedViewMetrics 
    }>(endpoint);

    if (!response.data.success) {
      throw new Error('Failed to fetch channel view metrics');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching channel view metrics:', error);
    throw error;
  }
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
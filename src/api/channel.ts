// src/api/channel.ts

import api from './index';
import { Channel } from '../types/channel';
import { Video } from '../types/video';
import { 
  SocialMetrics, 
  WatchPatterns, 
  GrowthMetrics, 
  CreatorWatchHours 
} from '../types/analytics';
  
interface ChannelResponse {
  success: boolean;
  channel: Channel;
  message?: string;
}

interface ChannelsResponse {
  success: boolean;
  data: Channel[];
  total: number;
  totalPages: number;
}

interface ChannelDetailsResponse {
  success: boolean;
  channel: Channel;
}

interface ChannelVideosResponse {
  success: boolean;
  data: Video[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ChannelAnalyticsResponse {
  success: boolean;
  data: {
    watchPatterns: WatchPatterns;
    socialMetrics: SocialMetrics;
    growthMetrics: GrowthMetrics;
    creatorWatchHours: CreatorWatchHours;
  };
}

export const getMyChannels = async (
  page: number = 1,
  limit: number = 10,
  sort: string = 'createdAt'
): Promise<Channel[]> => {
  try {
    const response = await api.get<ChannelsResponse>(
      `/api/v1/channels/my?page=${page}&limit=${limit}&sort=${sort}`
    );
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error('Failed to fetch channels');
    }
  } catch (error: unknown) {
    console.error('Error fetching my channels:', error);
    throw error;
  }
};


export const getChannels = async (page: number = 1, limit: number = 12, sort: string = 'subscribers_count'): Promise<ChannelsResponse> => {
  try {
    console.log(`Fetching channels: page=${page}, limit=${limit}, sort=${sort}`);
    const response = await api.get<ChannelsResponse>(`/api/v1/channels?page=${page}&limit=${limit}&sort=${sort}`);
    console.log('API response:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching channels:', error);
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response) {
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
      }
    }
    throw error;
  }
};

export const getChannel = (channelId: string) =>
  api.get<ChannelResponse>(`/api/v1/channels/${channelId}`).then((res) => {
    console.log('Channel Response:', res.data.channel);
    return res.data;
  });

// Update the getPopularChannels function in your frontend API
export const getPopularChannels = async (page: number = 1, limit: number = 15): Promise<Channel[]> => {
  try {
    const response = await api.get<ChannelsResponse>(`/api/v1/channels/popular?page=${page}&limit=${limit}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch popular channels');
  } catch (error) {
    console.error('Error fetching popular channels:', error);
    throw error;
  }
};

export const createChannel = async (channelData: FormData, sessionToken: string) => {
  return api
    .post<ChannelResponse>('/api/v1/channels', channelData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${sessionToken}`,
      },
    })
    .then((res) => res.data);
};

export const updateChannel = (channelId: string, channelData: FormData) =>
  api
    .put<ChannelResponse>(`/api/v1/channels/${channelId}`, channelData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => res.data);

export const deleteChannel = (channelId: string) =>
  api
    .delete<{ success: boolean; message: string }>(`/api/v1/channels/${channelId}`)
    .then((res) => res.data);

export const subscribeToChannel = async (channelIdentifier: string | number) => {
  const response = await api.post(`/api/v1/channels/${channelIdentifier}/subscribe`);
  return response.data;
};

export const unsubscribeFromChannel = async (channelIdentifier: string | number) => {
  const response = await api.post(`/api/v1/channels/${channelIdentifier}/unsubscribe`);
  return response.data;
};

export const getChannelDetails = async (identifier: number | string): Promise<ChannelResponse> => {
  let endpoint: string;
  if (typeof identifier === 'number') {
    endpoint = `/api/v1/channels/${identifier}`;
  } else {
    endpoint = `/api/v1/channels/handle/${identifier}`;
  }
  const response = await api.get(endpoint);
  return response.data;
};

export const getChannelVideos = async (channelId: string, page: number = 1, limit: number = 12): Promise<ChannelVideosResponse> => {
  try {
    const response = await api.get<ChannelVideosResponse>(`/api/v1/channels/${channelId}/videos?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    throw error;
  }
};

export const getChannelAnalytics = async (
  channelId: string,
  period: '7d' | '30d' = '7d'
): Promise<ChannelAnalyticsResponse> => {
  try {
    const response = await api.get<ChannelAnalyticsResponse>(
      `/api/v1/channels/${channelId}/analytics?period=${period}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching channel analytics:', error);
    throw error;
  }
};

export const getChannelWatchPatterns = async (channelId: string): Promise<WatchPatterns> => {
  try {
    const response = await api.get<{ success: boolean; data: WatchPatterns }>(
      `/api/v1/analytics/channels/${channelId}/watch-patterns`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching channel watch patterns:', error);
    throw error;
  }
};

export const getChannelSocialMetrics = async (channelId: string): Promise<SocialMetrics> => {
  try {
    const response = await api.get<{ success: boolean; data: SocialMetrics }>(
      `/api/v1/analytics/channels/${channelId}/social-metrics`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching channel social metrics:', error);
    throw error;
  }
};

export const getChannelGrowthMetrics = async (
  channelId: string,
  period: '7d' | '30d'
): Promise<GrowthMetrics> => {
  try {
    const response = await api.get<{ success: boolean; data: GrowthMetrics }>(
      `/api/v1/analytics/channels/${channelId}/growth?period=${period}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching channel growth metrics:', error);
    throw error;
  }
};

export const getChannelWatchHours = async (channelId: string): Promise<CreatorWatchHours> => {
  try {
    const response = await api.get<{ success: boolean; data: CreatorWatchHours }>(
      `/api/v1/analytics/channels/${channelId}/watch-hours`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching channel watch hours:', error);
    throw error;
  }
};

export const getChannelByHandle = async (handle: string): Promise<ChannelResponse> => {
  const response = await api.get(`/api/v1/channels/handle/${handle}`);
  return response.data;
};

export const checkHandleAvailability = async (handle: string): Promise<{ available: boolean }> => {
  const response = await api.get(`/api/v1/channels/handle-check/${handle}`);
  return response.data;
};

export const getHandleSuggestions = async (name: string): Promise<{ suggestions: string[] }> => {
  const response = await api.get(`/api/v1/channels/handle-suggestions?name=${name}`);
  return response.data;
};

// Fetch channel by ID
export const getChannelById = async (id: string | number): Promise<ChannelDetailsResponse> => {
  const response = await api.get(`/api/v1/channels/${id}`);
  return response.data;
};

// src/api/channel.ts

import api from './index';
import { 
  Channel, 
  ChannelResponse, 
  ChannelsResponse, 
  ChannelDetailsResponse,
  ChannelVideosResponse,
  ChannelAnalyticsResponse,
  ChannelQueryOptions,
  GetChannelsOptions,
  GetChannelsResponse,
  SubscribedChannelResponse,
  GetSubscribedChannelsOptions
} from '../types/channel';
import { 
  SocialMetrics, 
  WatchPatterns, 
  GrowthMetrics, 
  CreatorWatchHours 
} from '../types/analytics';
import axios from 'axios';

export const getMyChannels = async (
  options: ChannelQueryOptions = {}
): Promise<Channel[]> => {
  const { page = 1, limit = 10, sort = 'createdAt' } = options;
  
  try {
    const response = await api.get<ChannelsResponse>(
      `/api/v1/channels/my`, {
        params: { page, limit, sort, include: 'owner' }
      }
    );
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching my channels:', error);
    throw error;
  }
};

export const getChannels = async (options: GetChannelsOptions = {}): Promise<GetChannelsResponse> => {
  const { 
    page = 1, 
    limit = 24,
    sort = 'subscribers_count',
    minSubscribers,
    search 
  } = options;

  try {
    const pageNumber = typeof page === 'string' ? parseInt(page, 10) : page;
    
    const queryParams = new URLSearchParams({
      page: pageNumber.toString(),
      limit: limit.toString(),
      sort
    });

    if (minSubscribers) {
      queryParams.append('minSubscribers', minSubscribers.toString());
    }
    if (search) {
      queryParams.append('search', search);
    }

    const url = `/api/v1/channels?${queryParams.toString()}`;
    console.log('Fetching channels:', url); // Debug log

    const response = await api.get<GetChannelsResponse>(url);
    console.log('Channels response:', response.data); // Debug log
    
    return {
      success: true,
      channels: response.data.channels?.map(channel => ({
        ...channel,
        videos_count: channel.videos_count ?? 0,
        subscribers_count: channel.subscribers_count ?? 0
      })) || [],
      total: response.data.total || 0,
      hasMore: response.data.hasMore || false,
      currentPage: response.data.currentPage || 1,
      itemsPerPage: response.data.itemsPerPage || limit
    };
  } catch (error: unknown) {
    console.error('Error fetching channels:', error);
    throw error;
  }
};

export const getChannel = (channelId: string) =>
  api.get<ChannelResponse>(`/api/v1/channels/${channelId}`).then((res) => {
    console.log('Channel Response:', res.data.channel);
    return res.data;
  });

// Update the getPopularChannels function in your frontend API
export const getPopularChannels = async (
  page: number = 1, 
  limit: number = 15
): Promise<Channel[]> => {
  try {
    const response = await api.get<ChannelsResponse>(
      `/api/v1/channels/popular?page=${page}&limit=${limit}`
    );
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

export const getChannelByHandle = async (handle: string): Promise<Channel> => {
  const response = await api.get<ChannelResponse>(`/api/v1/channels/handle/${handle}`);
  
  return {
    ...response.data.channel,
    videos_count: response.data.channel?.videos_count ?? 0,
    subscribers_count: response.data.channel?.subscribers_count ?? 0
  };
};

export const checkHandleAvailability = async (
  handle: string
): Promise<{ isAvailable: boolean; message?: string }> => {
  const response = await api.get(`/api/v1/channels/handle-check/${handle}`);
  return response.data;
};

// Fetch channel by ID
export const getChannelById = async (id: string | number): Promise<ChannelDetailsResponse> => {
  const response = await api.get(`/api/v1/channels/${id}`);
  
  const channel = {
    ...response.data.channel,
    videos_count: response.data.channel.videos_count ?? 0
  };
  
  return {
    ...response.data,
    channel
  };
};

export const getHandleSuggestions = async (
  name: string,
  context?: { type?: string; description?: string }
): Promise<{ success: boolean; suggestions: string[]; message?: string }> => {
  const params = new URLSearchParams(context as Record<string, string>);
  const response = await api.get(
    `/api/v1/channels/handle-suggestions/${encodeURIComponent(name)}?${params.toString()}`
  );
  return response.data;
};

export const getChannelDescription = async (
  name: string,
  context?: {
    type?: string;
    keywords?: string[];
    additionalInfo?: string;
  }
): Promise<{
  success: boolean;
  description: string;
  originalName: string;
  message?: string;
}> => {
  const params = new URLSearchParams();

  if (context?.type && context.type.trim()) {
    params.append('type', context.type.trim());
  }
  if (context?.keywords && context.keywords.length > 0) {
    const keywords = context.keywords
      .map((kw) => kw.trim())
      .filter((kw) => kw);
    if (keywords.length > 0) {
      params.append('keywords', keywords.join(','));
    }
  }
  if (context?.additionalInfo && context.additionalInfo.trim()) {
    params.append('additionalInfo', context.additionalInfo.trim());
  }

  const response = await api.get(
    `/api/v1/channels/description/${encodeURIComponent(name)}?${params.toString()}`
  );

  return response.data;
};

export const getSubscribedChannels = async (
  options: GetSubscribedChannelsOptions = {}
): Promise<SubscribedChannelResponse> => {
  const { 
    page = 1, 
    limit = 24, 
    sort = 'subscribers_count' 
  } = options;

  try {
    const response = await api.get<SubscribedChannelResponse>(
      '/api/v1/channels/subscribed',
      {
        params: {
          page,
          limit,
          sort
        }
      }
    );

    return {
      success: true,
      data: response.data.data || [],
      pagination: response.data.pagination || {
        total: 0,
        hasMore: false,
        currentPage: 1,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    // If it's a 404, return empty data instead of throwing
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        success: true,
        data: [],
        pagination: {
          total: 0,
          hasMore: false,
          currentPage: 1,
          itemsPerPage: limit
        }
      };
    }
    console.error('Error fetching subscribed channels:', error);
    throw error;
  }
};

// src/api/channel.ts

import api from './index';
import { Channel } from '../types/channel';
import { Video } from '../types/video';

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

export const getMyChannels = (page: number = 1, limit: number = 10, sort: string = 'createdAt') =>
  api
    .get<ChannelsResponse>(`/api/v1/channels/my?page=${page}&limit=${limit}&sort=${sort}`)
    .then((res) => res.data);


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
  api.get<ChannelResponse>(`/api/v1/channels/${channelId}`).then((res) => res.data);

export const getPopularChannels = (page: number = 1, limit: number = 15) =>
  api
    .get<ChannelsResponse>(`/api/v1/channels/popular?page=${page}&limit=${limit}`)
    .then((res) => res.data.data); // Extract the 'data' property // Extract the 'data' property which is the array of channels

export const createChannel = (channelData: FormData) =>
  api
    .post<ChannelResponse>('/api/v1/channels', channelData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => res.data);

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

export const subscribeToChannel = (channelId: string) =>
  api
    .post<ChannelResponse>(`/api/v1/channels/${channelId}/subscribe`)
    .then((res) => res.data);

export const unsubscribeFromChannel = (channelId: string) =>
  api
    .post<ChannelResponse>(`/api/v1/channels/${channelId}/unsubscribe`)
    .then((res) => res.data);

export const getChannelDetails = async (channelId: string): Promise<ChannelDetailsResponse> => {
  try {
    const response = await api.get<ChannelDetailsResponse>(`/api/v1/channels/${channelId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching channel details:', error);
    throw error;
  }
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
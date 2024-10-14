import api from './index';
import { Channel } from '../types/channel';

export const getPopularChannels = (limit: number = 10) => 
  api.get<Channel[]>(`/api/v1/channels/popular?limit=${limit}`);

export const getChannelById = (id: string) => 
  api.get<Channel>(`/api/v1/channels/${id}`);

export const createChannel = (name: string, description: string) =>
  api.post<Channel>('/api/v1/channels', { name, description });

export const updateChannel = (id: string, name: string, description: string) =>
  api.put<Channel>(`/api/v1/channels/${id}`, { name, description });

export const deleteChannel = (id: string) => 
  api.delete(`/api/v1/channels/${id}`);

export const subscribeToChannel = (id: string) => 
  api.post(`/api/v1/channels/${id}/subscribe`);

export const unsubscribeFromChannel = (id: string) => 
  api.post(`/api/v1/channels/${id}/unsubscribe`);
// src/api/profile.ts

import api from './index';
import {
  UserProfile,
  UserNFT,
  UserWallet,
} from '../types/user';
import { Video } from '../types/video';

export const getAllProfiles = () => api.get('/api/v1/profile');

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/api/v1/profile');
  return response.data.data;
};

export const getMyVideos = async (): Promise<Video[]> => {
  const response = await api.get('/api/v1/profile/videos');
  return response.data.data;
};

export const getMyNFTs = async (): Promise<UserNFT[]> => {
  const response = await api.get('/api/v1/profile/nfts');
  return response.data.data;
};

export const getMyWallet = async (): Promise<UserWallet> => {
  const response = await api.get('/api/v1/profile/wallet');
  return response.data.data;
};

export const getProfileSettings = async () => {
  const response = await api.get('/api/v1/profile/settings');
  return response.data.data;
};

export const updateProfileSettings = async (settingsData: any) => {
  await api.put('/api/v1/profile/settings', settingsData);
};

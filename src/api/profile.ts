import api from './index';
import {
  UserProfile,
  UserNFT,
  UserWallet,
  ProfileSettings,
} from '../types/user';
import { Video } from '../types/video';

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await api.get<{ success: boolean; data: UserProfile }>('/api/v1/profile');
  return response.data.data;
};

export const getMyVideos = async (): Promise<Video[]> => {
  const response = await api.get('/api/v1/profile/videos');
  return response.data;
};

export const getMyNFTs = async (): Promise<UserNFT[]> => {
  const response = await api.get('/api/v1/profile/nfts');
  return response.data;
};

export const getMyWallet = async (): Promise<UserWallet> => {
  const response = await api.get('/api/v1/profile/wallet');
  return response.data;
};

export const getProfileSettings = async (): Promise<ProfileSettings> => {
  const response = await api.get('/api/v1/profile/settings');
  return response.data.data;
};

export const updateProfileSettings = async (settingsData: ProfileSettings) => {
  await api.put('/api/v1/profile/settings', settingsData);
};

export const updateProfile = async (profileData: FormData): Promise<UserProfile> => {
  const response = await api.put<{ success: boolean; message: string; data: UserProfile }>(
    '/api/v1/profile/update',
    profileData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data.data;
};

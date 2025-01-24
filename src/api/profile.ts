import api from './index';
import {
  UserProfile,
  UserNFT,
  UserWallet,
  ProfileSettings,
  UserMetrics,
  InteractionsHistory,
  ReferralInfo,
} from '../types/user';
import { Video } from '../types/video';
import { WatchHistory, LikesHistory } from '../types/history';
 

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
  const response = await api.get<{ success: boolean; data: UserWallet }>('/api/v1/profile/wallet');
  return response.data.data;
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

export const getWatchHistory = async (): Promise<{ data: WatchHistory[] }> => {
  const response = await api.get('/api/v1/profile/history/watch');
  return response.data;
};

export const getLikesHistory = async (): Promise<{ data: LikesHistory[] }> => {
  const response = await api.get('/api/v1/profile/history/likes');
  return response.data;
};

export const getInteractionsHistory = async (): Promise<InteractionsHistory[]> => {
  const response = await api.get('/api/v1/profile/history/interactions');
  return response.data.data;
};

export const getReferralInfo = async (): Promise<ReferralInfo> => {
  const response = await api.get('/api/v1/referrals');
  return response.data.data;
};

export const generateReferralCode = async (): Promise<ReferralInfo> => {
  const response = await api.post('/api/v1/referrals/generate');
  return response.data.data;
};

export const getUserMetrics = async (): Promise<UserMetrics> => {
  const response = await api.get<{ success: boolean; data: UserMetrics }>('/api/v1/analytics/metrics');
  return response.data.data;
};
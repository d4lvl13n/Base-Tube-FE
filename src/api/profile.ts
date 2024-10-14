import api from './index';
import { UserProfile, UserVideo, UserNFT, UserWallet } from '../types/user';

export const getAllProfiles = () => api.get('/api/v1/profile');

export const getMyProfile = (): Promise<UserProfile> => 
  api.get('/api/v1/profile/me').then(response => response.data);

export const getMyVideos = (): Promise<UserVideo[]> => 
  api.get('/api/v1/videos/me').then(response => response.data);

export const getMyNFTs = (): Promise<UserNFT[]> => 
  api.get('/api/v1/nfts/me').then(response => response.data);

export const getMyWallet = (): Promise<UserWallet> => 
  api.get('/api/v1/wallet/me').then(response => response.data);
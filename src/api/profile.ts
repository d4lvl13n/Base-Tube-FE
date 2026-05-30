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
import { parseApiErrorFromBody } from '../utils/apiError';
import { getProfileErrorMessage } from '../utils/profileErrorMessages';

export class ProfileApiError extends Error {
  readonly code: string | null;
  readonly canRetry: boolean;

  constructor(code: string | null, message: string, canRetry = false) {
    super(message);
    this.name = 'ProfileApiError';
    this.code = code;
    this.canRetry = canRetry;
  }
}

const normalizeReferralInfo = (raw: any): ReferralInfo => ({
  id: Number(raw.id),
  userId: raw.userId ?? raw.user_id ?? '',
  code: raw.code ?? '',
  referralsCount: Number(raw.referralsCount ?? raw.referrals_count ?? 0),
  earnings: Number(raw.earnings ?? 0),
});

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
  try {
    const response = await api.put<{
      success: boolean;
      message?: string;
      data: UserProfile;
    }>('/api/v1/profile/update', profileData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const body = response.data;
    const apiError = parseApiErrorFromBody(body);
    if (apiError) {
      const parsed = getProfileErrorMessage(body);
      throw new ProfileApiError(parsed.code, parsed.message, parsed.canRetry);
    }

    if (!body.data) {
      throw new ProfileApiError(null, 'Invalid profile update response from server.');
    }

    return body.data;
  } catch (error: unknown) {
    if (error instanceof ProfileApiError) {
      throw error;
    }
    const parsed = getProfileErrorMessage(error);
    throw new ProfileApiError(parsed.code, parsed.message, parsed.canRetry);
  }
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

export const getMyReferral = async (): Promise<ReferralInfo> => {
  const response = await api.get('/api/v1/referrals/referrals');
  return normalizeReferralInfo(response.data.data);
};

export const rotateMyReferralCode = async (): Promise<ReferralInfo> => {
  const response = await api.post('/api/v1/referrals/referrals/generate', { rotate: true });
  return normalizeReferralInfo(response.data.data);
};

export const applyReferralCode = async (code: string) => {
  const response = await api.post('/api/v1/referrals/referrals/apply', { code });
  if (response.data?.success === false) {
    const parsed = parseApiErrorFromBody(response.data);
    throw new Error(parsed?.message ?? 'Failed to apply referral code');
  }
  return response.data.data;
};

export const getReferralInfo = getMyReferral;

export const generateReferralCode = async (): Promise<ReferralInfo> => {
  const response = await api.post('/api/v1/referrals/referrals/generate');
  return normalizeReferralInfo(response.data.data);
};

export const getUserMetrics = async (): Promise<UserMetrics> => {
  const response = await api.get<{ success: boolean; data: UserMetrics }>('/api/v1/analytics/metrics');
  return response.data.data;
};

import { useQuery } from '@tanstack/react-query';
import { getMyProfile, getMyWallet, getProfileSettings, getWatchHistory, getLikesHistory, getReferralInfo } from '../api/profile';
import { WatchHistory, LikesHistory } from '../types/history';

export const useProfileData = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
};

export const useWalletData = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: getMyWallet,
    staleTime: 0,  // Always fetch fresh data
    gcTime: 0,     // No garbage collection time
    retry: 2
  });
};

export const useSettingsData = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getProfileSettings,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};

export const useWatchHistory = () => {
  return useQuery<{ data: WatchHistory[] }>({
    queryKey: ['watchHistory'],
    queryFn: getWatchHistory,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useLikesHistory = () => {
  return useQuery<{ data: LikesHistory[] }, Error>({
    queryKey: ['likesHistory'],
    queryFn: getLikesHistory,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useReferralInfo = () => {
  return useQuery({
    queryKey: ['referralInfo'],
    queryFn: getReferralInfo,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};
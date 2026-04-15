import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyReferralCode,
  getMyProfile,
  getMyReferral,
  getMyWallet,
  getProfileSettings,
  getWatchHistory,
  getLikesHistory,
  rotateMyReferralCode,
} from '../api/profile';
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
    queryFn: getMyReferral,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};

export const useRotateReferralCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rotateMyReferralCode,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['referralInfo'] });
    },
  });
};

export const useApplyReferralCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyReferralCode,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['referralInfo'] }),
        queryClient.invalidateQueries({ queryKey: ['growth', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['growth', 'history'] }),
      ]);
    },
  });
};

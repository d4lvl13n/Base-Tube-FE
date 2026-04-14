import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { growthApi } from '../api/growth';
import type {
  GrowthHistoryData,
  GrowthLeaderboardData,
  GrowthMeData,
  GrowthMissionsData,
  GrowthQuestsData,
  GrowthRedemptionsData,
  GrowthReferralApplication,
  GrowthRewardRedemption,
  GrowthRewardsData,
} from '../types/growth';

export const useGrowthMe = () =>
  useQuery<GrowthMeData>({
    queryKey: ['growth', 'me'],
    queryFn: growthApi.getGrowthMe,
    staleTime: 60_000,
  });

export const useGrowthMissions = () =>
  useQuery<GrowthMissionsData>({
    queryKey: ['growth', 'missions'],
    queryFn: growthApi.getGrowthMissions,
    staleTime: 60_000,
  });

export const useGrowthQuests = () =>
  useQuery<GrowthQuestsData>({
    queryKey: ['growth', 'quests'],
    queryFn: growthApi.getGrowthQuests,
    staleTime: 60_000,
  });

export const useGrowthHistory = (params?: {
  limit?: number;
  offset?: number;
  layer?: 'xp' | 'reputation' | 'credits';
}) =>
  useQuery<GrowthHistoryData>({
    queryKey: ['growth', 'history', params?.limit ?? 20, params?.offset ?? 0, params?.layer ?? 'all'],
    queryFn: () => growthApi.getGrowthHistory(params),
    staleTime: 60_000,
  });

export const useGrowthLeaderboard = (params?: {
  limit?: number;
  mode?: 'xp' | 'reputation' | 'credits';
}) =>
  useQuery<GrowthLeaderboardData>({
    queryKey: ['growth', 'leaderboard', params?.limit ?? 50, params?.mode ?? 'default'],
    queryFn: () => growthApi.getGrowthLeaderboard(params),
    staleTime: 60_000,
  });

export const useGrowthRewards = () =>
  useQuery<GrowthRewardsData>({
    queryKey: ['growth', 'rewards'],
    queryFn: growthApi.getGrowthRewards,
    staleTime: 60_000,
  });

export const useGrowthRedemptions = (params?: { limit?: number; offset?: number }) =>
  useQuery<GrowthRedemptionsData>({
    queryKey: ['growth', 'redemptions', params?.limit ?? 20, params?.offset ?? 0],
    queryFn: () => growthApi.getMyGrowthRedemptions(params),
    staleTime: 30_000,
  });

export const useRedeemGrowthReward = () => {
  const queryClient = useQueryClient();

  return useMutation<GrowthRewardRedemption, Error, number>({
    mutationFn: (rewardId) => growthApi.redeemGrowthReward(rewardId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['growth', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['growth', 'rewards'] }),
        queryClient.invalidateQueries({ queryKey: ['growth', 'redemptions'] }),
        queryClient.invalidateQueries({ queryKey: ['growth', 'history'] }),
        queryClient.invalidateQueries({ queryKey: ['userPoints'] }),
      ]);
    },
  });
};

export const useApplyReferralCode = () => {
  const queryClient = useQueryClient();

  return useMutation<GrowthReferralApplication, Error, string>({
    mutationFn: (code) => growthApi.applyReferralCode(code),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['growth', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['growth', 'history'] }),
        queryClient.invalidateQueries({ queryKey: ['referralInfo'] }),
      ]);
    },
  });
};

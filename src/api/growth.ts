import api from './index';
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
import {
  normalizeGrowthHistory,
  normalizeGrowthLeaderboard,
  normalizeGrowthMe,
  normalizeGrowthMissions,
  normalizeGrowthQuests,
  normalizeGrowthRedemptions,
  normalizeGrowthReferralApplication,
  normalizeGrowthRewardRedemption,
  normalizeGrowthRewards,
} from '../utils/growth';

export const growthApi = {
  async getGrowthMe(): Promise<GrowthMeData> {
    const response = await api.get('/api/v1/growth/me');
    return normalizeGrowthMe(response.data);
  },

  async getGrowthMissions(): Promise<GrowthMissionsData> {
    const response = await api.get('/api/v1/growth/me/missions');
    return normalizeGrowthMissions(response.data);
  },

  async getGrowthQuests(): Promise<GrowthQuestsData> {
    const response = await api.get('/api/v1/growth/me/quests');
    return normalizeGrowthQuests(response.data);
  },

  async getGrowthHistory(params?: {
    limit?: number;
    offset?: number;
    layer?: 'xp' | 'reputation' | 'credits';
  }): Promise<GrowthHistoryData> {
    const response = await api.get('/api/v1/growth/me/history', { params });
    return normalizeGrowthHistory(response.data);
  },

  async getGrowthLeaderboard(params?: {
    limit?: number;
    mode?: 'xp' | 'reputation' | 'credits';
  }): Promise<GrowthLeaderboardData> {
    const response = await api.get('/api/v1/growth/leaderboard', { params });
    return normalizeGrowthLeaderboard(response.data);
  },

  async getGrowthRewards(): Promise<GrowthRewardsData> {
    const response = await api.get('/api/v1/growth/rewards');
    return normalizeGrowthRewards(response.data);
  },

  async redeemGrowthReward(rewardId: number): Promise<GrowthRewardRedemption> {
    const response = await api.post(`/api/v1/growth/rewards/${rewardId}/redeem`);
    if (response.data?.success === false) {
      const message = response.data?.error?.message || response.data?.message || 'Failed to redeem reward';
      throw new Error(message);
    }
    return normalizeGrowthRewardRedemption(response.data);
  },

  async getMyGrowthRedemptions(params?: { limit?: number; offset?: number }): Promise<GrowthRedemptionsData> {
    const response = await api.get('/api/v1/growth/me/redemptions', { params });
    return normalizeGrowthRedemptions(response.data);
  },

  async applyReferralCode(code: string): Promise<GrowthReferralApplication> {
    const response = await api.post('/api/v1/referrals/referrals/apply', { code });
    if (response.data?.success === false) {
      const message = response.data?.error?.message || response.data?.message || 'Failed to apply referral code';
      throw new Error(message);
    }
    return normalizeGrowthReferralApplication(response.data);
  },
};

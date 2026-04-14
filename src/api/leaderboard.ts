import api from './index';
import type { GrowthLeaderboardData, GrowthLeaderboardEntry, GrowthLeaderboardMode } from '../types/growth';
import { normalizeGrowthLeaderboard } from '../utils/growth';

export type LeaderboardEntry = GrowthLeaderboardEntry;

export type LeaderboardResponse = GrowthLeaderboardData;

/**
 * Fetches the growth-backed leaderboard.
 */
export const getLeaderboard = async (
  params?: { mode?: GrowthLeaderboardMode; limit?: number }
): Promise<GrowthLeaderboardData> => {
  try {
    const response = await api.get('/api/v1/growth/leaderboard', { params });
    return normalizeGrowthLeaderboard(response.data);
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

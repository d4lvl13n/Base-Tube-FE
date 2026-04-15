import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../api/leaderboard';
import type { GrowthLeaderboardData, GrowthLeaderboardMode } from '../types/growth';

export const useLeaderboard = (params?: { mode?: GrowthLeaderboardMode; limit?: number }) => {
  return useQuery<GrowthLeaderboardData>({
    queryKey: ['leaderboard', params?.mode ?? 'default', params?.limit ?? 50],
    queryFn: () => getLeaderboard(params),
    gcTime: 60000, // Cache the leaderboard data for 1 minute
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};

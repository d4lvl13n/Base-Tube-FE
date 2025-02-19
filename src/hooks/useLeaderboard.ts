import { useQuery } from '@tanstack/react-query';
import { getLeaderboard, LeaderboardEntry } from '../api/leaderboard';

export const useLeaderboard = () => {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    gcTime: 60000, // Cache the leaderboard data for 1 minute
  });
}; 
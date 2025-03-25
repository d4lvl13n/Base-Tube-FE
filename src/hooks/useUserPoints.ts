import { useQuery } from '@tanstack/react-query';
import { fetchUserPoints, fetchUserPointsHistory } from '../api/userPoints';
import { UserPointsData, UserPointsHistoryData } from '../types/userPoints';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '@clerk/clerk-react';

/**
 * Custom hook to fetch and reuse user points.
 * Now includes rank information and progress to next level.
 */
export const useUserPoints = () => {
  const { isAuthenticated, user: web3User } = useAuth();
  const { user: clerkUser } = useUser();
  
  const userId = isAuthenticated ? web3User?.id : clerkUser?.id;

  return useQuery<UserPointsData>({
    queryKey: ['userPoints', userId],
    queryFn: () => fetchUserPoints(userId!),
    enabled: !!userId,
    refetchInterval: 60000,
    select: (data) => ({
      ...data,
      // Calculate percentage progress to next rank if available
      progressToNextRank: data.rank.nextRankPoints 
        ? Math.min(
            ((data.totalPoints - data.rank.minPoints) /
            (data.rank.nextRankPoints - data.rank.minPoints)) * 100,
            100
          )
        : 100, // If no next rank, show as complete
    }),
  });
};

/**
 * Custom hook to fetch and reuse user points history.
 */
export const useUserPointsHistory = (period: '24h' | '7d' | '30d' = '24h') => {
  const { isAuthenticated, user: web3User } = useAuth();
  const { user: clerkUser } = useUser();
  
  const userId = isAuthenticated ? web3User?.id : clerkUser?.id;

  return useQuery<UserPointsHistoryData[]>({
    queryKey: ['userPointsHistory', userId, period],
    queryFn: () => fetchUserPointsHistory(userId!, period),
    enabled: !!userId,
    refetchInterval: 60000,
  });
};

// Add a type guard to check if rank data is available
export const hasRankData = (data: UserPointsData): boolean => {
  return !!(data.rank && data.rank.rank);
};
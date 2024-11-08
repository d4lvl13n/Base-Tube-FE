import { useQuery } from '@tanstack/react-query';
import { getUserMetrics } from '../api/profile';
import { UserMetrics } from '../types/user';

export const useUserMetrics = () => {
  return useQuery<UserMetrics>({
    queryKey: ['userMetrics'],
    queryFn: getUserMetrics,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    select: (data) => ({
      ...data,
      totalViews: Number(data.totalViews) || 0,
      videosWatched: Number(data.videosWatched) || 0,
      likesGiven: Number(data.likesGiven) || 0,
      commentsCount: Number(data.commentsCount) || 0,
    })
  });
};
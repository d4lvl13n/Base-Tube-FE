import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '../api/analytics';
import { LikeGrowthTrends, TopLikedVideos } from '../types/analytics';

export const useLikesAnalytics = (channelId: string) => {
  const likeGrowthQuery = useQuery<LikeGrowthTrends>({
    queryKey: ['likeGrowth', channelId],
    queryFn: () => analyticsApi.getLikeGrowthTrends(channelId),
    staleTime: 5 * 60 * 1000,
    enabled: !!channelId,
  });

  const topVideosQuery = useQuery<TopLikedVideos>({
    queryKey: ['topLikedVideos', channelId],
    queryFn: () => analyticsApi.getTopLikedVideos(channelId),
    staleTime: 5 * 60 * 1000,
    enabled: !!channelId,
  });

  return {
    likeGrowth: likeGrowthQuery.data,
    topVideos: topVideosQuery.data,
    isLoading: likeGrowthQuery.isLoading || topVideosQuery.isLoading,
    isError: likeGrowthQuery.isError || topVideosQuery.isError,
    error: likeGrowthQuery.error || topVideosQuery.error,
  };
};
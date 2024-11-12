import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as videoApi from '../api/video';
import type { LikeResponse, LikeStatusResponse } from '../types/like';

export const useLikes = (videoId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['videoLike', videoId];

  // Query for like status
  const { data: likeStatus } = useQuery<LikeStatusResponse>({
    queryKey,
    queryFn: () => videoApi.getVideoLikeStatus(videoId),
    enabled: !!videoId,
  });

  // Mutation for toggling like
  const { mutateAsync: toggleLike, isPending: isTogglingLike } = useMutation<LikeResponse>({
    mutationFn: () => videoApi.toggleVideoLike(videoId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    isLiked: likeStatus?.data.isLiked ?? false,
    toggleLike,
    isTogglingLike
  };
};
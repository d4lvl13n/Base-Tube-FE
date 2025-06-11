import { useQuery } from '@tanstack/react-query';
import { getVideoById } from '../api/video';
import { Video } from '../types/video';
import { queryKeys } from '../utils/queryKeys';

export const useVideoFetch = (id: string) => {
  return useQuery({
    queryKey: queryKeys.video.byId(id),
    queryFn: async () => {
      const response = await getVideoById(id);
      return response.data;
    },
    enabled: !!id, // Only run query if id exists
    staleTime: 5 * 60 * 1000, // 5 minutes - videos don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (video not found)
      if (error?.status === 404 || error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2; // Retry up to 2 times for other errors
    },
  });
};

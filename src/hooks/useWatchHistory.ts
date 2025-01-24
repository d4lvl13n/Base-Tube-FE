import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserWatchHistory } from '../api/video';

export const useWatchHistory = (limit: number = 10) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['watchHistory'],
    queryFn: ({ pageParam = 1 }) => getUserWatchHistory(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination) return undefined;
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  const watchHistory = data?.pages.flatMap(page => page.data) ?? [];
  
  return {
    watchHistory,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error
  };
}; 
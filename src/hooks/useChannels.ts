// src/hooks/useChannels.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { getChannels } from '../api/channel';
import type { Channel, GetChannelsOptions, GetChannelsResponse } from '../types/channel';

interface UseChannelsReturn {
  channels: Channel[];
  hasMore: boolean;
  total: number;
  isLoading: boolean;
  error: unknown;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

export const useChannels = (options: Omit<GetChannelsOptions, 'page'> = {}): UseChannelsReturn => {
  const {
    limit = 24,
    sort = 'subscribers_count',
    minSubscribers,
    search
  } = options;

  const query = useInfiniteQuery<GetChannelsResponse>({
    queryKey: ['channels', { sort, limit, minSubscribers, search }],
    queryFn: ({ pageParam }) => getChannels({ 
      ...options, 
      page: pageParam as number,
      limit 
    }),
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return (lastPage.currentPage ?? 0) + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  // Use optional chaining and nullish coalescing for safety
  const channels = query.data?.pages.flatMap(page => page.channels ?? []) ?? [];

  return {
    channels,
    hasMore: query.hasNextPage ?? false,
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage
  };
};
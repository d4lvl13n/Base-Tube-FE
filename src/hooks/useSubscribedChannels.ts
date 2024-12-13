import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getSubscribedChannels } from '../api/channel';
import { Channel } from '../types/channel';
import axios from 'axios';
import { useCallback } from 'react';

interface UseSubscribedChannelsOptions {
  limit?: number;
  sort?: string;
}

interface UseSubscribedChannelsReturn {
  channels: Channel[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  markAsWatched?: (channelId: number) => void;
}

export const useSubscribedChannels = (
  options: UseSubscribedChannelsOptions = {}
): UseSubscribedChannelsReturn => {
  const queryClient = useQueryClient();
  const { limit = 24, sort = 'subscribers_count' } = options;

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['subscribedChannels', sort, limit],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        return await getSubscribedChannels({ page: pageParam, limit, sort });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return {
            success: true,
            data: [],
            pagination: {
              total: 0,
              hasMore: false,
              currentPage: 1,
              itemsPerPage: limit
            }
          };
        }
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) return undefined;
      return lastPage.pagination.currentPage + 1;
    },
    initialPageParam: 1,
    retry: false,
  });

  const channels = data?.pages.flatMap(page => page.data) ?? [];

  const markAsWatched = useCallback((channelId: number) => {
    queryClient.setQueryData(['subscribedChannels', sort, limit], (oldData: any) => ({
      ...oldData,
      pages: oldData.pages.map((page: any) => ({
        ...page,
        data: page.data.map((channel: Channel) => 
          channel.id === channelId 
            ? { ...channel, hasNewContent: false }
            : channel
        )
      }))
    }));
  }, [queryClient, sort, limit]);

  return {
    channels,
    isLoading,
    error: error as Error | null,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    markAsWatched,
  };
}; 
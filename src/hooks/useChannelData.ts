import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChannelById, getChannelByHandle } from '../api/channel';
import type { Channel } from '../types/channel';

export const useChannelData = (identifier?: number | string | null) => {
  const queryClient = useQueryClient();

  const isHandle = typeof identifier === 'string' && isNaN(Number(identifier));

  const query = useQuery<Channel>({
    queryKey: ['channel', identifier],
    queryFn: async () => {
      if (!identifier) throw new Error('Channel identifier is required');

      if (isHandle) {
        return getChannelByHandle(identifier as string);
      } else {
        const response = await getChannelById(identifier as number);
        return response.channel;
      }
    },
    enabled: identifier !== null && identifier !== undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  const updateSubscriptionStatus = (newStatus: boolean) => {
    if (!identifier) return;

    queryClient.setQueryData(['channel', identifier], (oldData: Channel | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        isSubscribed: newStatus,
        subscribers_count: newStatus
          ? (oldData.subscribers_count || 0) + 1
          : (oldData.subscribers_count || 1) - 1,
      };
    });
  };

  return {
    channel: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateSubscriptionStatus,
  };
};
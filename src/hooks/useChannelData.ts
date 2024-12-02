import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChannelDetails } from '../api/channel';
import type { Channel } from '../types/channel';

export const useChannelData = (channelId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<Channel>({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      if (!channelId) throw new Error('Channel ID is required');
      const response = await getChannelDetails(channelId);
      return response.channel;
    },
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });

  // Helper function to update subscription status in cache
  const updateSubscriptionStatus = (newStatus: boolean) => {
    if (!channelId) return;
    
    queryClient.setQueryData(['channel', channelId], (oldData: Channel | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        isSubscribed: newStatus,
        subscribers_count: newStatus 
          ? (oldData.subscribers_count || 0) + 1 
          : (oldData.subscribers_count || 1) - 1
      };
    });
  };

  return {
    channel: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateSubscriptionStatus
  };
};
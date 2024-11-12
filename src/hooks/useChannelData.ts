import { useQuery } from '@tanstack/react-query';
import { getChannelDetails } from '../api/channel';
import type { Channel } from '../types/channel';

export const useChannelData = (channelId?: string) => {
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

  return {
    channel: query.data,
    isLoading: query.isLoading,
    error: query.error
  };
};
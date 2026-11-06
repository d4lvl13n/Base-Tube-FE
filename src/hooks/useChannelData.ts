import { useQuery, useQueryClient } from '@tanstack/react-query';
import { channelQueryOptions } from '../queries/publicContent';
import type { InfiniteData } from '@tanstack/react-query';
import type { ChannelOverview } from '../types/channel';
import type { Channel } from '../types/channel';

export const useChannelData = (identifier?: number | string | null) => {
  const queryClient = useQueryClient();

  const overview = queryClient.getQueriesData<InfiniteData<ChannelOverview>>({ queryKey: ['channel-overview'] })
    .map(([key, data]) => ({ key, channel: data?.pages[0]?.channel }))
    .find(({ channel }) => channel && (String(channel.id) === String(identifier) || channel.handle === identifier));
  const query = useQuery({
    ...channelQueryOptions(identifier ?? ''),
    enabled: identifier !== null && identifier !== undefined,
    initialData: overview?.channel,
    initialDataUpdatedAt: overview ? queryClient.getQueryState(overview.key)?.dataUpdatedAt : undefined,
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
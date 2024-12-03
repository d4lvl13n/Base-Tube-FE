import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscribeToChannel, unsubscribeFromChannel } from '../api/channel';
import type { Channel, ChannelResponse } from '../types/channel';

export const useChannelSubscription = () => {
  const queryClient = useQueryClient();

  const updateChannelCache = (channel: Channel, isSubscribed: boolean) => {
    // Update by ID
    queryClient.setQueryData(['channel', channel.id], (oldData: Channel | undefined) => ({
      ...oldData,
      ...channel,
      isSubscribed
    }));

    // Update by handle
    queryClient.setQueryData(['channel', channel.handle], (oldData: Channel | undefined) => ({
      ...oldData,
      ...channel,
      isSubscribed
    }));
  };

  const subscribe = useMutation<ChannelResponse, Error, number>({
    mutationFn: subscribeToChannel,
    onSuccess: (data) => {
      updateChannelCache(data.channel, true);
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['subscribedChannels'] });
      queryClient.invalidateQueries({ queryKey: ['socialMetrics'] });
    }
  });

  const unsubscribe = useMutation<ChannelResponse, Error, number>({
    mutationFn: unsubscribeFromChannel,
    onSuccess: (data) => {
      updateChannelCache(data.channel, false);
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['subscribedChannels'] });
      queryClient.invalidateQueries({ queryKey: ['socialMetrics'] });
    }
  });

  return {
    subscribe,
    unsubscribe,
    isLoading: subscribe.isPending || unsubscribe.isPending,
    isError: subscribe.isError || unsubscribe.isError,
    error: subscribe.error || unsubscribe.error
  };
};
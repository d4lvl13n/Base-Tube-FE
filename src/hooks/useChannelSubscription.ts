import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscribeToChannel, unsubscribeFromChannel } from '../api/channel';
import type { Channel, ChannelResponse } from '../types/channel';

export const useChannelSubscription = () => {
  const queryClient = useQueryClient();

  const subscribe = useMutation<ChannelResponse, Error, string>({
    mutationFn: subscribeToChannel,
    onSuccess: (data) => {
      const channel = data.channel;
      queryClient.setQueryData(['channel', channel.id], (oldData: Channel | undefined) => {
  if (!oldData) return channel; // If no old data, use the new channel data
  return {
    ...oldData,
    ...channel, // Merge new channel data
    isSubscribed: true // Ensure isSubscribed is set correctly
  };
});
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['subscribedChannels'] });
      queryClient.invalidateQueries({ queryKey: ['socialMetrics'] });
    }
  });

  const unsubscribe = useMutation<ChannelResponse, Error, string>({
    mutationFn: unsubscribeFromChannel,
    onSuccess: (data) => {
      const channel = data.channel;
      queryClient.setQueryData(['channel', channel.id], (oldData: Channel | undefined) => {
  if (!oldData) return channel;
  return {
    ...oldData,
    ...channel,
    isSubscribed: false
  };
});
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscribeToChannel, unsubscribeFromChannel } from '../api/channel';
import type { Channel, ChannelResponse } from '../types/channel';

export const useChannelSubscription = () => {
  const queryClient = useQueryClient();

  const subscribe = useMutation<ChannelResponse, Error, string>({
    mutationFn: subscribeToChannel,
    onSuccess: (data) => {
      const channel = data.channel as Channel;
      queryClient.setQueryData(['channel', channel.id], channel);
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['subscribedChannels'] });
      queryClient.invalidateQueries({ queryKey: ['socialMetrics'] });
    }
  });

  const unsubscribe = useMutation<ChannelResponse, Error, string>({
    mutationFn: unsubscribeFromChannel,
    onSuccess: (data) => {
      const channel = data.channel as Channel;
      queryClient.setQueryData(['channel', channel.id], channel);
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
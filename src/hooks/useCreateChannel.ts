import { useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createChannel,
  ChannelApiError,
  getChannelFromWriteResponse,
} from '../api/channel';
import type { Channel } from '../types/channel';
import { getChannelErrorMessage } from '../utils/channelErrorMessages';

export interface CreateChannelFieldError {
  field: 'handle' | 'name' | 'channel_image' | 'submit';
  message: string;
}

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef<string | null>(null);

  const getIdempotencyKey = useCallback(() => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `create-${Date.now()}`;
    }
    return idempotencyKeyRef.current;
  }, []);

  const resetIdempotencyKey = useCallback(() => {
    idempotencyKeyRef.current = null;
  }, []);

  const mutation = useMutation<Channel, Error, FormData>({
    mutationFn: async (formData) => {
      const response = await createChannel(formData, {
        idempotencyKey: getIdempotencyKey(),
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to create channel');
      }
      return getChannelFromWriteResponse(response);
    },
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['myChannels'] });
      if (channel.id) {
        queryClient.setQueryData(['channel', channel.id], channel);
      }
      if (channel.handle) {
        queryClient.setQueryData(['channel', channel.handle], channel);
      }
    },
  });

  const getFieldError = useCallback((): CreateChannelFieldError | null => {
    const err = mutation.error;
    if (!err) return null;
    if (err instanceof ChannelApiError) {
      return {
        field: err.field ?? 'submit',
        message: err.message,
      };
    }
    const parsed = getChannelErrorMessage(err);
    return { field: parsed.field ?? 'submit', message: parsed.message };
  }, [mutation.error]);

  return {
    createChannel: mutation.mutateAsync,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    createdChannel: mutation.data,
    error: mutation.error,
    fieldError: getFieldError(),
    resetIdempotencyKey,
    reset: mutation.reset,
  };
};

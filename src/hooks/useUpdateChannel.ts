import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateChannel,
  createChannelFormData,
  ChannelApiError,
} from '../api/channel';
import type { Channel } from '../types/channel';
import type { ChannelUpdateData } from '../api/channel';
import { stripHandleSuffix } from '../utils/handleUtils';
import { getChannelErrorMessage } from '../utils/channelErrorMessages';

export interface UpdateChannelInput {
  channelId: string;
  data: ChannelUpdateData;
  /** Original handle from server — used to omit handle from PUT when unchanged */
  originalHandle: string;
}

export interface UpdateChannelFieldError {
  field: 'handle' | 'name' | 'channel_image' | 'submit';
  message: string;
}

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Channel, Error, UpdateChannelInput>({
    mutationFn: async ({ channelId, data, originalHandle }) => {
      const trimmedHandle = data.handle ? stripHandleSuffix(data.handle) : undefined;
      const handleChanged =
        trimmedHandle !== undefined &&
        trimmedHandle !== stripHandleSuffix(originalHandle);

      const payload: ChannelUpdateData = { ...data };
      if (!handleChanged) {
        delete payload.handle;
      } else if (trimmedHandle) {
        payload.handle = trimmedHandle;
      }

      const formData = createChannelFormData(payload, {
        includeHandle: handleChanged,
      });
      const response = await updateChannel(channelId, formData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update channel');
      }
      return response.data;
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

  const getFieldError = useCallback((): UpdateChannelFieldError | null => {
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
    updateChannel: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    updatedChannel: mutation.data,
    error: mutation.error,
    fieldError: getFieldError(),
    reset: mutation.reset,
  };
};

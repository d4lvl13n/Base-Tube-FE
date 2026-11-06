import { queryOptions } from '@tanstack/react-query';
import { getVideoById } from '../api/video';
import { getChannelByHandle, getChannelById } from '../api/channel';
import { queryKeys } from '../utils/queryKeys';

export const videoQueryOptions = (id: string) => queryOptions({
  queryKey: queryKeys.video.byId(id),
  queryFn: ({ signal }) => getVideoById(id, signal),
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  retry: 1,
});

export const channelQueryOptions = (identifier: number | string) => queryOptions({
  queryKey: ['channel', identifier],
  queryFn: async () => {
    if (typeof identifier === 'string' && isNaN(Number(identifier))) return getChannelByHandle(identifier);
    return (await getChannelById(String(identifier))).channel;
  },
  staleTime: 5 * 60_000,
  gcTime: 10 * 60_000,
  retry: 2,
});

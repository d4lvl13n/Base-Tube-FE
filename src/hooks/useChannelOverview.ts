import { useMemo } from 'react';
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { getChannelOverview, getChannelVideos, type ChannelVideoQuery } from '../api/channel';
import type { Channel, ChannelOverview, ChannelVideosResponse } from '../types/channel';

export type ChannelVideoSort = NonNullable<ChannelVideoQuery['sort']>;

interface OverviewPage extends Omit<ChannelOverview, 'channel'> { channel?: Channel; }
interface PageRequest { page: number; channelId?: number; limit: number; }
const boundedLimit = (value: number) => Number.isFinite(value) ? Math.min(24, Math.max(1, Math.trunc(value))) : 12;

export function channelOverviewOptions(identifier: string | number, requestedLimit = 12, sort: ChannelVideoSort = 'newest') {
  const limit = boundedLimit(requestedLimit);
  return infiniteQueryOptions({
    queryKey: ['channel-overview', String(identifier), limit, sort],
    initialPageParam: { page: 1, limit } as PageRequest,
    queryFn: async ({ pageParam, signal }): Promise<OverviewPage> => {
      if (pageParam.page === 1) {
        const first = await getChannelOverview(identifier, limit, signal);
        if (sort === 'newest') return first;
        const sorted = await getChannelVideos(first.channel.id, 1, { limit, sort }, signal);
        return { ...first, videos: sorted.data, pagination: sorted.pagination };
      }
      if (!pageParam.channelId) throw new Error('Missing channel for next page');
      const response: ChannelVideosResponse = await getChannelVideos(pageParam.channelId, pageParam.page, { limit: pageParam.limit, ...(sort === 'newest' ? {} : { sort }) }, signal);
      return { videos: response.data, pagination: response.pagination };
    },
    getNextPageParam: (lastPage, pages): PageRequest | undefined => {
      const channelId = pages[0]?.channel?.id;
      if (!channelId || lastPage.pagination.page >= lastPage.pagination.totalPages) return undefined;
      return { page: lastPage.pagination.page + 1, channelId, limit: lastPage.pagination.limit };
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useChannelOverview(identifier?: string, limit = 12, sort: ChannelVideoSort = 'newest') {
  const query = useInfiniteQuery({ ...channelOverviewOptions(identifier ?? '', limit, sort), enabled: Boolean(identifier) });
  const channel = query.data?.pages[0]?.channel;
  const videos = useMemo(() => query.data?.pages.flatMap(page => page.videos) ?? [], [query.data]);
  return { ...query, channel, videos };
}

export function updateChannelOverviewCache(client: QueryClient, channel: Channel, isSubscribed: boolean) {
  client.setQueriesData<InfiniteData<OverviewPage>>({ queryKey: ['channel-overview'] }, previous => {
    if (!previous || previous.pages[0]?.channel?.id !== channel.id) return previous;
    return { ...previous, pages: previous.pages.map((page, index) => index === 0 ? { ...page, channel: { ...page.channel, ...channel, isSubscribed } } : page) };
  });
  void client.invalidateQueries({
    queryKey: ['channel-overview'],
    predicate: query => (query.state.data as InfiniteData<OverviewPage> | undefined)?.pages[0]?.channel?.id === channel.id,
    refetchType: 'none',
  });
}

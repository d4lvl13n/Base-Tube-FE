import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHomeData } from '../useHomeData';
import { channelOverviewOptions, useChannelOverview } from '../useChannelOverview';
import { useChannelSubscription } from '../useChannelSubscription';
import { videoQueryOptions } from '../../queries/publicContent';
import { getFeaturedVideos, getRecommendedVideos, getVideoById } from '../../api/video';
import { getPopularChannels, getChannelOverview, getChannelVideos, subscribeToChannel } from '../../api/channel';

jest.mock('../../api/video', () => ({ getFeaturedVideos: jest.fn(), getRecommendedVideos: jest.fn(), getVideoById: jest.fn() }));
jest.mock('../../api/channel', () => ({ getPopularChannels: jest.fn(), getChannelOverview: jest.fn(), getChannelVideos: jest.fn(), subscribeToChannel: jest.fn(), unsubscribeFromChannel: jest.fn() }));

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}
const channel = { id: 7, name: 'Creator', handle: 'creator.base', isSubscribed: false, subscribers_count: 2 };
const overview = { channel, videos: [{ id: 1, title: 'First' }], pagination: { total: 2, page: 1, limit: 1, totalPages: 2 } };

beforeEach(() => jest.clearAllMocks());

it('exposes ready home videos while recommendations and channels are pending, then reuses them on return', async () => {
  const featured = deferred<any[]>();
  const recommended = deferred<any>();
  const channels = deferred<any[]>();
  (getFeaturedVideos as jest.Mock).mockReturnValue(featured.promise);
  (getRecommendedVideos as jest.Mock).mockReturnValue(recommended.promise);
  (getPopularChannels as jest.Mock).mockReturnValue(channels.promise);
  const { client, wrapper } = setup();
  const mounted = renderHook(() => useHomeData(), { wrapper });
  await act(async () => { featured.resolve([{ id: 1, title: 'Visible immediately' }]); });
  await waitFor(() => expect(mounted.result.current.featured.data?.[0].title).toBe('Visible immediately'));
  expect(mounted.result.current.recommended.isLoading).toBe(true);
  expect(mounted.result.current.channels.isLoading).toBe(true);
  mounted.unmount();
  const returned = renderHook(() => useHomeData(), { wrapper });
  expect(returned.result.current.featured.data?.[0].title).toBe('Visible immediately');
  expect(getFeaturedVideos).toHaveBeenCalledTimes(1);
  returned.unmount(); client.clear();
});

it('keeps successful sections when a secondary home query fails', async () => {
  (getFeaturedVideos as jest.Mock).mockResolvedValue([{ id: 1, title: 'Still visible' }]);
  (getRecommendedVideos as jest.Mock).mockRejectedValue(new Error('unavailable'));
  (getPopularChannels as jest.Mock).mockResolvedValue([]);
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => useHomeData(), { wrapper });
  await waitFor(() => expect(result.current.recommended.isError).toBe(true));
  expect(result.current.featured.data?.[0].title).toBe('Still visible');
  unmount(); client.clear();
});

it('uses one overview request for page one, then the existing paginated endpoint with the same limit', async () => {
  (getChannelOverview as jest.Mock).mockResolvedValue(overview);
  (getChannelVideos as jest.Mock).mockResolvedValue({ success: true, data: [{ id: 2, title: 'Second' }], pagination: { total: 2, page: 2, limit: 1, totalPages: 2 } });
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(() => useChannelOverview('creator.base', 1), { wrapper });
  await waitFor(() => expect(result.current.channel?.id).toBe(7));
  expect(result.current.videos.map(video => video.id)).toEqual([1]);
  expect(getChannelOverview).toHaveBeenCalledTimes(1);
  expect(getChannelVideos).not.toHaveBeenCalled();
  await act(async () => { await result.current.fetchNextPage(); });
  expect(getChannelVideos).toHaveBeenCalledWith(7, 2, { limit: 1 }, expect.any(AbortSignal));
  await waitFor(() => expect(result.current.videos.map(video => video.id)).toEqual([1, 2]));
  expect(result.current.hasNextPage).toBe(false);
  unmount(); client.clear();
});

it('consumes prefetched overview/video data without a duplicate read', async () => {
  (getChannelOverview as jest.Mock).mockResolvedValue(overview);
  (getVideoById as jest.Mock).mockResolvedValue({ id: 1, title: 'Cached video' });
  const { client, wrapper } = setup();
  await client.prefetchInfiniteQuery(channelOverviewOptions('creator.base', 1));
  await client.prefetchQuery(videoQueryOptions('1'));
  expect(await client.fetchQuery(videoQueryOptions('1'))).toMatchObject({ title: 'Cached video' });
  const { result, unmount } = renderHook(() => useChannelOverview('creator.base', 1), { wrapper });
  expect(result.current.videos.map(video => video.id)).toEqual([1]);
  expect(getChannelOverview).toHaveBeenCalledTimes(1);
  expect(getVideoById).toHaveBeenCalledTimes(1);
  unmount(); client.clear();
});

it('updates all loaded overview aliases after subscribing without losing loaded video pages', async () => {
  (getChannelOverview as jest.Mock).mockResolvedValue(overview);
  (subscribeToChannel as jest.Mock).mockResolvedValue({ success: true, channel: { ...channel, isSubscribed: true, subscribers_count: 3 } });
  const { client, wrapper } = setup();
  await client.prefetchInfiniteQuery(channelOverviewOptions('creator.base', 1));
  await client.prefetchInfiniteQuery(channelOverviewOptions('7', 1));
  const { result, unmount } = renderHook(() => useChannelSubscription(), { wrapper });
  await act(async () => { await result.current.subscribe.mutateAsync(7); });
  for (const identifier of ['7', 'creator.base']) {
    const data = client.getQueryData<any>(channelOverviewOptions(identifier, 1).queryKey);
    expect(data.pages[0].channel).toMatchObject({ isSubscribed: true, subscribers_count: 3 });
    expect(data.pages[0].videos).toEqual(overview.videos);
    expect(client.getQueryState(channelOverviewOptions(identifier, 1).queryKey)?.isInvalidated).toBe(true);
  }
  unmount(); client.clear();
});

it('does not let a late channel response replace the next route', async () => {
  const first = deferred<any>();
  (getChannelOverview as jest.Mock).mockImplementation((id: string) => id === 'first' ? first.promise : Promise.resolve({ ...overview, channel: { ...channel, id: 8, name: 'Next creator' } }));
  const { client, wrapper } = setup();
  const { result, rerender, unmount } = renderHook(({ id }) => useChannelOverview(id), { wrapper, initialProps: { id: 'first' } });
  const firstSignal = (getChannelOverview as jest.Mock).mock.calls[0][2] as AbortSignal;
  rerender({ id: 'second' });
  await waitFor(() => expect(result.current.channel?.id).toBe(8));
  expect(firstSignal.aborted).toBe(true);
  await act(async () => first.resolve(overview));
  expect(result.current.channel?.id).toBe(8);
  unmount(); client.clear();
});

import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContentPrefetch } from '../useContentPrefetch';
import { videoQueryOptions } from '../../queries/publicContent';
import { channelOverviewOptions } from '../useChannelOverview';
import { getVideoById } from '../../api/video';
import { getChannelOverview } from '../../api/channel';
import { loadVideoPage, loadChannelPage } from '../../routes/publicRouteLoaders';

jest.mock('../../api/video', () => ({ getVideoById: jest.fn() }));
jest.mock('../../api/channel', () => ({ getChannelOverview: jest.fn() }));
jest.mock('../../routes/publicRouteLoaders', () => ({
  loadVideoPage: jest.fn().mockResolvedValue({}),
  loadChannelPage: jest.fn().mockResolvedValue({}),
}));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { ...renderHook(useContentPrefetch, { wrapper }), client };
}
function anchor(path: string) {
  const link = document.createElement('a');
  link.href = path;
  return link;
}
function pointer(target: HTMLElement, movementX = 1) {
  return { target, pointerType: 'mouse' as const, movementX, movementY: 0 };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (getVideoById as jest.Mock).mockResolvedValue({ id: 1 });
  (getChannelOverview as jest.Mock).mockResolvedValue({
    channel: { id: 2, handle: 'creator' }, videos: [],
    pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
  });
});
afterEach(() => { jest.useRealTimers(); });

it('waits for deliberate pointer movement and cancels short hovers or scrolls', async () => {
  const { result, client } = setup();
  const link = anchor('/video/1');
  act(() => {
    result.current.onPointerMove(pointer(link, 0));
    jest.advanceTimersByTime(200);
  });
  expect(getVideoById).not.toHaveBeenCalled();
  act(() => {
    result.current.onPointerMove(pointer(link));
    jest.advanceTimersByTime(99);
  });
  expect(getVideoById).not.toHaveBeenCalled();
  act(() => {
    result.current.onScrollCapture();
    jest.advanceTimersByTime(100);
  });
  expect(getVideoById).not.toHaveBeenCalled();
  await act(async () => {
    result.current.onPointerMove(pointer(link));
    jest.advanceTimersByTime(100);
  });
  expect(getVideoById).toHaveBeenCalledTimes(1);
  expect(loadVideoPage).toHaveBeenCalledTimes(1);
  await client.fetchQuery(videoQueryOptions('1'));
  expect(getVideoById).toHaveBeenCalledTimes(1);
});

it('loads route code and overview on keyboard focus and reuses the cache', async () => {
  const { result, client } = setup();
  const link = anchor('/channel/creator');
  await act(async () => {
    result.current.onFocus({ target: link });
    result.current.onPointerDown(pointer(link));
  });
  expect(getChannelOverview).toHaveBeenCalledTimes(1);
  expect(loadChannelPage).toHaveBeenCalledTimes(1);
  await client.fetchInfiniteQuery(channelOverviewOptions('creator'));
  expect(getChannelOverview).toHaveBeenCalledTimes(1);
});

it('does not prefetch paid, playback-token or mutation routes', () => {
  const { result } = setup();
  for (const path of ['/studio/projects/new', '/passes/1/buy', '/api/v1/video/1/play-token']) {
    act(() => result.current.onPointerDown(pointer(anchor(path))));
  }
  expect(getVideoById).not.toHaveBeenCalled();
  expect(getChannelOverview).not.toHaveBeenCalled();
  expect(loadVideoPage).not.toHaveBeenCalled();
});

it('ignores speculative errors and allows a normal navigation to retry', async () => {
  (getVideoById as jest.Mock).mockRejectedValueOnce(new Error('offline'));
  const { result, client } = setup();
  await act(async () => result.current.onPointerDown(pointer(anchor('/video/1'))));
  expect(client.getQueryState(videoQueryOptions('1').queryKey)?.status).toBe('error');
  await expect(client.fetchQuery({ ...videoQueryOptions('1'), retry: false })).resolves.toEqual({ id: 1 });
  expect(getVideoById).toHaveBeenCalledTimes(2);
});

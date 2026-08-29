import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  invalidateChannelAnalytics,
  useChannelInsights,
  useCreatorAnalytics
} from '../useAnalyticsData';
import { useDetailedVideoPerformance } from '../useDetailedVideoPerformance';
import { useChannelData } from '../useChannelData';
import { invalidationHelpers, queryKeys } from '../../utils/queryKeys';

// Each mock resolves with a shape the hook can consume, and counts its calls so
// we can assert exactly which queries a period change re-issues.
const mockApi = {
  getSocialMetrics: jest.fn(),
  getGrowthMetrics: jest.fn(),
  getChannelWatchHours: jest.fn(),
  getChannelViewMetrics: jest.fn(),
  getChannelWatchPatterns: jest.fn(),
  getChannelDemographics: jest.fn(),
  getEngagementTrends: jest.fn(),
  getTopLikedContent: jest.fn(),
  getTopSharedContent: jest.fn(),
  getTopComments: jest.fn(),
  getChannelInsights: jest.fn(),
  getChannelVideosPerformance: jest.fn()
};

// Non-analytics: the channel detail record. invalidateChannelAnalytics must
// leave it alone.
const mockGetChannelById = jest.fn();

jest.mock('../../api/analytics', () => ({
  getSocialMetrics: (...a: unknown[]) => mockApi.getSocialMetrics(...a),
  getGrowthMetrics: (...a: unknown[]) => mockApi.getGrowthMetrics(...a),
  getChannelWatchHours: (...a: unknown[]) => mockApi.getChannelWatchHours(...a),
  getChannelViewMetrics: (...a: unknown[]) => mockApi.getChannelViewMetrics(...a),
  getChannelWatchPatterns: (...a: unknown[]) => mockApi.getChannelWatchPatterns(...a),
  getChannelDemographics: (...a: unknown[]) => mockApi.getChannelDemographics(...a),
  getEngagementTrends: (...a: unknown[]) => mockApi.getEngagementTrends(...a),
  getTopLikedContent: (...a: unknown[]) => mockApi.getTopLikedContent(...a),
  getTopSharedContent: (...a: unknown[]) => mockApi.getTopSharedContent(...a),
  getTopComments: (...a: unknown[]) => mockApi.getTopComments(...a),
  getChannelInsights: (...a: unknown[]) => mockApi.getChannelInsights(...a),
  getChannelVideosPerformance: (...a: unknown[]) => mockApi.getChannelVideosPerformance(...a),
  isDetailedViewMetrics: (m: Record<string, unknown>) => 'viewsByPeriod' in m
}));

jest.mock('../../api/channel', () => ({
  getChannelById: (...a: unknown[]) => mockGetChannelById(...a),
  getChannelByHandle: jest.fn()
}));

/** Queries whose key does NOT contain the period — they must not refetch. */
const PERIOD_INDEPENDENT = [
  'getSocialMetrics',
  'getTopLikedContent',
  'getTopSharedContent'
] as const;

/** Queries whose key contains the period — they must fetch the new key. */
const PERIOD_DEPENDENT = [
  'getGrowthMetrics',
  'getEngagementTrends',
  'getTopComments',
  'getChannelWatchPatterns',
  'getChannelDemographics'
] as const;

const callCounts = () =>
  Object.fromEntries(
    Object.entries(mockApi).map(([name, fn]) => [name, fn.mock.calls.length])
  ) as Record<keyof typeof mockApi, number>;

const detailedMetrics = {
  totalViews: 10,
  uniqueViewers: 2,
  completedViews: 1,
  averageWatchDuration: 5,
  viewsByPeriod: { last24h: 1, last7d: 3, last30d: 10 }
};

const resetApi = () => {
  mockApi.getSocialMetrics.mockReset().mockResolvedValue({
    interactions: {
      commentsReceived: 0,
      responseRate: 0,
      averageResponseTime: 0,
      recentEngagement: { total: 0, likes: 0, comments: 0 }
    },
    community: { subscriberCount: 0, recentSubscribers: 0 }
  });
  mockApi.getGrowthMetrics.mockReset().mockResolvedValue({
    metrics: {
      subscribers: { total: 0, trend: 0, data: [] },
      views: { total: 0, trend: 0, data: [] },
      engagement: { total: 0, trend: 0, data: [] }
    }
  });
  mockApi.getChannelWatchHours.mockReset().mockResolvedValue({
    channelId: '1',
    totalWatchHours: 1,
    period: '7d',
    formattedHours: '1 hours'
  });
  mockApi.getChannelViewMetrics.mockReset().mockResolvedValue(detailedMetrics);
  mockApi.getChannelWatchPatterns.mockReset().mockResolvedValue({
    hourlyPatterns: [],
    weekdayPatterns: [],
    durationStats: { averageWatchDuration: 0, maxWatchDuration: 0, totalViews: 0, uniqueViewers: 0 },
    retentionByDuration: [],
    topRetainedVideos: []
  });
  mockApi.getChannelDemographics.mockReset().mockResolvedValue({ geoDistribution: [], deviceUsage: [] });
  mockApi.getEngagementTrends.mockReset().mockResolvedValue({
    likeGrowth: [],
    commentGrowth: [],
    shareGrowth: []
  });
  mockApi.getTopLikedContent.mockReset().mockResolvedValue([]);
  mockApi.getTopSharedContent.mockReset().mockResolvedValue([]);
  mockApi.getTopComments.mockReset().mockResolvedValue([]);
  mockApi.getChannelInsights.mockReset().mockResolvedValue({
    data: { schemaVersion: 2, facts: [], observations: [], hypotheses: [], experiments: [] },
    meta: { cached: false, refreshRemaining: 3 }
  });
  mockApi.getChannelVideosPerformance.mockReset().mockResolvedValue({
    videos: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
  });
  mockGetChannelById.mockReset().mockResolvedValue({ channel: { id: 1, subscribers_count: 3 } });
};

const totalCalls = () =>
  Object.values(mockApi).reduce((sum, fn) => sum + fn.mock.calls.length, 0);

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

beforeEach(resetApi);

describe('useCreatorAnalytics — period changes', () => {
  it('refetches only the period-bearing queries when the selector changes', async () => {
    const { wrapper } = makeWrapper();
    const { result, rerender } = renderHook<
      ReturnType<typeof useCreatorAnalytics>,
      { period: '7d' | '30d' | 'all' }
    >(({ period }) => useCreatorAnalytics(period, '1'), {
      wrapper,
      initialProps: { period: '7d' }
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = callCounts();
    const callsAfterMount = totalCalls();
    expect(callsAfterMount).toBeGreaterThan(0);

    rerender({ period: '30d' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Nothing whose cache key is period-free may be re-requested. Awaiting a
    // broad ['channel', id] invalidation before switching (what the tabs used
    // to do) refetched the old period's queries as well.
    for (const name of PERIOD_INDEPENDENT) {
      expect(mockApi[name]).toHaveBeenCalledTimes(1);
    }
    for (const name of PERIOD_DEPENDENT) {
      expect(mockApi[name]).toHaveBeenCalledTimes(2);
    }

    // Exactly six requests for one click on the selector: the 5 period-bearing
    // queries plus the period watch-hours query (the all-time one keeps its
    // key). detailedViewMetrics is NOT among them — one response carries
    // last24h/last7d/last30d, so it is period-invariant and its key no longer
    // contains the period.
    const after = callCounts();
    const delta = Object.fromEntries(
      Object.keys(after)
        .map((k) => [k, after[k as keyof typeof after] - before[k as keyof typeof before]])
        .filter(([, n]) => (n as number) > 0)
    );
    expect(delta).toEqual({
      getGrowthMetrics: 1,
      getEngagementTrends: 1,
      getTopComments: 1,
      getChannelWatchPatterns: 1,
      getChannelDemographics: 1,
      getChannelWatchHours: 1
    });
    expect(totalCalls() - callsAfterMount).toBe(6);
  });

  it('does not refetch the period-invariant view metrics', async () => {
    const { wrapper } = makeWrapper();
    const { result, rerender } = renderHook<
      ReturnType<typeof useCreatorAnalytics>,
      { period: '7d' | '30d' | 'all' }
    >(({ period }) => useCreatorAnalytics(period, '1'), {
      wrapper,
      initialProps: { period: '7d' }
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = mockApi.getChannelViewMetrics.mock.calls.length;

    rerender({ period: '30d' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockApi.getChannelViewMetrics).toHaveBeenCalledTimes(before);
    // and the numbers the tab reads out of it are still there
    expect(result.current.detailedViewMetrics?.viewsByPeriod?.last30d).toBe(10);
  });

  it('does not re-request anything when the period is set to its current value', async () => {
    const { wrapper } = makeWrapper();
    const { result, rerender } = renderHook<
      ReturnType<typeof useCreatorAnalytics>,
      { period: '7d' | '30d' | 'all' }
    >(({ period }) => useCreatorAnalytics(period, '1'), {
      wrapper,
      initialProps: { period: '7d' }
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = totalCalls();

    rerender({ period: '7d' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(totalCalls()).toBe(before);
  });
});

describe('invalidateChannelAnalytics — the mutation path', () => {
  it('refetches the channel analytics after a video mutation', async () => {
    const { queryClient, wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreatorAnalytics('7d', '1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = totalCalls();

    await act(async () => {
      await invalidateChannelAnalytics(queryClient, '1');
    });

    await waitFor(() => expect(totalCalls()).toBeGreaterThan(before));
    expect(mockApi.getSocialMetrics.mock.calls.length).toBeGreaterThan(1);
  });

  it('is a no-op without a channel id', async () => {
    const { queryClient } = makeWrapper();
    await expect(invalidateChannelAnalytics(queryClient, undefined)).resolves.toBeUndefined();
  });
});

describe('useCreatorAnalytics — failures surface as errors, not zeros', () => {
  it('exposes a rejected query on `errors` and leaves its data undefined', async () => {
    mockApi.getGrowthMetrics.mockReset().mockRejectedValue(new Error('boom'));
    mockApi.getSocialMetrics.mockClear();

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreatorAnalytics('7d', '1'), { wrapper });

    // ANALYTICS_QUERY_DEFAULTS retries twice with backoff, so give it room.
    await waitFor(() => expect(result.current.errors.growthMetrics).toBeTruthy(), {
      timeout: 10000
    });

    // The failed query must not hand the UI a zero-filled structure.
    expect(result.current.growthMetrics).toBeUndefined();
    // ...and it must not take the healthy queries down with it.
    expect(result.current.errors.socialMetrics).toBeNull();
  });
});

describe('invalidateChannelAnalytics — namespace boundaries', () => {
  it('reaches the Video Performance table', async () => {
    const { queryClient, wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useDetailedVideoPerformance('1', { initialLimit: 10 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockApi.getChannelVideosPerformance).toHaveBeenCalledTimes(1);

    // It used to live on its own ['channelVideoPerformance', ...] key with a
    // 5 minute staleTime, so a video mutation left it serving stale rows the
    // longest of anything on the dashboards.
    await act(async () => {
      await invalidateChannelAnalytics(queryClient, '1');
    });

    await waitFor(() =>
      expect(mockApi.getChannelVideosPerformance.mock.calls.length).toBeGreaterThan(1)
    );
  });

  it('leaves the non-analytics channel-detail query alone', async () => {
    const { queryClient, wrapper } = makeWrapper();
    const { result } = renderHook(
      () => ({
        analytics: useCreatorAnalytics('7d', '1'),
        channel: useChannelData(1)
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.analytics.isLoading).toBe(false));
    await waitFor(() => expect(mockGetChannelById).toHaveBeenCalledTimes(1));
    const analyticsCallsBefore = totalCalls();

    await act(async () => {
      await invalidateChannelAnalytics(queryClient, '1');
    });

    await waitFor(() => expect(totalCalls()).toBeGreaterThan(analyticsCallsBefore));
    // useChannelData sits on ['channel', id]; the analytics namespace must not
    // sweep it up as collateral.
    expect(mockGetChannelById).toHaveBeenCalledTimes(1);
  });
});

describe('queryKeys.analytics is the single source of truth', () => {
  /** Every analytics key currently registered in the cache. */
  const analyticsKeys = (queryClient: QueryClient) =>
    queryClient
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey as unknown[])
      .filter((key) => key[0] === 'analytics');

  const startsWith = (key: unknown[], prefix: readonly unknown[]) =>
    prefix.every((segment, i) => key[i] === segment);

  it('produces the prefix the hooks actually register', async () => {
    const { queryClient, wrapper } = makeWrapper();
    const { result } = renderHook(
      () => ({
        creator: useCreatorAnalytics('7d', '1'),
        videos: useDetailedVideoPerformance('1', { initialLimit: 10 }),
        insights: useChannelInsights('1', '7d')
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.creator.isLoading).toBe(false));
    await waitFor(() => expect(analyticsKeys(queryClient).length).toBeGreaterThan(10));

    const prefix = queryKeys.analytics.channel('1');
    expect(prefix).toEqual(['analytics', '1']);

    // Every registered analytics key must sit under that prefix — including
    // the Video Performance table and the AI insights query.
    for (const key of analyticsKeys(queryClient)) {
      expect(startsWith(key, prefix)).toBe(true);
    }
    const metrics = analyticsKeys(queryClient).map((key) => key[2]);
    expect(metrics).toEqual(expect.arrayContaining(['videoPerformance', 'insights', 'socialMetrics']));

    // And the factory reproduces a real key exactly.
    expect(queryKeys.analytics.channelMetric('1', 'growthMetrics', '7d')).toEqual([
      'analytics',
      '1',
      'growthMetrics',
      '7d'
    ]);
    expect(
      analyticsKeys(queryClient).some((key) =>
        JSON.stringify(key) ===
        JSON.stringify(queryKeys.analytics.channelMetric('1', 'growthMetrics', '7d'))
      )
    ).toBe(true);
  });

  it('invalidationHelpers.invalidateAnalytics actually matches those keys', async () => {
    const { queryClient, wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreatorAnalytics('7d', '1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = totalCalls();

    // This used to build ['analytics', 'channel', '1', ''] — a key nothing has
    // ever registered — so it silently invalidated nothing.
    await act(async () => {
      invalidationHelpers.invalidateAnalytics(queryClient, 'channel', '1');
    });

    await waitFor(() => expect(totalCalls()).toBeGreaterThan(before));
  });

  it('does not put channel analytics under the channel-record namespace', () => {
    // queryKeys.channel.analytics() used to emit ['channel', 'analytics', id],
    // which matched nothing and sat in the namespace useChannelData owns.
    expect('analytics' in queryKeys.channel).toBe(false);
    expect(queryKeys.channel.byId('1')).toEqual(['channel', '1']);
    expect(queryKeys.analytics.channel('1')[0]).not.toBe('channel');
  });
});

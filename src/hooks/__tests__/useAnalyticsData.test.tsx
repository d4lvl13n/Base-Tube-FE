import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCreatorAnalytics, invalidateChannelAnalytics } from '../useAnalyticsData';

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
  getChannelAnalyticsInsights: jest.fn()
};

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
  getChannelAnalyticsInsights: (...a: unknown[]) => mockApi.getChannelAnalyticsInsights(...a),
  isDetailedViewMetrics: (m: Record<string, unknown>) => 'viewsByPeriod' in m
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
  mockApi.getChannelAnalyticsInsights.mockReset().mockResolvedValue({});
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

    // Exactly seven requests for one click on the selector:
    //   5 period-bearing queries
    // + detailedViewMetrics (period is in its key; the period-free basic
    //   viewMetrics query is NOT refetched, so getChannelViewMetrics goes 2 -> 3)
    // + the period watch-hours query (the all-time one keeps its key).
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
      getChannelViewMetrics: 1,
      getChannelWatchHours: 1
    });
    expect(totalCalls() - callsAfterMount).toBe(7);
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

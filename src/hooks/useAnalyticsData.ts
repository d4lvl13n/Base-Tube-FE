import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getSocialMetrics, 
  getGrowthMetrics, 
  getChannelWatchHours,
  getChannelViewMetrics,
  isDetailedViewMetrics,
  getChannelWatchPatterns,
  getChannelDemographics,
  getEngagementTrends,
  getTopLikedContent,
  getTopSharedContent,
  getTopComments,
  getChannelAnalyticsInsights
} from '../api/analytics';
import type { 
  SocialMetrics, 
  GrowthMetrics, 
  CreatorWatchHours,
  BasicViewMetrics,
  DetailedViewMetrics,
  ChannelWatchPatterns,
  ChannelDemographics,
  DemographicsPeriod,
  EngagementTrends,
  TopContentItem,
  TopSharedItem,
  TopComment,
  ChannelAnalyticsInsight
} from '../types/analytics';
import { useCallback, useEffect } from 'react';
import { queryKeys } from '../utils/queryKeys';

// A creator dashboard tab mounts ~12 queries at once. With staleTime: 0 and
// refetchOnWindowFocus: true every tab switch (and every alt-tab back to the
// browser) replayed all of them, which is what was tripping the analytics rate
// limiter — see docs/ANALYTICS_REVIEW_2026-08-29.md (finding 22).
const ANALYTICS_QUERY_DEFAULTS = {
  staleTime: 60_000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 2
} as const;

/**
 * Drop every cached analytics query for a channel.
 *
 * This is for MUTATIONS ONLY — publishing, editing, deleting or changing the
 * visibility of a video changes numbers the server already returned, and
 * nothing else will tell React Query about it.
 *
 * It is NOT for period changes. Every period-sensitive query carries the period
 * in its key, so selecting a new period fetches the new key on its own; forcing
 * a broad invalidation first also refetched the OLD period's queries, which is
 * where ~19 requests per selector change came from.
 *
 * Every analytics query lives under the ['analytics', channelId, ...] prefix —
 * including the Video Performance table, which used to sit on its own
 * ['channelVideoPerformance', ...] key and was therefore missed entirely (it
 * has a 5 minute staleTime, so it served pre-mutation rows the longest). The
 * namespace also keeps this helper off the non-analytics ['channel', id]
 * channel-detail query owned by useChannelData, which it used to blow away as
 * collateral.
 *
 * NOTE for the Videos Management screen: video create/update/delete there does
 * not currently invalidate analytics at all, so the dashboards keep serving
 * pre-mutation numbers for up to `staleTime`. That screen should call this
 * helper after a successful mutation.
 */
export const invalidateChannelAnalytics = async (
  queryClient: QueryClient,
  channelId?: string
): Promise<void> => {
  if (!channelId) return;
  await queryClient.invalidateQueries({
    queryKey: queryKeys.analytics.channel(channelId),
    exact: false,
    refetchType: 'active'
  });
};

// ===========================================
// ANALYTICS CONTEXT (SHARED)
// ===========================================

export const useAnalyticsContext = () => {
  const queryClient = useQueryClient();
  
  const prefetchCreatorAnalytics = async (period: '7d' | '30d' = '7d', channelId?: string) => {
    // Skip prefetching if no channelId is provided
    if (!channelId) return;

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.channelMetric(channelId, 'channelWatchPatterns', period),
        queryFn: () => getChannelWatchPatterns(channelId, period)
      }),
      queryClient.prefetchQuery({ 
        queryKey: queryKeys.analytics.channelMetric(channelId, 'socialMetrics'), 
        queryFn: () => getSocialMetrics(channelId) 
      }),
      queryClient.prefetchQuery({ 
        queryKey: queryKeys.analytics.channelMetric(channelId, 'growthMetrics', period), 
        queryFn: () => getGrowthMetrics(period, channelId) 
      }),
      queryClient.prefetchQuery({ 
        queryKey: queryKeys.analytics.channelMetric(channelId, 'watchHours', period), 
        queryFn: () => getChannelWatchHours(channelId, period)
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.channelMetric(channelId, 'detailedViewMetrics'),
        queryFn: () => getChannelViewMetrics(channelId, true)
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.channelMetric(channelId, 'demographics', mapPeriodToDemographics(period)),
        queryFn: () => getChannelDemographics(channelId, mapPeriodToDemographics(period))
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.channelMetric(channelId, 'engagementTrends', period),
        queryFn: () => getEngagementTrends(channelId, period)
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.channelMetric(channelId, 'topLikedContent'),
        queryFn: () => getTopLikedContent(channelId, 5)
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.channelMetric(channelId, 'topSharedContent'),
        queryFn: () => getTopSharedContent(channelId, 5)
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.channelMetric(channelId, 'topComments', period),
        queryFn: () => getTopComments(channelId, period, 5)
      })
    ]);
  };

  return { prefetchCreatorAnalytics };
};

// Period validation helper
const validatePeriod = (period: string): '7d' | '30d' | 'all' => {
  if (period === '30d') return '30d';
  if (period === 'all') return 'all';
  return '7d';
};

// Map API period to demographics period
const mapPeriodToDemographics = (period: '7d' | '30d' | 'all'): DemographicsPeriod => {
  if (period === '7d') return 'last7';
  if (period === '30d') return 'last30';
  return 'allTime';
};

// ===========================================
// CREATOR-FOCUSED ANALYTICS
// ===========================================

/**
 * Hook for all creator analytics data associated with a specific channel
 */
export const useCreatorAnalytics = (period: '7d' | '30d' | 'all' = '7d', channelId?: string) => {
  const queryClient = useQueryClient();
  const validPeriod = validatePeriod(period);
  const demographicsPeriod = mapPeriodToDemographics(validPeriod);
  
  // Mutation-only. Do not call this when the period selector changes — see
  // invalidateChannelAnalytics above.
  const invalidateAnalytics = useCallback(
    () => invalidateChannelAnalytics(queryClient, channelId),
    [queryClient, channelId]
  );

  // Basic view metrics - Channel-focused
  const viewMetrics = useQuery<BasicViewMetrics, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'viewMetrics'),
    queryFn: async () => {
      const result = await getChannelViewMetrics(channelId!, false);
      if (isDetailedViewMetrics(result)) {
        const { viewsByPeriod, ...basicMetrics } = result;
        return basicMetrics;
      }
      return result;
    },
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // Detailed view metrics - Channel-focused.
  // NOT period-keyed: one response carries last24h + last7d + last30d + the
  // all-time total, so the period selector picks a field out of a payload we
  // already hold. Keying it by period re-fetched the same bytes on every
  // selector change.
  const detailedViewMetrics = useQuery<DetailedViewMetrics, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'detailedViewMetrics'),
    queryFn: async () => {
      const result = await getChannelViewMetrics(channelId!, true);
      if (!isDetailedViewMetrics(result)) {
        throw new Error('Expected detailed metrics but received basic metrics');
      }
      return result;
    },
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // Channel watch patterns - Channel specific
  const channelWatchPatterns = useQuery<ChannelWatchPatterns, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'channelWatchPatterns', validPeriod),
    queryFn: () => getChannelWatchPatterns(channelId!, validPeriod),
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // Channel demographics - Channel specific
  const demographics = useQuery<ChannelDemographics, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'demographics', demographicsPeriod),
    queryFn: () => {
      console.log(`[Analytics] Fetching demographics for period ${demographicsPeriod}`);
      return getChannelDemographics(channelId!, demographicsPeriod);
    },
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // Social metrics - Channel-focused
  const socialMetrics = useQuery<SocialMetrics, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'socialMetrics'),
    queryFn: () => getSocialMetrics(channelId!),
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // Growth metrics - Channel-focused
  const growthMetrics = useQuery<GrowthMetrics, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'growthMetrics', validPeriod),
    queryFn: () => {
      // Determine the period to pass to the API
      // NOW: Pass 'all' directly if validPeriod is 'all'
      const apiPeriod = validPeriod;
      console.log(`[Analytics] Fetching growthMetrics for period ${apiPeriod}`);
      // Call the API with the determined period ('7d', '30d', or 'all')
      return getGrowthMetrics(apiPeriod, channelId!);
    },
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // Watch hours - Channel-focused with all-time and period data
  const allTimeWatchHours = useQuery<CreatorWatchHours, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'watchHours', 'all-time'),
    queryFn: () => {
      if (!channelId) {
        throw new Error('Channel ID is required for watch hours');
      }
      console.log('[Analytics] Fetching all-time watch hours');
      return getChannelWatchHours(channelId); // No period means all-time
    },
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  const periodWatchHours = useQuery<CreatorWatchHours, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'watchHours', validPeriod),
    queryFn: () => {
      if (!channelId) {
        throw new Error('Channel ID is required for watch hours');
      }
      console.log(`[Analytics] Fetching watch hours for period ${validPeriod}`);
      // Use specific period for 7d/30d, otherwise use all-time
      return validPeriod === 'all' 
        ? getChannelWatchHours(channelId) 
        : getChannelWatchHours(channelId, validPeriod);
    },
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // New engagement-related queries
  const engagementTrends = useQuery<EngagementTrends, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'engagementTrends', validPeriod),
    queryFn: () => {
      console.log(`[Analytics] Fetching engagementTrends for channelId ${channelId} with period ${validPeriod}`);
      return getEngagementTrends(channelId!, validPeriod);
    },
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  const topLikedContent = useQuery<TopContentItem[], Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'topLikedContent'),
    queryFn: () => getTopLikedContent(channelId!, 5),
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  const topSharedContent = useQuery<TopSharedItem[], Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'topSharedContent'),
    queryFn: () => getTopSharedContent(channelId!, 5),
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  const topComments = useQuery<TopComment[], Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'topComments', validPeriod),
    queryFn: () => {
      console.log(`[Analytics] Fetching topComments for period ${validPeriod}`);
      return getTopComments(channelId!, validPeriod, 5);
    },
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // The likeGrowthTrends / topLikedVideos queries used to live here. They fired
  // on EVERY analytics tab mount for the sole benefit of LikesAnalyticsTab,
  // which was never routed. Both are deleted; the API helpers and the routes
  // behind them are still available if a Likes tab is ever built.

  // Add debugging logs
  useEffect(() => {
    if (channelId) {
      console.log(`[Analytics] Period changed to ${validPeriod} for channelId ${channelId}`);
    }
  }, [validPeriod, channelId]);

  return {
    viewMetrics: viewMetrics.data,
    detailedViewMetrics: detailedViewMetrics.data,
    watchPatterns: channelWatchPatterns.data,
    channelWatchPatterns: channelWatchPatterns.data,
    demographics: demographics.data,
    socialMetrics: socialMetrics.data,
    growthMetrics: growthMetrics.data,
    creatorWatchHours: {
      total: allTimeWatchHours.data?.totalWatchHours ?? 0,
      formattedHours: allTimeWatchHours.data?.formattedHours ?? '0 hours',
      periodTotal: periodWatchHours.data?.totalWatchHours ?? 0,
      trend: periodWatchHours.data?.trend ?? 0
    },
    engagementTrends: engagementTrends.data,
    topLikedContent: topLikedContent.data,
    topSharedContent: topSharedContent.data,
    topComments: topComments.data,
    isLoading: viewMetrics.isLoading || 
               detailedViewMetrics.isLoading ||
               channelWatchPatterns.isLoading ||
               demographics.isLoading ||
               socialMetrics.isLoading || 
               growthMetrics.isLoading || 
               allTimeWatchHours.isLoading ||
               periodWatchHours.isLoading ||
               engagementTrends.isLoading ||
               topLikedContent.isLoading ||
               topSharedContent.isLoading ||
               topComments.isLoading,
    errors: {
      viewMetrics: viewMetrics.error, 
      detailedViewMetrics: detailedViewMetrics.error,
      channelWatchPatterns: channelWatchPatterns.error,
      demographics: demographics.error,
      socialMetrics: socialMetrics.error, 
      growthMetrics: growthMetrics.error, 
      allTimeWatchHours: allTimeWatchHours.error,
      periodWatchHours: periodWatchHours.error,
      engagementTrends: engagementTrends.error,
      topLikedContent: topLikedContent.error,
      topSharedContent: topSharedContent.error,
      topComments: topComments.error
    },
    invalidateAnalytics
  };
};

/**
 * Individual hook for channel watch hours only (creator-focused)
 */
export const useChannelWatchHours = (channelId: string, period: '7d' | '30d' = '7d') => {
  const query = useQuery<CreatorWatchHours, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'watchHours', period),
    queryFn: () => {
      if (!channelId) {
        throw new Error('Channel ID is required for watch hours');
      }
      return getChannelWatchHours(channelId, period);
    },
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  return {
    watchHours: query.data?.totalWatchHours ?? 0,
    formattedHours: query.data?.formattedHours ?? '0 hours',
    trend: query.data?.trend ?? 0,
    isLoading: query.isLoading,
    isError: query.isError
  };
};

// The viewer-facing useViewerAnalytics / useAnalyticsData hooks lived here.
// Their only consumer was AudienceEngagementTab, which was never routed, and
// the /api/v1/analytics/watch-patterns endpoint behind them has been deleted.

// Add a new hook for AI insights

/**
 * Hook for AI-generated analytics insights for a channel
 */
export const useAnalyticsInsights = (
  periods: ('7d' | '30d' | '90d' | 'all')[] | '7d' | '30d' | '90d' | 'all' = ['7d', '30d', '90d', 'all'], 
  channelId?: string
) => {
  const { data, isLoading, error, refetch } = useQuery<ChannelAnalyticsInsight, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'insights', Array.isArray(periods) ? periods.join(',') : periods),
    queryFn: () => {
      if (!channelId) {
        throw new Error('Channel ID is required for AI analytics insights');
      }
      console.log(`[Analytics] Fetching AI insights for channel ${channelId} with periods ${Array.isArray(periods) ? periods.join(',') : periods}`);
      return getChannelAnalyticsInsights(channelId, periods);
    },
    enabled: !!channelId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes 
    retry: 1, // Only retry once as this is a "nice to have" feature
  });

  return {
    insights: data,
    isLoading,
    error,
    refreshInsights: refetch
  };
};

import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  getChannelInsights
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
  RankedList,
} from '../types/analytics';
import type { InsightsPeriod } from '../types/insights';
import type { InsightsResponse } from '../api/analytics';
import { useCallback, useEffect, useState } from 'react';
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

export interface CreatorAnalyticsOptions {
  /**
   * Fetch the audience demographics. Off by default: only the Audience tab
   * reads them, and that tab is hidden until the backend says the numbers are
   * reliable (see useAudienceAvailability). Every other tab used to fetch them
   * on mount for nothing.
   */
  includeDemographics?: boolean;
}

/**
 * Hook for all creator analytics data associated with a specific channel
 */
export const useCreatorAnalytics = (
  period: '7d' | '30d' | 'all' = '7d',
  channelId?: string,
  options: CreatorAnalyticsOptions = {}
) => {
  const includeDemographics = options.includeDemographics === true;
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
    queryFn: () => getChannelDemographics(channelId!, demographicsPeriod),
    enabled: !!channelId && includeDemographics,
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
      return getGrowthMetrics(validPeriod, channelId!);
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
    queryFn: () => getEngagementTrends(channelId!, validPeriod),
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // Period-keyed and period-scoped: these lists used to be all-time under a
  // "Last 7 days" selector. `appliedPeriod` is what the backend says it used.
  const topLikedContent = useQuery<RankedList<TopContentItem>, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'topLikedContent', validPeriod),
    queryFn: () => getTopLikedContent(channelId!, 5, validPeriod),
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  const topSharedContent = useQuery<RankedList<TopSharedItem>, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'topSharedContent', validPeriod),
    queryFn: () => getTopSharedContent(channelId!, 5, validPeriod),
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  const topComments = useQuery<TopComment[], Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'topComments', validPeriod),
    queryFn: () => getTopComments(channelId!, validPeriod, 5),
    enabled: !!channelId,
    ...ANALYTICS_QUERY_DEFAULTS
  });

  // The likeGrowthTrends / topLikedVideos queries used to live here. They fired
  // on EVERY analytics tab mount for the sole benefit of LikesAnalyticsTab,
  // which was never routed. Both are deleted; the API helpers and the routes
  // behind them are still available if a Likes tab is ever built.

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
      totalSeconds: allTimeWatchHours.data?.totalWatchSeconds,
      formattedHours: allTimeWatchHours.data?.formattedHours ?? '0 hours',
      periodTotal: periodWatchHours.data?.totalWatchHours ?? 0,
      periodSeconds: periodWatchHours.data?.totalWatchSeconds,
      accurateSince:
        allTimeWatchHours.data?.watchTimeAccurateFrom ??
        periodWatchHours.data?.watchTimeAccurateFrom ??
        null
    },
    engagementTrends: engagementTrends.data,
    topLikedContent: topLikedContent.data?.items,
    topLikedAppliedPeriod: topLikedContent.data?.appliedPeriod ?? validPeriod,
    topSharedContent: topSharedContent.data?.items,
    topSharedAppliedPeriod: topSharedContent.data?.appliedPeriod ?? validPeriod,
    topComments: topComments.data,
    loading: {
      viewMetrics: viewMetrics.isLoading,
      detailedViewMetrics: detailedViewMetrics.isLoading,
      channelWatchPatterns: channelWatchPatterns.isLoading,
      // isLoading is false for a disabled query, so this is only ever true on
      // the Audience tab.
      demographics: demographics.isLoading,
      socialMetrics: socialMetrics.isLoading,
      growthMetrics: growthMetrics.isLoading,
      allTimeWatchHours: allTimeWatchHours.isLoading,
      periodWatchHours: periodWatchHours.isLoading,
      engagementTrends: engagementTrends.isLoading,
      topLikedContent: topLikedContent.isLoading,
      topSharedContent: topSharedContent.isLoading,
      topComments: topComments.isLoading,
    },
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
 * Whether the Audience tab may be shown for this channel.
 *
 * The tab is hidden because its numbers were wrong (cumulative per-country
 * counters summed across days). The backend is rebuilding it; it comes back
 * ONLY when the API answers with a `measuredSince` date. Until then the
 * answer is "hidden".
 *
 * This is ONE request per channel per browser session (staleTime: Infinity),
 * not one per tab mount and period as before — knowing whether the flag is
 * there needs one answer from the API.
 */
export const useAudienceAvailability = (channelId?: string) => {
  const query = useQuery<ChannelDemographics, Error>({
    queryKey: queryKeys.analytics.channelMetric(channelId, 'demographicsAvailability'),
    queryFn: () => getChannelDemographics(channelId!, 'last30'),
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false
  });
  return { measuredSince: audienceReliableSince(query.data) };
};

/** The valid `measuredSince` date of a demographics response, or null. */
export const audienceReliableSince = (
  demographics: Pick<ChannelDemographics, 'measuredSince'> | null | undefined
): string | null => {
  const value = demographics?.measuredSince;
  if (typeof value !== 'string' || value.trim() === '') return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
};

// The viewer-facing useViewerAnalytics / useAnalyticsData hooks lived here.
// Their only consumer was AudienceEngagementTab, which was never routed, and
// the /api/v1/analytics/watch-patterns endpoint behind them has been deleted.

/**
 * Creator AI Insights v2 — one channel, one period.
 *
 * The key includes the period because the report IS period-scoped: the coverage strip
 * ("based on 47 views over 7 days") and every fact in it describe that window, and
 * reusing one period's answer for another would be the same class of mislabelling the
 * rest of this dashboard was just cleaned of.
 *
 * `regenerate()` is the "Regenerate" button: it bypasses the backend's 24 h cache, costs
 * one of the day's allowances, and writes the answer straight into the query cache so
 * the card updates without a second round trip.
 *
 * A `generating` response means another request already holds the backend's generation
 * lock. We poll rather than error: the answer is being paid for right now, and starting
 * a second identical run is the one thing worse than waiting.
 */
export const useChannelInsights = (channelId: string | undefined, period: InsightsPeriod) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.analytics.channelMetric(channelId, 'insights', period);

  /**
   * The `generatedAt` of the report we are waiting to see REPLACED.
   *
   * A regeneration that loses the backend's generation lock comes back as 202, and the
   * cached report on screen is still the old one. Without this marker the hook would see
   * a perfectly good `ready` payload, stop polling, and the Regenerate button would look
   * like it had done nothing — while somebody's generation was still running and paid
   * for. We poll until the stamp moves.
   */
  const [awaitingReplacementOf, setAwaitingReplacementOf] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<InsightsResponse, Error>({
    queryKey,
    queryFn: () => {
      if (!channelId) throw new Error('Channel ID is required for insights');
      return getChannelInsights(channelId, period);
    },
    enabled: !!channelId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: (query) => {
      const current = query.state.data as InsightsResponse | undefined;
      // Someone else's generation is in flight.
      if (current?.status === 'generating') return 5000;
      // Our regeneration is in flight and this is still the report it will replace.
      if (
        awaitingReplacementOf &&
        current?.status === 'ready' &&
        current.data.generatedAt === awaitingReplacementOf
      ) {
        return 5000;
      }
      return false;
    },
    // A generation is expensive. Retrying a failure automatically would spend a second
    // one on a backend that has already told us it could not produce a report.
    retry: false
  });

  const ready = data?.status === 'ready' ? data : undefined;

  // Stop waiting the moment a newer report lands.
  useEffect(() => {
    if (awaitingReplacementOf && ready && ready.data.generatedAt !== awaitingReplacementOf) {
      setAwaitingReplacementOf(null);
    }
  }, [awaitingReplacementOf, ready]);

  const regenerate = useMutation({
    mutationFn: () => {
      if (!channelId) throw new Error('Channel ID is required for insights');
      return getChannelInsights(channelId, period, { refresh: true });
    },
    onSuccess: (fresh) => {
      if (fresh.status === 'ready') {
        queryClient.setQueryData(queryKey, fresh);
        setAwaitingReplacementOf(null);
        return;
      }
      // 202: another request is already generating. Keep the report on screen — writing
      // `generating` into the query cache would blank the card — and start waiting for a
      // newer `generatedAt`.
      setAwaitingReplacementOf(ready?.data.generatedAt ?? fresh.previous?.generatedAt ?? null);
    }
  });

  const isGenerating =
    data?.status === 'generating' ||
    (!!awaitingReplacementOf && ready?.data.generatedAt === awaitingReplacementOf);

  return {
    // While a generation is in flight and we have nothing else, the backend's `previous`
    // gives a cold tab something true to render rather than an empty card.
    insights: ready?.data ?? (data?.status === 'generating' ? data.previous : undefined),
    meta: ready?.meta,
    isGenerating,
    isLoading,
    error,
    refetch,
    regenerate: regenerate.mutate,
    isRegenerating: regenerate.isPending || isGenerating,
    regenerateError: regenerate.error as Error | null
  };
};

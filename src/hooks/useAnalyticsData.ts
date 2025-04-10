import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getWatchPatterns, 
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
  getLikeGrowthTrends,
  getTopLikedVideos
} from '../api/analytics';
import type { 
  WatchPatterns, 
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
  LikeGrowthTrends,
  TopLikedVideos
} from '../types/analytics';
import { useEffect } from 'react';

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
        queryKey: ['channel', channelId, 'channelWatchPatterns'], 
        queryFn: () => getChannelWatchPatterns(channelId) 
      }),
      queryClient.prefetchQuery({ 
        queryKey: ['channel', channelId, 'socialMetrics'], 
        queryFn: () => getSocialMetrics(channelId) 
      }),
      queryClient.prefetchQuery({ 
        queryKey: ['channel', channelId, 'growthMetrics', period], 
        queryFn: () => getGrowthMetrics(period, channelId) 
      }),
      queryClient.prefetchQuery({ 
        queryKey: ['channel', channelId, 'watchHours', period], 
        queryFn: () => getChannelWatchHours(channelId, period)
      }),
      queryClient.prefetchQuery({
        queryKey: ['channel', channelId, 'detailedViewMetrics'],
        queryFn: () => getChannelViewMetrics(channelId, true)
      }),
      queryClient.prefetchQuery({
        queryKey: ['channel', channelId, 'demographics', mapPeriodToDemographics(period)],
        queryFn: () => getChannelDemographics(channelId, mapPeriodToDemographics(period))
      }),
      queryClient.prefetchQuery({
        queryKey: ['channel', channelId, 'engagementTrends', period],
        queryFn: () => getEngagementTrends(channelId, period)
      }),
      queryClient.prefetchQuery({
        queryKey: ['channel', channelId, 'topLikedContent'],
        queryFn: () => getTopLikedContent(channelId, 5)
      }),
      queryClient.prefetchQuery({
        queryKey: ['channel', channelId, 'topSharedContent'],
        queryFn: () => getTopSharedContent(channelId, 5)
      }),
      queryClient.prefetchQuery({
        queryKey: ['channel', channelId, 'topComments', period],
        queryFn: () => getTopComments(channelId, period, 5)
      }),
      queryClient.prefetchQuery({
        queryKey: ['channel', channelId, 'likeGrowthTrends'],
        queryFn: () => getLikeGrowthTrends(channelId)
      }),
      queryClient.prefetchQuery({
        queryKey: ['channel', channelId, 'topLikedVideos'],
        queryFn: () => getTopLikedVideos(channelId)
      })
    ]);
  };

  const prefetchViewerAnalytics = async () => {
    await queryClient.prefetchQuery({ 
      queryKey: ['viewer', 'watchPatterns'], 
      queryFn: () => getWatchPatterns() 
    });
  };

  return { prefetchCreatorAnalytics, prefetchViewerAnalytics };
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
  
  // Enhanced cache invalidation function with more aggressive cache busting
  const invalidateAnalytics = async () => {
    console.log(`[Analytics] Invalidating cache for channelId ${channelId} with period ${validPeriod}`);
    
    if (channelId) {
      // First reset queries to clear any in-memory cache
      await queryClient.resetQueries({ 
        queryKey: ['channel', channelId],
        exact: false 
      });
      
      // Then invalidate all queries to trigger refetching
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'growthMetrics'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'watchHours'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'channelWatchPatterns'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'detailedViewMetrics'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'socialMetrics'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'demographics'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'engagementTrends'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'topLikedContent'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'topSharedContent'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['channel', channelId, 'topComments'], 
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({
          queryKey: ['channel', channelId, 'likeGrowthTrends'],
          refetchType: 'all'
        }),
        queryClient.invalidateQueries({
          queryKey: ['channel', channelId, 'topLikedVideos'],
          refetchType: 'all'
        })
      ]);

      // Force a refetch of current period data
      console.log(`[Analytics] Forced refetch for period ${validPeriod}`);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['channel', channelId, 'growthMetrics', validPeriod] }),
        queryClient.refetchQueries({ queryKey: ['channel', channelId, 'watchHours', validPeriod] }),
        queryClient.refetchQueries({ queryKey: ['channel', channelId, 'demographics', demographicsPeriod] }),
        queryClient.refetchQueries({ queryKey: ['channel', channelId, 'engagementTrends', validPeriod] }),
        queryClient.refetchQueries({ queryKey: ['channel', channelId, 'detailedViewMetrics', validPeriod] }),
        queryClient.refetchQueries({ queryKey: ['channel', channelId, 'topComments', validPeriod] })
      ]);
    }
  };

  // Basic view metrics - Channel-focused
  const viewMetrics = useQuery<BasicViewMetrics, Error>({
    queryKey: ['channel', channelId, 'viewMetrics'],
    queryFn: async () => {
      const result = await getChannelViewMetrics(channelId!, false);
      if (isDetailedViewMetrics(result)) {
        const { viewsByPeriod, ...basicMetrics } = result;
        return basicMetrics;
      }
      return result;
    },
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Detailed view metrics - Channel-focused
  const detailedViewMetrics = useQuery<DetailedViewMetrics, Error>({
    queryKey: ['channel', channelId, 'detailedViewMetrics', validPeriod],
    queryFn: async () => {
      console.log(`[Analytics] Fetching detailedViewMetrics for period ${validPeriod}`);
      const result = await getChannelViewMetrics(channelId!, true);
      if (!isDetailedViewMetrics(result)) {
        throw new Error('Expected detailed metrics but received basic metrics');
      }
      return result;
    },
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Channel watch patterns - Channel specific
  const channelWatchPatterns = useQuery<ChannelWatchPatterns, Error>({
    queryKey: ['channel', channelId, 'channelWatchPatterns'],
    queryFn: () => getChannelWatchPatterns(channelId!),
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Channel demographics - Channel specific
  const demographics = useQuery<ChannelDemographics, Error>({
    queryKey: ['channel', channelId, 'demographics', demographicsPeriod],
    queryFn: () => {
      console.log(`[Analytics] Fetching demographics for period ${demographicsPeriod}`);
      return getChannelDemographics(channelId!, demographicsPeriod);
    },
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Social metrics - Channel-focused
  const socialMetrics = useQuery<SocialMetrics, Error>({
    queryKey: ['channel', channelId, 'socialMetrics'],
    queryFn: () => getSocialMetrics(channelId!),
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Growth metrics - Channel-focused
  const growthMetrics = useQuery<GrowthMetrics, Error>({
    queryKey: ['channel', channelId, 'growthMetrics', validPeriod],
    queryFn: () => {
      // Determine the period to pass to the API
      // NOW: Pass 'all' directly if validPeriod is 'all'
      const apiPeriod = validPeriod;
      console.log(`[Analytics] Fetching growthMetrics for period ${apiPeriod}`);
      // Call the API with the determined period ('7d', '30d', or 'all')
      return getGrowthMetrics(apiPeriod, channelId!);
    },
    enabled: !!channelId,
    staleTime: 0, // Always consider data stale
    gcTime: 5 * 60 * 1000, // Keep unused data for 5 minutes
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Watch hours - Channel-focused with all-time and period data
  const allTimeWatchHours = useQuery<CreatorWatchHours, Error>({
    queryKey: ['channel', channelId, 'watchHours', 'all-time'],
    queryFn: () => {
      if (!channelId) {
        throw new Error('Channel ID is required for watch hours');
      }
      console.log('[Analytics] Fetching all-time watch hours');
      return getChannelWatchHours(channelId); // No period means all-time
    },
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2
  });

  const periodWatchHours = useQuery<CreatorWatchHours, Error>({
    queryKey: ['channel', channelId, 'watchHours', validPeriod],
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
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // New engagement-related queries
  const engagementTrends = useQuery<EngagementTrends, Error>({
    queryKey: ['channel', channelId, 'engagementTrends', validPeriod],
    queryFn: () => {
      console.log(`[Analytics] Fetching engagementTrends for channelId ${channelId} with period ${validPeriod}`);
      return getEngagementTrends(channelId!, validPeriod);
    },
    enabled: !!channelId,
    staleTime: 0, // Always consider data stale to ensure fresh data on period change
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2
  });

  const topLikedContent = useQuery<TopContentItem[], Error>({
    queryKey: ['channel', channelId, 'topLikedContent'],
    queryFn: () => getTopLikedContent(channelId!, 5),
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2
  });

  const topSharedContent = useQuery<TopSharedItem[], Error>({
    queryKey: ['channel', channelId, 'topSharedContent'],
    queryFn: () => getTopSharedContent(channelId!, 5),
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2
  });

  const topComments = useQuery<TopComment[], Error>({
    queryKey: ['channel', channelId, 'topComments', validPeriod],
    queryFn: () => {
      console.log(`[Analytics] Fetching topComments for period ${validPeriod}`);
      return getTopComments(channelId!, validPeriod, 5);
    },
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // === Integration of Like-related Queries ===
  
  // Like growth trends query
  const likeGrowthTrends = useQuery<LikeGrowthTrends, Error>({
    queryKey: ['channel', channelId, 'likeGrowthTrends'],
    queryFn: () => getLikeGrowthTrends(channelId!),
    enabled: !!channelId,
    staleTime: 0, // Match other queries' freshness preference
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2
  });
  
  // Top liked videos query (different from TopLikedContent endpoint)
  const topLikedVideos = useQuery<TopLikedVideos, Error>({
    queryKey: ['channel', channelId, 'topLikedVideos'],
    queryFn: () => getTopLikedVideos(channelId!),
    enabled: !!channelId,
    staleTime: 0, // Match other queries' freshness preference
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2
  });
  // === End Integration ===

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
    likeGrowthTrends: likeGrowthTrends.data,
    topLikedVideos: topLikedVideos.data,
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
               topComments.isLoading ||
               likeGrowthTrends.isLoading ||
               topLikedVideos.isLoading,
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
      topComments: topComments.error,
      likeGrowthTrends: likeGrowthTrends.error,
      topLikedVideos: topLikedVideos.error
    },
    invalidateAnalytics
  };
};

/**
 * Individual hook for channel watch hours only (creator-focused)
 */
export const useChannelWatchHours = (channelId: string, period: '7d' | '30d' = '7d') => {
  const query = useQuery<CreatorWatchHours, Error>({
    queryKey: ['channel', channelId, 'watchHours', period],
    queryFn: () => {
      if (!channelId) {
        throw new Error('Channel ID is required for watch hours');
      }
      return getChannelWatchHours(channelId, period);
    },
    enabled: !!channelId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2
  });

  return {
    watchHours: query.data?.totalWatchHours ?? 0,
    formattedHours: query.data?.formattedHours ?? '0 hours',
    trend: query.data?.trend ?? 0,
    isLoading: query.isLoading,
    isError: query.isError
  };
};

// ===========================================
// VIEWER-FOCUSED ANALYTICS
// ===========================================

/**
 * Hook for viewer-focused analytics data
 */
export const useViewerAnalytics = () => {
  // Watch patterns - General (viewers centric)
  const watchPatterns = useQuery<WatchPatterns, Error>({
    queryKey: ['viewer', 'watchPatterns'],
    queryFn: () => getWatchPatterns(),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2
  });

  return {
    watchPatterns: watchPatterns.data,
    isLoading: watchPatterns.isLoading,
    isError: watchPatterns.isError
  };
};

// ===========================================
// LEGACY SUPPORT (DEPRECATED)
// ===========================================

/**
 * @deprecated Use useCreatorAnalytics or useViewerAnalytics instead
 */
export const useAnalyticsData = (period: '7d' | '30d' = '7d', channelId?: string) => {
  const creatorData = useCreatorAnalytics(period, channelId);
  const viewerData = useViewerAnalytics();
  
  return {
    ...creatorData,
    watchPatterns: viewerData.watchPatterns,
    isLoading: creatorData.isLoading || viewerData.isLoading,
    hasCreatorError: Object.values(creatorData.errors).some(e => e !== null),
    viewerError: viewerData.isError
  };
};

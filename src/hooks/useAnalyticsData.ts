import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getWatchPatterns, 
  getSocialMetrics, 
  getGrowthMetrics, 
  getChannelWatchHours,
  getChannelViewMetrics,
  isDetailedViewMetrics 
} from '../api/analytics';
import type { 
  WatchPatterns, 
  SocialMetrics, 
  GrowthMetrics, 
  CreatorWatchHours,
  BasicViewMetrics,
  DetailedViewMetrics 
} from '../types/analytics';

// Create a custom hook for analytics context
export const useAnalyticsContext = () => {
  const queryClient = useQueryClient();
  
  const prefetchAnalytics = async (period: '7d' | '30d' = '7d', channelId?: string) => {
    // Skip prefetching if no channelId is provided
    if (!channelId) {
      return;
    }

    await Promise.all([
      queryClient.prefetchQuery({ 
        queryKey: ['channel', channelId, 'watchPatterns'], 
        queryFn: () => getWatchPatterns() 
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
      })
    ]);
  };

  return { prefetchAnalytics };
};

// Add period validation
const validatePeriod = (period: string): '7d' | '30d' => {
  return period === '30d' ? '30d' : '7d';
};

// Channel-focused analytics hook
export const useAnalyticsData = (period: '7d' | '30d' = '7d', channelId?: string) => {
  const queryClient = useQueryClient();
  const validPeriod = validatePeriod(period);
  
  // Add cache invalidation function
  const invalidateAnalytics = () => {
    if (channelId) {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'growthMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'watchHours'] });
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
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Detailed view metrics - Channel-focused
  const detailedViewMetrics = useQuery<DetailedViewMetrics, Error>({
    queryKey: ['channel', channelId, 'detailedViewMetrics'],
    queryFn: async () => {
      const result = await getChannelViewMetrics(channelId!, true);
      if (!isDetailedViewMetrics(result)) {
        throw new Error('Expected detailed metrics but received basic metrics');
      }
      return result;
    },
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Watch patterns - Channel-focused
  const watchPatterns = useQuery<WatchPatterns, Error>({
    queryKey: ['channel', channelId, 'watchPatterns'],
    queryFn: () => getWatchPatterns(),
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Social metrics - Channel-focused
  const socialMetrics = useQuery<SocialMetrics, Error>({
    queryKey: ['channel', channelId, 'socialMetrics'],
    queryFn: () => getSocialMetrics(channelId!),
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Growth metrics - Channel-focused
  const growthMetrics = useQuery<GrowthMetrics, Error>({
    queryKey: ['channel', channelId, 'growthMetrics', validPeriod],
    queryFn: () => getGrowthMetrics(validPeriod, channelId!),
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Watch hours - Channel-focused with all-time and period data
  const allTimeWatchHours = useQuery<CreatorWatchHours, Error>({
    queryKey: ['channel', channelId, 'watchHours', 'all-time'],
    queryFn: () => {
      if (!channelId) {
        throw new Error('Channel ID is required for watch hours');
      }
      return getChannelWatchHours(channelId); // No period means all-time
    },
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  const periodWatchHours = useQuery<CreatorWatchHours, Error>({
    queryKey: ['channel', channelId, 'watchHours', validPeriod],
    queryFn: () => {
      if (!channelId) {
        throw new Error('Channel ID is required for watch hours');
      }
      return getChannelWatchHours(channelId, validPeriod);
    },
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  return {
    viewMetrics: viewMetrics.data,
    detailedViewMetrics: detailedViewMetrics.data,
    watchPatterns: watchPatterns.data,
    socialMetrics: socialMetrics.data,
    growthMetrics: growthMetrics.data,
    creatorWatchHours: {
      total: allTimeWatchHours.data?.totalWatchHours ?? 0,
      formattedHours: allTimeWatchHours.data?.formattedHours ?? '0 hours',
      periodTotal: periodWatchHours.data?.totalWatchHours ?? 0,
      trend: periodWatchHours.data?.trend ?? 0
    },
    isLoading: viewMetrics.isLoading || 
               detailedViewMetrics.isLoading ||
               watchPatterns.isLoading || 
               socialMetrics.isLoading || 
               growthMetrics.isLoading || 
               allTimeWatchHours.isLoading ||
               periodWatchHours.isLoading,
    isError: viewMetrics.isError || 
             detailedViewMetrics.isError ||
             watchPatterns.isError || 
             socialMetrics.isError || 
             growthMetrics.isError || 
             allTimeWatchHours.isError ||
             periodWatchHours.isError,
    invalidateAnalytics
  };
};

// Individual hook for channel watch hours only
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
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
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

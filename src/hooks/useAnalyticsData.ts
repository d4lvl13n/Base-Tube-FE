import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getWatchPatterns, 
  getSocialMetrics, 
  getGrowthMetrics, 
  getCreatorWatchHours,
  getChannelViewMetrics,
  isDetailedViewMetrics 
} from '../api/analytics';
import {
  getChannelWatchPatterns,
  getChannelSocialMetrics,
  getChannelGrowthMetrics,
  getChannelWatchHours
} from '../api/channel';
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
  
  const prefetchAnalytics = async (period: '7d' | '30d', channelId?: string) => {
    if (channelId) {
      // Prefetch channel-specific analytics
      await Promise.all([
        queryClient.prefetchQuery({ 
          queryKey: ['channel', channelId, 'watchPatterns'], 
          queryFn: () => getChannelWatchPatterns(channelId) 
        }),
        queryClient.prefetchQuery({ 
          queryKey: ['channel', channelId, 'socialMetrics'], 
          queryFn: () => getChannelSocialMetrics(channelId) 
        }),
        queryClient.prefetchQuery({ 
          queryKey: ['channel', channelId, 'growthMetrics', period], 
          queryFn: () => getChannelGrowthMetrics(channelId, period) 
        }),
        queryClient.prefetchQuery({ 
          queryKey: ['channel', channelId, 'watchHours'], 
          queryFn: () => getChannelWatchHours(channelId) 
        }),
        queryClient.prefetchQuery({ 
          queryKey: ['channel', channelId, 'viewMetrics'],
          queryFn: () => getChannelViewMetrics(channelId, false)
        }),
        queryClient.prefetchQuery({ 
          queryKey: ['channel', channelId, 'detailedViewMetrics'],
          queryFn: () => getChannelViewMetrics(channelId, true)
        })
      ]);
    } else {
      // Prefetch general analytics
      await Promise.all([
        queryClient.prefetchQuery({ 
          queryKey: ['watchPatterns'], 
          queryFn: getWatchPatterns 
        }),
        queryClient.prefetchQuery({ 
          queryKey: ['socialMetrics'], 
          queryFn: getSocialMetrics 
        }),
        queryClient.prefetchQuery({ 
          queryKey: ['growthMetrics', period], 
          queryFn: () => getGrowthMetrics(period) 
        }),
        queryClient.prefetchQuery({ 
          queryKey: ['creatorWatchHours'], 
          queryFn: getCreatorWatchHours 
        })
      ]);
    }
  };

  return { prefetchAnalytics };
};

// Creator-focused analytics hook
export const useAnalyticsData = (period: '7d' | '30d' = '7d', channelId?: string) => {
  // Basic view metrics - Creator-focused
  const viewMetrics = useQuery<BasicViewMetrics, Error>({
    queryKey: ['channel', channelId, 'viewMetrics'],
    queryFn: async () => {
      const result = await getChannelViewMetrics(channelId!, false);
      if (isDetailedViewMetrics(result)) {
        // Strip out the detailed parts to ensure we return BasicViewMetrics
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

  // Detailed view metrics with time periods - Creator-focused
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

  // Watch patterns - Viewer-focused
  const watchPatterns = useQuery<WatchPatterns, Error>({
    queryKey: ['channel', channelId, 'watchPatterns'],
    queryFn: () => channelId ? getChannelWatchPatterns(channelId) : getWatchPatterns(),
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Social metrics - Viewer-focused
  const socialMetrics = useQuery<SocialMetrics, Error>({
    queryKey: ['channel', channelId, 'socialMetrics'],
    queryFn: () => channelId ? getChannelSocialMetrics(channelId) : getSocialMetrics(),
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Growth metrics - Creator-focused
  const growthMetrics = useQuery<GrowthMetrics, Error>({
    queryKey: ['channel', channelId, 'growthMetrics', period],
    queryFn: () => channelId ? getChannelGrowthMetrics(channelId, period) : getGrowthMetrics(period),
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Watch hours - Creator-focused
  const creatorWatchHours = useQuery<CreatorWatchHours, Error>({
    queryKey: ['channel', channelId, 'watchHours'],
    queryFn: () => channelId ? getChannelWatchHours(channelId) : getCreatorWatchHours(),
    enabled: !!channelId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  return {
    // Creator-focused metrics
    viewMetrics: viewMetrics.data,
    detailedViewMetrics: detailedViewMetrics.data,
    growthMetrics: growthMetrics.data,
    creatorWatchHours: creatorWatchHours.data?.totalWatchHours ?? 0,
    
    // Viewer-focused metrics
    watchPatterns: watchPatterns.data,
    socialMetrics: socialMetrics.data,
    
    // Loading and error states
    isLoading: viewMetrics.isLoading || 
               detailedViewMetrics.isLoading ||
               watchPatterns.isLoading || 
               socialMetrics.isLoading || 
               growthMetrics.isLoading || 
               creatorWatchHours.isLoading,
    isError: viewMetrics.isError || 
             detailedViewMetrics.isError ||
             watchPatterns.isError || 
             socialMetrics.isError || 
             growthMetrics.isError || 
             creatorWatchHours.isError
  };
};

// Individual hook for watch hours only
export const useCreatorWatchHours = (channelId?: string) => {
  const query = useQuery<CreatorWatchHours, Error>({
    queryKey: channelId ? ['channel', channelId, 'watchHours'] : ['creatorWatchHours'],
    queryFn: () => channelId ? getChannelWatchHours(channelId) : getCreatorWatchHours(),
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  return {
    watchHours: query.data?.totalWatchHours ?? 0,
    isLoading: query.isLoading,
    isError: query.isError
  };
};

import React, { useState } from 'react';
import { 
  Users, 
  Play, 
  Clock, 
  MessageCircle, 
  TrendingUp, 
  ThumbsUp,
  DollarSign,
  BarChart2
} from 'lucide-react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { GrowthChart } from '../charts/GrowthChart';
import { useChannelData } from '../../../../../hooks/useChannelData';
import { WatchTimeChart } from '../charts/WatchTimeChart';

// Helper function (can be shared or kept local if only used here)
const getLatestCount = (trendData?: { date: string; count: number }[]) => {
  return trendData && trendData.length > 0 ? trendData[trendData.length - 1].count : 0;
};

// Helper function (can be shared or kept local)
const calculateTrend = (trendData?: { date: string; count: number }[]) => {
  if (!trendData || trendData.length < 2) return 0;
  const latestCount = trendData[trendData.length - 1].count;
  const startCount = trendData[0].count;
  if (startCount === 0) return latestCount > 0 ? 100 : 0; 
  return ((latestCount / startCount) - 1) * 100;
};

export const OverviewTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [isChangingPeriod, setIsChangingPeriod] = useState(false);
  
  const { 
    growthMetrics, 
    detailedViewMetrics,
    creatorWatchHours,
    channelWatchPatterns,
    engagementTrends,
    isLoading: analyticsLoading,
    errors,
    invalidateAnalytics
  } = useCreatorAnalytics(period, channelId);

  const { channel, isLoading: channelLoading } = useChannelData(
    channelId ? parseInt(channelId) : undefined
  );
  
  const isLoading = analyticsLoading || channelLoading;

  // Handle period change with cache invalidation
  const handlePeriodChange = async (newPeriod: '7d' | '30d' | 'all') => {
    if (newPeriod !== period) {
      setIsChangingPeriod(true);
      // Invalidate cache to force fresh data load
      await invalidateAnalytics();
      setPeriod(newPeriod);
      
      // Give some time for the UI to show loading state
      setTimeout(() => {
        setIsChangingPeriod(false);
      }, 1000);
    }
  };

  // Calculate average retention rate
  const averageRetentionRate = 
    channelWatchPatterns?.retentionByDuration?.reduce(
      (avg, item) => avg + (item.retentionRate / (channelWatchPatterns.retentionByDuration.length || 1)), 
      0
    ) ?? 0;

  // Map hourly patterns for the watch time chart
  const watchTimeData = channelWatchPatterns?.hourlyPatterns?.map(pattern => ({
    hour: pattern.hour,
    viewCount: pattern.viewCount
  })) ?? [];

  // Get the top performing video
  const topRetainedVideo = channelWatchPatterns?.topRetainedVideos?.[0];

  // Monetization stats (placeholder for future implementation)
  const monetizationStats = {
    estimatedRevenue: (detailedViewMetrics?.totalViews || 0) * 0.001, // $0.001 per view (placeholder)
    projectedEarnings: (detailedViewMetrics?.totalViews || 0) * 0.001 * (period === '7d' ? 4 : 1), // projected monthly
    topCategory: 'Gaming',
    revenueTrend: growthMetrics?.metrics.views.trend ?? 0,
  };

  // --- Direct comment calculation from engagementTrends ---
  const totalComments = getLatestCount(engagementTrends?.commentGrowth);
  const commentGrowthTrend = calculateTrend(engagementTrends?.commentGrowth);
  // --- End direct comment calculation ---

  // For display strings
  const periodString = period === '7d' ? '7 days' : period === '30d' ? '30 days' : 'all time';

  // Get period-specific data for stats cards
  const getPeriodViews = () => {
    if (period === '7d' && detailedViewMetrics?.viewsByPeriod?.last7d !== undefined) {
      return detailedViewMetrics.viewsByPeriod.last7d;
    } else if (period === '30d' && detailedViewMetrics?.viewsByPeriod?.last30d !== undefined) {
      return detailedViewMetrics.viewsByPeriod.last30d;
    }
    return detailedViewMetrics?.totalViews ?? 0;
  };

  // Get period-specific watch hours
  const getPeriodWatchHours = () => {
    if (period === 'all') {
      return {
        value: creatorWatchHours?.formattedHours || '0',
        subtitle: `${(channelWatchPatterns?.durationStats?.totalViews ?? 0).toLocaleString()} videos watched`
      };
    } else {
      // Fix: Use the correct period-specific data from periodTotal 
      const periodHours = creatorWatchHours?.periodTotal ?? 0;
      // For 7 days, show the actual period total; for 30 days adjust if needed
      const formattedValue = period === '7d' 
        ? periodHours.toFixed(1)  
        : periodHours.toFixed(1);
        
      return {
        value: `${formattedValue} hours`,
        subtitle: `For ${periodString}`
      };
    }
  };

  // Period-specific engagement rate
  const getPeriodEngagementRate = () => {
    return `${(growthMetrics?.metrics.engagement.total ?? 0).toFixed(1)}%`;
  };

  // Check for relevant errors
  const commentsError = errors.engagementTrends;
  const engagementError = errors.growthMetrics; 
  const completionRateError = errors.channelWatchPatterns; 
  const growthData = growthMetrics?.metrics;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-gray-400">Key performance metrics for your channel</p>
        </div>
        <div className="flex items-center gap-2">
          {(isLoading || isChangingPeriod) && (
            <div className="animate-spin">
              <Clock className="w-4 h-4 text-[#fa7517]" />
            </div>
          )}
          <Select
            value={period}
            onValueChange={(value) => handlePeriodChange(value as '7d' | '30d' | 'all')}
            options={[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: 'all', label: 'All Time' },
            ]}
          />
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Users}
          title="Subscribers"
          value={period === 'all' 
            ? (channel?.subscribers_count || 0).toLocaleString()
            : (growthMetrics?.metrics.subscribers.total || 0).toLocaleString()}
          change={Math.round(growthMetrics?.metrics.subscribers.trend ?? 0)}
          loading={isLoading}
          subtitle={period === 'all' 
            ? "Total subscriber count" 
            : `New in ${periodString}`}
        />
        
        <StatsCard
          icon={Play}
          title="Views"
          value={getPeriodViews().toLocaleString()}
          change={Math.round(growthMetrics?.metrics.views.trend ?? 0)}
          loading={isLoading}
          subtitle={`For ${periodString}`}
        />
        
        <StatsCard
          icon={Clock}
          title="Watch Time"
          value={getPeriodWatchHours().value}
          change={0}
          loading={isLoading}
          subtitle={getPeriodWatchHours().subtitle}
        />
        
        <StatsCard
          icon={DollarSign}
          title="Est. Revenue"
          value="Coming Soon"
          change={0}
          loading={isLoading}
          subtitle="Monetization features in development"
          className="opacity-70"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={ThumbsUp}
          title="Engagement Rate"
          value={getPeriodEngagementRate()}
          change={period === 'all' || growthData?.engagement.trend == null || growthData?.engagement.trend === 0 
            ? 0 
            : Math.round(growthData.engagement.trend)}
          loading={analyticsLoading}
          subtitle={`For ${periodString}`}
          error={engagementError ? "Error loading engagement" : undefined}
        />
        
        <StatsCard
          icon={TrendingUp}
          title="Completion Rate"
          value={`${averageRetentionRate.toFixed(1)}%`}
          change={0}
          loading={analyticsLoading}
          subtitle="Average completion rate"
          error={completionRateError ? "Error loading completion rate" : undefined}
        />
        
        <StatsCard
          icon={BarChart2}
          title="Top Performing"
          value={topRetainedVideo?.title ? (topRetainedVideo.title.length > 15 ? topRetainedVideo.title.substring(0, 15) + '...' : topRetainedVideo.title) : 'N/A'}
          change={0}
          loading={isLoading}
          subtitle={topRetainedVideo ? `${topRetainedVideo.retentionRate.toFixed(1)}% completion rate` : 'No data available'}
        />
        
        <StatsCard
          icon={MessageCircle}
          title="Comments"
          value={totalComments.toLocaleString()}
          change={Math.round(commentGrowthTrend)}
          loading={analyticsLoading}
          subtitle={`For ${periodString}`}
          error={commentsError ? "Error loading comments" : undefined}
        />
      </div>

      {/* Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Growth Trends</h3>
          <GrowthChart data={growthMetrics?.metrics} />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Watch Time Distribution</h3>
          <WatchTimeChart 
            data={
              // Ensure all 24 hours are represented
              Array.from({ length: 24 }, (_, hour) => {
                const hourData = watchTimeData.find(d => d.hour === hour);
                return {
                  hour,
                  viewCount: hourData?.viewCount || 0
                };
              })
            } 
          />
        </div>
      </div>
    </div>
  );
}; 
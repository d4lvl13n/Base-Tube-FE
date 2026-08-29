import React, { useState } from 'react';
import {
  Users,
  Play,
  Clock,
  MessageCircle,
  TrendingUp,
  ThumbsUp,
  DollarSign
} from 'lucide-react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { GrowthChart } from '../charts/GrowthChart';
import { useChannelData } from '../../../../../hooks/useChannelData';
import { WatchTimeChart } from '../charts/WatchTimeChart';
import {
  formatPercent,
  interactionRate,
  sumCounts,
  trendBadgeValue,
  weightedPercentWatched
} from '../metrics';

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

  // Average share of each video actually watched, weighted by the views in each
  // duration bucket (the old flat average gave a bucket with 1 view the same
  // weight as one with 1,000).
  const averagePercentWatched = weightedPercentWatched(channelWatchPatterns?.retentionByDuration);

  // Map hourly patterns for the watch time chart
  const watchTimeData = channelWatchPatterns?.hourlyPatterns?.map(pattern => ({
    hour: pattern.hour,
    viewCount: pattern.viewCount
  })) ?? [];

  // Totals over the whole window. These used to read the LAST data point of the
  // series, so "Comments, 7 days" showed the count on the most recent active day.
  const totalComments = sumCounts(engagementTrends?.commentGrowth);
  const totalLikes = sumCounts(engagementTrends?.likeGrowth);

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

  // (likes + comments) / views over the SAME window. The card used to print the
  // raw interaction COUNT with a '%' sign appended.
  const periodViews = getPeriodViews();
  const interactionsThisPeriod = totalLikes + totalComments;
  const periodInteractionRate = interactionRate(interactionsThisPeriod, periodViews);

  // Check for relevant errors
  const commentsError = errors.engagementTrends;
  const engagementError = errors.growthMetrics; 
  const completionRateError = errors.channelWatchPatterns; 

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
          change={trendBadgeValue(growthMetrics?.metrics.subscribers.trend)}
          loading={isLoading}
          subtitle={period === 'all' 
            ? "Total subscriber count" 
            : `New in ${periodString}`}
        />
        
        <StatsCard
          icon={Play}
          title="Views"
          value={periodViews.toLocaleString()}
          change={trendBadgeValue(growthMetrics?.metrics.views.trend)}
          loading={isLoading}
          subtitle={`For ${periodString}`}
        />
        
        <StatsCard
          icon={Clock}
          title="Watch Time"
          value={getPeriodWatchHours().value}
          loading={isLoading}
          subtitle={getPeriodWatchHours().subtitle}
        />
        
        <StatsCard
          icon={DollarSign}
          title="Est. Revenue"
          value="Coming Soon"
          loading={isLoading}
          subtitle="Monetization features in development"
          className="opacity-70"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={ThumbsUp}
          title="Interaction rate"
          value={formatPercent(periodInteractionRate)}
          loading={analyticsLoading}
          subtitle={`${interactionsThisPeriod.toLocaleString()} likes + comments / ${periodViews.toLocaleString()} views, ${periodString}`}
          error={engagementError ? "Error loading engagement" : undefined}
        />

        <StatsCard
          icon={TrendingUp}
          title="Avg. % watched"
          value={formatPercent(averagePercentWatched)}
          loading={analyticsLoading}
          subtitle="Share of each video watched, weighted by views"
          error={completionRateError ? "Error loading watch depth" : undefined}
        />

        <StatsCard
          icon={MessageCircle}
          title="Comments"
          value={totalComments.toLocaleString()}
          loading={analyticsLoading}
          subtitle={`For ${periodString}`}
          error={commentsError ? "Error loading comments" : undefined}
        />

        <StatsCard
          icon={ThumbsUp}
          title="Likes"
          value={totalLikes.toLocaleString()}
          loading={analyticsLoading}
          subtitle={`For ${periodString}`}
          error={commentsError ? "Error loading likes" : undefined}
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
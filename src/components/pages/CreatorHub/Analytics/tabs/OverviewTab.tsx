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
  weightedPercentWatched, formatWatchTime } from '../metrics';

export const OverviewTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  
  const { 
    growthMetrics, 
    detailedViewMetrics,
    creatorWatchHours,
    channelWatchPatterns,
    engagementTrends,
    isLoading: analyticsLoading,
    errors,
  } = useCreatorAnalytics(period, channelId);

  const { channel, isLoading: channelLoading, error: channelError } = useChannelData(
    channelId ? parseInt(channelId) : undefined
  );
  
  const isLoading = analyticsLoading || channelLoading;

  // Handle period change with cache invalidation
  // Just switch the period. Every period-sensitive query has the period in
  // its key, so React Query fetches the new key by itself. Invalidating the
  // whole channel first (what this used to do) also refetched the OLD
  // period's queries — ~19 requests for one click on the selector.
  const handlePeriodChange = (newPeriod: '7d' | '30d' | 'all') => {
    if (newPeriod !== period) setPeriod(newPeriod);
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
        value: formatWatchTime(creatorWatchHours?.totalSeconds, creatorWatchHours?.total ?? 0),
        subtitle: `${(channelWatchPatterns?.durationStats?.totalViews ?? 0).toLocaleString()} views`
      };
    } else {
      return {
        value: formatWatchTime(creatorWatchHours?.periodSeconds, creatorWatchHours?.periodTotal ?? 0),
        subtitle: `For ${periodString}`
      };
    }
  };

  // (likes + comments) / views over the SAME window. The card used to print the
  // raw interaction COUNT with a '%' sign appended.
  const periodViews = getPeriodViews();
  const interactionsThisPeriod = totalLikes + totalComments;
  const periodInteractionRate = interactionRate(interactionsThisPeriod, periodViews);

  // Each card names the queries it actually reads. Getting this wrong is how a
  // rethrown backend error still renders as a confident number: the interaction
  // card used to be gated on growthMetrics while its inputs are engagementTrends
  // (likes + comments) and detailedViewMetrics (views).
  const commentsError = errors.engagementTrends;
  const interactionError = errors.engagementTrends || errors.detailedViewMetrics;
  const completionRateError = errors.channelWatchPatterns;
  // 'all' reads the channel record for the subscriber total; every other period
  // reads growthMetrics for "new in <period>".
  const subscribersError = period === 'all' ? channelError : errors.growthMetrics;
  // The Views card shows a detailedViewMetrics number with a growthMetrics
  // trend badge, so either failing must show as an error rather than a number
  // with a missing badge.
  const viewsError = errors.detailedViewMetrics || errors.growthMetrics;
  const watchHoursError = errors.allTimeWatchHours || errors.periodWatchHours;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-gray-400">Key performance metrics for your channel</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
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
          error={subscribersError ? 'Error loading subscribers' : undefined}
        />
        
        <StatsCard
          icon={Play}
          title="Views"
          value={periodViews.toLocaleString()}
          change={trendBadgeValue(growthMetrics?.metrics.views.trend)}
          loading={isLoading}
          subtitle={`For ${periodString}`}
          error={viewsError ? 'Error loading views' : undefined}
        />
        
        <StatsCard
          icon={Clock}
          title="Watch Time"
          value={getPeriodWatchHours().value}
          loading={isLoading}
          subtitle={getPeriodWatchHours().subtitle}
          error={watchHoursError ? 'Error loading watch time' : undefined}
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
          error={interactionError ? "Error loading interactions" : undefined}
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
import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';
import { Users, Play, Clock, MessageCircle } from 'lucide-react';
import { Channel } from '../../../types/channel';
import { useCreatorAnalytics } from '../../../hooks/useAnalyticsData';
import { useChannelData } from '../../../hooks/useChannelData';
import { formatPercent, interactionRate, trendBadgeValue, formatWatchTime } from './Analytics/metrics';

interface CreatorDashboardProps {
  channels: Channel[];
  userProfile: any;
  clerkUser: any;
  selectedChannelId: string;
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ 
  userProfile, 
  clerkUser,
  selectedChannelId 
}) => {
  const username = userProfile?.username || clerkUser?.username || 'Creator';
  
  const { 
    growthMetrics,
    creatorWatchHours,
    viewMetrics,
    detailedViewMetrics,
    socialMetrics,
    isLoading: analyticsLoading,
    errors
  } = useCreatorAnalytics('7d', selectedChannelId);

  const {
    channel: activeChannel,
    isLoading: channelLoading,
    error: channelError
  } = useChannelData(selectedChannelId ? parseInt(selectedChannelId) : undefined);

  const isLoading = analyticsLoading || channelLoading;

  // A rethrown query error must reach the card that reads it. Without this the
  // dashboard renders "0", "0 hours" and "—" for a failed request, which is the
  // exact all-zeros-on-failure the backend fix was meant to end.
  // The subscriber card's VALUE comes from the channel record and its subtitle
  // from growthMetrics, so either failing has to show as an error.
  const subscribersError = channelError || errors.growthMetrics;
  const viewsError = errors.viewMetrics;
  const watchHoursError = errors.allTimeWatchHours || errors.periodWatchHours;
  const interactionError = errors.socialMetrics || errors.detailedViewMetrics;

  // socialMetrics.recentEngagement covers the last 30 days; viewMetrics.totalViews
  // is all-time. Dividing one by the other produced "Infinity%" on a channel with
  // no counted views, and a meaningless ratio otherwise. Both sides now come from
  // the same 30-day window, with an explicit zero guard
  // (docs/ANALYTICS_REVIEW_2026-08-29.md finding 5).
  const interactions30d = socialMetrics?.interactions.recentEngagement.total ?? 0;
  const views30d = detailedViewMetrics?.viewsByPeriod?.last30d;

  const formatMetrics = {
    subscribers: activeChannel?.subscribers_count?.toLocaleString() ?? '0',
    newSubscribers: growthMetrics?.metrics.subscribers.total.toLocaleString() ?? '0',
    subscribersTrend: trendBadgeValue(growthMetrics?.metrics.subscribers.trend),
    views: viewMetrics?.totalViews.toLocaleString() ?? '0',
    viewsTrend: trendBadgeValue(growthMetrics?.metrics.views.trend),
    watchTime: formatWatchTime(creatorWatchHours.totalSeconds, creatorWatchHours.total),
    interactionRate: formatPercent(interactionRate(interactions30d, views30d)),
    interactions30d,
    responseRate: socialMetrics?.interactions.responseRate ?? 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl p-8 pt-24"
    >
      <div className="mb-12">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-3">
          Welcome back, {username}!
        </h1>
        <p className="text-gray-400 text-lg">Here's how your content is performing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard 
          icon={Users} 
          title="Total Subscribers" 
          value={formatMetrics.subscribers}
          change={formatMetrics.subscribersTrend}
          loading={isLoading}
          subtitle={`${formatMetrics.newSubscribers} new in last 7 days`}
          error={subscribersError ? 'Error loading subscribers' : undefined}
        />
        <StatsCard 
          icon={Play} 
          title="Total Views" 
          value={formatMetrics.views}
          change={formatMetrics.viewsTrend}
          loading={isLoading}
          subtitle={`Growth over 7 days`}
          error={viewsError ? 'Error loading views' : undefined}
        />
        {/* No badge on watch time: `periodTotal` is a number of HOURS, and it
            used to be handed to `change` and rendered as "↑12%". */}
        <StatsCard
          icon={Clock}
          title="Total Watch Time"
          value={formatMetrics.watchTime}
          loading={isLoading}
          subtitle="Watched, all time"
          error={watchHoursError ? 'Error loading watch time' : undefined}
        />
        <StatsCard
          icon={MessageCircle}
          title="Interaction rate"
          value={formatMetrics.interactionRate}
          loading={isLoading}
          subtitle={`${formatMetrics.interactions30d.toLocaleString()} likes + comments / views, last 30 days`}
          error={interactionError ? 'Error loading interactions' : undefined}
        />
      </div>
    </motion.div>
  );
};

export default CreatorDashboard;
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import StatsCard from './StatsCard';
import { Users, Play, Clock, MessageCircle } from 'lucide-react';
import { Channel } from '../../../types/channel';
import { useCreatorAnalytics } from '../../../hooks/useAnalyticsData';
import { useChannelData } from '../../../hooks/useChannelData';
import PassSalesSummary from './PassSalesSummary';
import HowViewsAreCounted from './Analytics/HowViewsAreCounted';
import {
  OWN_REPLIES_NOTE,
  accurateSinceNote,
  interactionRateView,
  formatWatchTime,
  joinNotes,
  periodComparisonCaption,
  readCount
} from './Analytics/metrics';

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
  const prefersReducedMotion = useReducedMotion();
  const username = userProfile?.username || clerkUser?.username || 'Creator';
  
  const {
    growthMetrics,
    creatorWatchHours,
    viewMetrics,
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
  // The views card's caption reads growthMetrics too.
  const subscribersError = channelError || errors.growthMetrics;
  const viewsError = errors.viewMetrics || errors.growthMetrics;
  const watchHoursError = errors.allTimeWatchHours || errors.periodWatchHours;
  const interactionError = errors.growthMetrics;

  // The three totals are ALL-TIME. The old ↑% badges on them compared two
  // 7-day windows without saying so, and read "↑100%" whenever the earlier
  // week was empty. The comparison is now written out with its raw counts
  // ("+2 in the last 7 days (0 the week before)"); the earlier week is shown
  // only when the backend sends its raw count (`previousTotal`).
  const growth = growthMetrics?.metrics;
  const comparison = (series?: { total?: number; previousTotal?: number | null }) =>
    periodComparisonCaption({
      current: readCount(series?.total),
      previous: readCount(series?.previousTotal),
      days: 7
    });

  // Interaction rate: the SAME definition and window as Analytics → Overview
  // on "Last 7 days" — (likes + comments) ÷ counted views, both from the
  // 7-day growth response, the window every other card here compares with.
  // The two counts are always shown; the percentage only from 100 views.
  const interaction = interactionRateView(growth?.engagement.total, growth?.views.total);

  const formatMetrics = {
    subscribers: activeChannel?.subscribers_count?.toLocaleString() ?? '0',
    views: viewMetrics?.totalViews.toLocaleString() ?? '0',
    watchTime: formatWatchTime(creatorWatchHours.totalSeconds, creatorWatchHours.total),
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl p-8 pt-24"
    >
      <div className="mb-12">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Welcome back, {username}!
        </h1>
        <p className="text-gray-400 text-lg">Here's how your content is performing</p>
      </div>

      <p className="text-sm text-gray-400 mb-3">
        Numbers for the channel{' '}
        <span className="text-white font-medium">{activeChannel?.name ?? 'selected in the sidebar'}</span> only.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard
          icon={Users}
          title="Total Subscribers"
          value={formatMetrics.subscribers}
          loading={isLoading}
          subtitle={comparison(growth?.subscribers) ?? 'Subscribed today'}
          error={subscribersError ? 'Error loading subscribers' : undefined}
        />
        <StatsCard
          icon={Play}
          title="Total Views"
          value={formatMetrics.views}
          loading={isLoading}
          subtitle={comparison(growth?.views) ?? 'All time'}
          error={viewsError ? 'Error loading views' : undefined}
        />
        {/* No badge on watch time: `periodTotal` is a number of HOURS, and it
            used to be handed to `change` and rendered as "↑12%". */}
        <StatsCard
          icon={Clock}
          title="Total Watch Time"
          value={formatMetrics.watchTime}
          loading={isLoading}
          subtitle="Time played, all time"
          note={joinNotes(accurateSinceNote(creatorWatchHours.accurateSince))}
          error={watchHoursError ? 'Error loading watch time' : undefined}
        />
        <StatsCard
          icon={MessageCircle}
          title="Interaction rate"
          value={interaction.valueText}
          valueMuted={interaction.rate === null}
          loading={isLoading}
          subtitle={`${interaction.countsText}, last 7 days`}
          note={joinNotes(interaction.noRateNote, OWN_REPLIES_NOTE)}
          error={interactionError ? 'Error loading interactions' : undefined}
        />
      </div>
      <HowViewsAreCounted className="-mt-8 mb-12" />

      {/* Pass sales: its own component, on /creator/business (all channels, last 30 days). */}
      <PassSalesSummary />
    </motion.div>
  );
};

export default CreatorDashboard;
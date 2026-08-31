import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';
import { Users, Play, Clock, MessageCircle, Ticket } from 'lucide-react';
import { Channel } from '../../../types/channel';
import { useCreatorAnalytics } from '../../../hooks/useAnalyticsData';
import { useChannelData } from '../../../hooks/useChannelData';
import { useCreatorSales } from '../../../hooks/usePass';
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

  const { data: sales, isLoading: salesLoading } = useCreatorSales({
    enabled: Boolean(selectedChannelId),
  });

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

      <div className="rounded-2xl border border-gray-800/70 bg-black/40 p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Pass sales</h2>
        <p className="text-sm text-gray-400 mb-5">Who bought, and what you earned. YouTube numbers stay above.</p>
        {salesLoading ? (
          <p className="text-sm text-gray-500">Loading sales…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Card proceeds</p>
                <p className="text-xl text-white mt-1">
                  {sales ? `${sales.card.currency} ${(sales.card.proceeds_minor / 100).toFixed(2)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Crypto proceeds</p>
                <p className="text-xl text-white mt-1">
                  {sales ? `${sales.crypto.currency} ${(sales.crypto.proceeds_minor / 100).toFixed(2)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Buyers</p>
                <p className="text-xl text-white mt-1">{sales?.buyers ?? 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Pass holders</p>
                <p className="text-xl text-white mt-1">{sales?.pass_holders ?? 0}</p>
              </div>
            </div>
            {sales?.recent?.length ? (
              <ul className="divide-y divide-gray-800/80">
                {sales.recent.map((row) => (
                  <li key={row.purchase_id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">
                        {row.buyer_username || row.buyer_email || 'Buyer'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {row.pass_title} · {row.payment_type === 'stripe' ? 'Card' : 'Crypto'} · {row.settlement_status}
                        {row.first_played_at ? ' · watched' : ''}
                      </p>
                    </div>
                    <Ticket className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No purchases yet.</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CreatorDashboard;
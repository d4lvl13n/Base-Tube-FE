import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Play,
  Clock,
  MessageCircle,
  TrendingUp,
  ThumbsUp,
  Ticket,
  ArrowRight
} from 'lucide-react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { GrowthChart } from '../charts/GrowthChart';
import { useChannelData } from '../../../../../hooks/useChannelData';
import { WatchTimeChart } from '../charts/WatchTimeChart';
import {
  COUNTED_VIEWS_NOTE,
  OWN_REPLIES_NOTE,
  accurateSinceNote,
  formatPercent,
  interactionRateView,
  joinNotes,
  periodPhrase,
  previousWindowText,
  readCount,
  sumCounts,
  weightedPercentWatched,
  formatWatchTime
} from '../metrics';

export const OverviewTab: React.FC<{ channelId: string; channelName?: string }> = ({
  channelId,
  channelName
}) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  const {
    growthMetrics,
    creatorWatchHours,
    channelWatchPatterns,
    engagementTrends,
    isLoading: analyticsLoading,
    loading,
    errors,
  } = useCreatorAnalytics(period, channelId);

  const { channel, isLoading: channelLoading, error: channelError } = useChannelData(
    channelId ? parseInt(channelId) : undefined
  );

  const isLoading = analyticsLoading || channelLoading;

  // Just switch the period. Every period-sensitive query has the period in
  // its key, so React Query fetches the new key by itself.
  const handlePeriodChange = (newPeriod: '7d' | '30d' | 'all') => {
    if (newPeriod !== period) setPeriod(newPeriod);
  };

  // Average share of each video actually watched, weighted by the views in each
  // duration bucket (the old flat average gave a bucket with 1 view the same
  // weight as one with 1,000).
  const averagePercentWatched = weightedPercentWatched(channelWatchPatterns?.retentionByDuration);

  // View counts per UTC hour of day.
  const viewsByHour = channelWatchPatterns?.hourlyPatterns?.map(pattern => ({
    hour: pattern.hour,
    viewCount: pattern.viewCount
  })) ?? [];

  // Totals over the whole window. These used to read the LAST data point of the
  // series, so "Comments, 7 days" showed the count on the most recent active day.
  const totalComments = sumCounts(engagementTrends?.commentGrowth);
  const totalLikes = sumCounts(engagementTrends?.likeGrowth);

  const phrase = periodPhrase(period);
  const inPeriod = period === 'all' ? 'All time' : `In ${phrase}`;
  const days = period === '7d' ? 7 : 30;

  const watchTimeValue = period === 'all'
    ? formatWatchTime(creatorWatchHours?.totalSeconds, creatorWatchHours?.total ?? 0)
    : formatWatchTime(creatorWatchHours?.periodSeconds, creatorWatchHours?.periodTotal ?? 0);

  // "N the week before" — only when the backend sends the raw earlier count.
  // The old badge was a percentage that read "↑100%" whenever the earlier
  // window was empty.
  const previousNote = (series?: { total?: number; previousTotal?: number | null }) =>
    period === 'all'
      ? null
      : previousWindowText({
          current: readCount(series?.total),
          previous: readCount(series?.previousTotal),
          days
        });

  // Views and the interaction rate both come from the growth response, so the
  // Views card, the counts and the rate share ONE window — and the rate is the
  // same definition as the dashboard card (which is this card on "Last 7 days").
  const periodViews = readCount(growthMetrics?.metrics.views.total) ?? 0;
  const interaction = interactionRateView(growthMetrics?.metrics.engagement.total, growthMetrics?.metrics.views.total);

  // Each card names the queries it actually reads, so a failed request shows as
  // an error on the card that depends on it, never as a confident number.
  const commentsError = errors.engagementTrends;
  const interactionError = errors.growthMetrics;
  const completionRateError = errors.channelWatchPatterns;
  // 'all' reads the channel record for the subscriber total; every other period
  // reads growthMetrics for "new in <period>".
  const subscribersError = period === 'all' ? channelError : errors.growthMetrics;
  const viewsError = errors.growthMetrics;
  const watchHoursError = period === 'all' ? errors.allTimeWatchHours : errors.periodWatchHours;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-gray-400">
            Key performance metrics for {channelName ? <span className="text-white">{channelName}</span> : 'this channel'} only
          </p>
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
          loading={period === 'all' ? channelLoading : loading.growthMetrics}
          subtitle={period === 'all'
            ? 'Total subscribers today'
            : `New in ${phrase}`}
          note={joinNotes(previousNote(growthMetrics?.metrics.subscribers))}
          error={subscribersError ? 'Error loading subscribers' : undefined}
        />

        <StatsCard
          icon={Play}
          title="Views"
          value={periodViews.toLocaleString()}
          loading={loading.growthMetrics}
          subtitle={inPeriod}
          note={joinNotes(previousNote(growthMetrics?.metrics.views))}
          error={viewsError ? 'Error loading views' : undefined}
        />

        <StatsCard
          icon={Clock}
          title="Watch Time"
          value={watchTimeValue}
          loading={period === 'all' ? loading.allTimeWatchHours : loading.periodWatchHours}
          subtitle={`Time played, ${period === 'all' ? 'all time' : phrase}`}
          note={joinNotes(accurateSinceNote(creatorWatchHours?.accurateSince))}
          error={watchHoursError ? 'Error loading watch time' : undefined}
        />

        {/* Pass revenue lives in Business, from the sales ledger. No number
            here: a second copy of it would be a second source of truth. */}
        <Link
          to="/creator-hub/business"
          className="group bg-black/50 rounded-xl p-6 border border-gray-800/30 hover:border-[#fa7517]/40 transition-colors block"
        >
          <div className="flex items-center justify-between mb-4">
            <Ticket className="text-[#fa7517]" size={24} />
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#fa7517] transition-colors" />
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Pass sales</h3>
          <p className="text-sm text-gray-300">
            Sales, buyers and earnings from your passes are in Business.
          </p>
          <p className="text-sm text-[#fa7517] mt-2">Open Business</p>
        </Link>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={ThumbsUp}
          title="Interaction rate"
          value={interaction.valueText}
          valueMuted={interaction.rate === null}
          loading={loading.growthMetrics}
          subtitle={`${interaction.countsText}, ${phrase}`}
          note={joinNotes(interaction.noRateNote, OWN_REPLIES_NOTE)}
          error={interactionError ? "Error loading interactions" : undefined}
        />

        <StatsCard
          icon={TrendingUp}
          title="Avg. % watched"
          value={formatPercent(averagePercentWatched)}
          loading={loading.channelWatchPatterns}
          subtitle={`Share of each video watched, ${phrase}`}
          note={COUNTED_VIEWS_NOTE}
          error={completionRateError ? "Error loading watch depth" : undefined}
        />

        <StatsCard
          icon={MessageCircle}
          title="Comments"
          value={totalComments.toLocaleString()}
          loading={loading.engagementTrends}
          subtitle={inPeriod}
          note={OWN_REPLIES_NOTE}
          error={commentsError ? "Error loading comments" : undefined}
        />

        <StatsCard
          icon={ThumbsUp}
          title="Likes"
          value={totalLikes.toLocaleString()}
          loading={loading.engagementTrends}
          subtitle={inPeriod}
          error={commentsError ? "Error loading likes" : undefined}
        />
      </div>

      {/* Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Growth Trends</h3>
          {loading.growthMetrics ? <p role="status">Loading growth…</p>
            : errors.growthMetrics ? <p role="alert">Unable to load growth trends.</p>
            : <GrowthChart data={growthMetrics?.metrics} period={period} />}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Views by hour of day (UTC)</h3>
          <p className="text-sm text-gray-400">
            Number of counted views in each hour of the day, {phrase}. Hours are UTC, not your local time.
          </p>
          {loading.channelWatchPatterns ? <p role="status">Loading views by hour…</p>
            : errors.channelWatchPatterns ? <p role="alert">Unable to load views by hour.</p>
            : <WatchTimeChart
            data={
              // Ensure all 24 hours are represented
              Array.from({ length: 24 }, (_, hour) => {
                const hourData = viewsByHour.find(d => d.hour === hour);
                return {
                  hour,
                  viewCount: hourData?.viewCount || 0
                };
              })
            }
          />}
        </div>
      </div>
    </div>
  );
};

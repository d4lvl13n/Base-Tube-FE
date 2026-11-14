import React, { useState } from 'react';
import {
  Users,
  TrendingUp,
  Play,
  Clock
} from 'lucide-react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import { useChannelData } from '../../../../../hooks/useChannelData';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { GrowthChart } from '../charts/GrowthChart';
import {
  OWN_REPLIES_NOTE,
  accurateSinceNote,
  formatWatchTime,
  interactionRateView,
  joinNotes,
  periodComparisonCaption,
  periodPhrase,
  readCount
} from '../metrics';

// "Growth Milestones" used to sit here: progress bars towards 1,000 / 4,000 /
// 10,000 watch hours and 100 / 1,000 subscribers, copied from YouTube's partner
// programme ladder. BaseTube has no such programme, so the bars promised
// thresholds that unlock nothing. Removed rather than relabelled — the cards
// above already show the same totals.

export const GrowthTab: React.FC<{ channelId: string; channelName?: string }> = ({
  channelId,
  channelName
}) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  const {
    growthMetrics,
    detailedViewMetrics,
    creatorWatchHours,
    isLoading: analyticsLoading,
    loading,
    errors,
  } = useCreatorAnalytics(period, channelId);

  const {
    channel,
    isLoading: channelLoading
  } = useChannelData(channelId ? parseInt(channelId) : undefined);

  const isLoading = analyticsLoading || channelLoading;

  // Just switch the period; every period-sensitive query has it in its key.
  const handlePeriodChange = (newPeriod: '7d' | '30d' | 'all') => {
    if (newPeriod !== period) setPeriod(newPeriod);
  };

  // The three big numbers are ALL-TIME. A period comparison is only ever shown
  // in words that name the period ("+2 in the last 7 days (0 the week
  // before)") — never as a bare percentage badge on an all-time figure.
  const subscribers = channel?.subscribers_count ?? 0;
  const views = detailedViewMetrics?.totalViews ?? 0;
  const growthData = growthMetrics?.metrics;
  const days = period === '7d' ? 7 : 30;
  const phrase = periodPhrase(period);

  const comparison = (series?: { total?: number; previousTotal?: number | null }) =>
    period === 'all'
      ? null
      : periodComparisonCaption({
          current: readCount(series?.total),
          previous: readCount(series?.previousTotal),
          days
        });

  // Same definition as the dashboard and the Overview card: likes + comments
  // and counted views of ONE window (the growth response). Counts always, a
  // rate only from 100 views; the window before is described the same way.
  const interaction = interactionRateView(growthData?.engagement.total, growthData?.views.total);
  const previousInteractions = readCount(growthData?.engagement.previousTotal);
  const previousViews = readCount(growthData?.views.previousTotal);
  const before = days === 7 ? 'The week before' : `The ${days} days before`;
  const previous =
    period === 'all' || previousInteractions === null || previousViews === null
      ? null
      : interactionRateView(previousInteractions, previousViews);
  const previousRateNote = previous
    ? `${before}: ${previous.rate === null ? 'too few views for a rate' : previous.valueText} (${previous.countsText})`
    : null;

  // Specific error checks
  const growthError = errors.growthMetrics;
  const viewsError = errors.detailedViewMetrics;
  const watchHoursError = errors.allTimeWatchHours || (period !== 'all' && errors.periodWatchHours);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Channel Growth</h2>
          <p className="text-gray-400">
            Subscribers, views and watch time for {channelName ? <span className="text-white">{channelName}</span> : 'this channel'} only
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="animate-spin">
              <TrendingUp className="w-4 h-4 text-[#fa7517]" />
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

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Users}
          title="Total subscribers"
          value={subscribers.toLocaleString()}
          loading={channelLoading || (period !== 'all' && loading.growthMetrics)}
          subtitle={comparison(growthData?.subscribers) ?? 'Subscribed today'}
          error={(period !== 'all' && growthError) || !channel ? "Error loading subs/trend" : undefined}
        />

        <StatsCard
          icon={Play}
          title="Total views"
          value={views.toLocaleString()}
          loading={loading.detailedViewMetrics || (period !== 'all' && loading.growthMetrics)}
          subtitle={comparison(growthData?.views) ?? 'All time'}
          error={(period !== 'all' && growthError) || viewsError ? "Error loading views/trend" : undefined}
        />

        <StatsCard
          icon={Clock}
          title="Total watch time"
          value={formatWatchTime(creatorWatchHours.totalSeconds, creatorWatchHours.total)}
          loading={loading.allTimeWatchHours || (period !== 'all' && loading.periodWatchHours)}
          subtitle={period === 'all'
            ? 'Time played, all time'
            : `${formatWatchTime(creatorWatchHours.periodSeconds, creatorWatchHours.periodTotal)} in ${phrase}`}
          note={joinNotes(accurateSinceNote(creatorWatchHours.accurateSince))}
          error={watchHoursError ? "Error loading watch hours" : undefined}
        />

        <StatsCard
          icon={TrendingUp}
          title="Interaction rate"
          value={interaction.valueText}
          valueMuted={interaction.rate === null}
          loading={loading.growthMetrics}
          subtitle={`${interaction.countsText}, ${phrase}`}
          note={joinNotes(interaction.noRateNote, previousRateNote, OWN_REPLIES_NOTE)}
          error={growthError ? "Error loading engagement" : undefined}
        />
      </div>

      {/* Growth Chart */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Growth Trends</h3>
        <div className="p-4 bg-black/50 rounded-xl border border-gray-800/50">
          {loading.growthMetrics ? <p role="status">Loading growth…</p>
            : errors.growthMetrics ? <p role="alert">Unable to load growth trends.</p>
            : <GrowthChart data={growthMetrics?.metrics} period={period} />}
        </div>
      </div>
    </div>
  );
};

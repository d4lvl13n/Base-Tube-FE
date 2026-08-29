import React from 'react';
import { useChannelInsights } from '../../../../../hooks/useAnalyticsData';
import type { InsightsPeriod } from '../../../../../types/insights';
import { InsightsView } from './InsightsView';

/*
 * The Insights tab, connected.
 *
 * Everything visual lives in InsightsView, which is pure and is what the dev
 * preview route renders from fixtures. This file is only the wiring: the query,
 * the 202 polling, the regeneration budget. Keeping them apart is what lets the
 * layout be reviewed without a backend and without an account.
 */

export const ChannelInsightsCard: React.FC<{
  channelId: string;
  period: InsightsPeriod;
  /** Rendered in the title; omitted when the caller has no channel record. */
  channelName?: string;
  /** When given, the period selector is shown in the header. */
  onPeriodChange?: (period: InsightsPeriod) => void;
}> = ({ channelId, period, channelName, onPeriodChange }) => {
  const {
    insights,
    meta,
    isGenerating,
    isLoading,
    error,
    regenerate,
    isRegenerating,
    regenerateError,
  } = useChannelInsights(channelId, period);

  return (
    <InsightsView
      insights={insights}
      channelName={channelName}
      period={period}
      onPeriodChange={onPeriodChange}
      isLoading={isLoading}
      isGenerating={isGenerating}
      error={error}
      regenerate={regenerate}
      isRegenerating={isRegenerating}
      regenerateError={regenerateError}
      refreshRemaining={meta?.refreshRemaining ?? 0}
    />
  );
};

export default ChannelInsightsCard;

import React, { useState } from 'react';
import { useChannelSelection } from '../../../../../contexts/ChannelSelectionContext';
import { ChannelInsightsCard } from '../insights/ChannelInsightsCard';
import type { InsightsPeriod } from '../../../../../types/insights';

/**
 * Insights v2 as its own tab.
 *
 * The tab owns the period only. The title, the coverage sentence and the
 * regenerate control all belong to the report itself, so they live in the card
 * where the data that fills them is — a tab header that says "AI Insights" over
 * a card that says what it measured is one heading too many.
 */
export const AIInsightsTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<InsightsPeriod>('7d');
  const { selectedChannel } = useChannelSelection();

  return (
    <ChannelInsightsCard
      channelId={channelId}
      period={period}
      channelName={selectedChannel?.name}
      onPeriodChange={setPeriod}
    />
  );
};

export default AIInsightsTab;

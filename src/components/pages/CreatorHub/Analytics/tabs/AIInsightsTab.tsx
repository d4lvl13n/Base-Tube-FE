import React, { useState } from 'react';
import { Select } from '../../../../ui/Select';
import { ChannelInsightsCard } from '../insights/ChannelInsightsCard';

type Period = '7d' | '30d' | 'all';

/**
 * Insights v2 as its own tab (the owner's call): the card keeps its coverage
 * strip, so it still says what it was computed from.
 */
export const AIInsightsTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<Period>('7d');
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">AI Insights</h2>
          <p className="text-gray-400">What the data supports, and only that</p>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
          options={[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: 'all', label: 'All Time' },
          ]}
        />
      </div>
      <ChannelInsightsCard channelId={channelId} period={period} />
    </div>
  );
};

export default AIInsightsTab;

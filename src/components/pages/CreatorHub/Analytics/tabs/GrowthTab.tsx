import React, { useState } from 'react';
import { useAnalyticsData } from '../../../../../hooks/useAnalyticsData';
import { GrowthChart } from '../charts/GrowthChart';
import { Select } from '../../../../ui/Select';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Users, Play, MessageCircle } from 'lucide-react';

export const GrowthTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const { growthMetrics, isLoading } = useAnalyticsData(period, channelId);

  const subscribersTotal = growthMetrics?.metrics.subscribers.total ?? 0;
  const subscribersTrend = growthMetrics?.metrics.subscribers.trend ?? 0;
  const viewsTotal = growthMetrics?.metrics.views.total ?? 0;
  const viewsTrend = growthMetrics?.metrics.views.trend ?? 0;
  const engagementTotal = growthMetrics?.metrics.engagement.total ?? 0;
  const engagementTrend = growthMetrics?.metrics.engagement.trend ?? 0;

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Growth Overview</h2>
        <p className="text-gray-400">
          Analyze your channel's growth over time, including subscribers, views, and engagement metrics.
        </p>
      </div>
      <div className="flex justify-end">
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as '7d' | '30d')}
          options={[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Users}
          title="Subscribers"
          value={subscribersTotal.toString()}
          change={subscribersTrend}
          loading={isLoading}
        />
        <StatsCard
          icon={Play}
          title="Views"
          value={viewsTotal.toString()}
          change={viewsTrend}
          loading={isLoading}
        />
        <StatsCard
          icon={MessageCircle}
          title="Engagement"
          value={engagementTotal.toString()}
          change={engagementTrend}
          loading={isLoading}
        />
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Growth Trends</h3>
        <GrowthChart data={growthMetrics?.metrics} />
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { MessageCircle, Clock, ThumbsUp, Users } from 'lucide-react';
import { useAnalyticsData } from '../../../../../hooks/useAnalyticsData';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { WatchTimeChart } from '../charts/WatchTimeChart';

export const AudienceEngagementTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const { 
    socialMetrics, 
    growthMetrics,
    watchPatterns,
    isLoading 
  } = useAnalyticsData(period, channelId);

  const engagementData = {
    comments: {
      received: socialMetrics?.interactions.commentsReceived ?? 0,
      responseRate: socialMetrics?.interactions.responseRate ?? 0,
      responseTime: socialMetrics?.interactions.averageResponseTime ?? 0
    },
    engagement: {
      rate: growthMetrics?.metrics.engagement.total ?? 0,
      trend: growthMetrics?.metrics.engagement.trend ?? 0
    },
    watchTime: {
      peakHours: watchPatterns?.peakHours ?? [],
      completionRate: watchPatterns?.completionRates.overall ?? 0
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Audience Engagement</h2>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as '7d' | '30d')}
          options={[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={MessageCircle}
          title="Comments"
          value={engagementData.comments.received.toLocaleString()}
          change={engagementData.comments.responseRate}
          loading={isLoading}
          subtitle="Response rate"
        />
        <StatsCard
          icon={Clock}
          title="Avg Response Time"
          value={`${engagementData.comments.responseTime}h`}
          change={0}
          loading={isLoading}
          subtitle="Time to reply"
        />
        <StatsCard
          icon={ThumbsUp}
          title="Engagement Rate"
          value={`${engagementData.engagement.rate}%`}
          change={engagementData.engagement.trend}
          loading={isLoading}
          subtitle={`Growth over ${period}`}
        />
        <StatsCard
          icon={Users}
          title="Completion Rate"
          value={`${engagementData.watchTime.completionRate}%`}
          change={0}
          loading={isLoading}
          subtitle="Video completion"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Peak Engagement Hours</h3>
        <WatchTimeChart data={engagementData.watchTime.peakHours} />
      </div>
    </div>
  );
};
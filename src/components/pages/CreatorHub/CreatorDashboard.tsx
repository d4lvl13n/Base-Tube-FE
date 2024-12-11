import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';
import { Users, Play, Clock, MessageCircle } from 'lucide-react';
import { Channel } from '../../../types/channel';
import { useAnalyticsData } from '../../../hooks/useAnalyticsData';
import { useChannelData } from '../../../hooks/useChannelData';

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
    isLoading: analyticsLoading 
  } = useAnalyticsData('7d', selectedChannelId);

  const {
    channel: activeChannel,
    isLoading: channelLoading
  } = useChannelData(selectedChannelId ? parseInt(selectedChannelId) : undefined);

  const isLoading = analyticsLoading || channelLoading;

  const formatMetrics = {
    subscribers: activeChannel?.subscribers_count.toLocaleString() ?? '0',
    newSubscribers: growthMetrics?.metrics.subscribers.total.toLocaleString() ?? '0',
    views: growthMetrics?.metrics.views.total.toLocaleString() ?? '0',
    watchTime: creatorWatchHours.toLocaleString(),
    engagement: `${growthMetrics?.metrics.engagement.total.toLocaleString()}%` ?? '0%'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto"
    >
      <div className="mb-12">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-3">
          Welcome back, {username}!
        </h1>
        <p className="text-gray-400 text-lg">Here's how your content is performing</p>
      </div>

      {activeChannel && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard 
          icon={Users} 
          title="Total Subscribers" 
          value={formatMetrics.subscribers}
          change={growthMetrics?.metrics.subscribers.trend ?? 0}
          loading={isLoading}
          subtitle={`+${formatMetrics.newSubscribers} new in last 7 days`}
        />
        <StatsCard 
          icon={Play} 
          title="Total Views" 
          value={formatMetrics.views}
          change={growthMetrics?.metrics.views.trend ?? 0}
          loading={isLoading}
          subtitle="Growth over 7 days"
        />
        <StatsCard 
          icon={Clock} 
          title="Watch Time" 
          value={formatMetrics.watchTime}
          change={0}
          loading={isLoading}
          subtitle="Total hours watched"
        />
        <StatsCard 
          icon={MessageCircle} 
          title="Engagement Rate" 
          value={formatMetrics.engagement}
          change={growthMetrics?.metrics.engagement.trend ?? 0}
          loading={isLoading}
          subtitle="Growth over 7 days"
        />
      </div>
    </motion.div>
  );
};

export default CreatorDashboard;
import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Play,
  Clock,
  Target
} from 'lucide-react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import { useChannelData } from '../../../../../hooks/useChannelData';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { GrowthChart } from '../charts/GrowthChart';

// Milestone component
const MilestoneCard: React.FC<{ 
  title: string; 
  current: number; 
  goal: number;
  unit: string;
  icon: React.ReactNode;
}> = ({ title, current, goal, unit, icon }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="bg-black/50 p-5 rounded-xl border border-gray-800/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-[#fa7517]">
          {icon}
        </div>
        <h4 className="font-medium">{title}</h4>
      </div>
      
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-gray-400">Current: {current.toLocaleString()} {unit}</span>
        <span className="text-gray-400">Goal: {goal.toLocaleString()} {unit}</span>
      </div>
      
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#fa7517] to-yellow-500" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="mt-3 text-sm text-center">
        {percentage < 100 ? (
          <span className="text-gray-300">
            {percentage.toFixed(1)}% Complete ({(goal - current).toLocaleString()} {unit} to go)
          </span>
        ) : (
          <span className="text-green-400">Milestone achieved! 🎉</span>
        )}
      </div>
    </div>
  );
};

export const GrowthTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [isChangingPeriod, setIsChangingPeriod] = useState(false);
  
  const { 
    growthMetrics, 
    detailedViewMetrics,
    creatorWatchHours,
    isLoading: analyticsLoading,
    errors,
    invalidateAnalytics
  } = useCreatorAnalytics(period, channelId);

  const { 
    channel,
    isLoading: channelLoading 
  } = useChannelData(channelId ? parseInt(channelId) : undefined);
  
  const isLoading = analyticsLoading || channelLoading;

  // Handle period change with cache invalidation
  const handlePeriodChange = async (newPeriod: '7d' | '30d' | 'all') => {
    if (newPeriod !== period) {
      setIsChangingPeriod(true);
      // Invalidate cache to force fresh data load
      await invalidateAnalytics();
      setPeriod(newPeriod);
      
      // Give some time for the UI to show loading state
      setTimeout(() => {
        setIsChangingPeriod(false);
      }, 1000);
    }
  };

  // Channel stats
  const subscribers = channel?.subscribers_count ?? 0;
  const views = detailedViewMetrics?.totalViews ?? 0;
  const watchHours = creatorWatchHours.total;

  // Use growthMetrics directly for engagement rate and trend
  const engagementRate = growthMetrics?.metrics.engagement.total ?? 0;
  // Engagement trend will be handled conditionally based on period

  // Growth milestones (for platform features and visibility)
  const growthMilestones = {
    subscriberMilestones: [100, 1000, 5000, 10000],
    viewMilestones: [1000, 10000, 50000, 100000],
    watchHourMilestones: [1000, 4000, 10000, 30000]
  };

  // Find the next milestone
  const getNextMilestone = (current: number, milestones: number[]) => {
    return milestones.find(milestone => milestone > current) || milestones[milestones.length - 1];
  };

  // For display strings
  const periodString = period === '7d' ? '7 days' : period === '30d' ? '30 days' : 'all time';

  // Specific error checks
  const growthError = errors.growthMetrics;
  const viewsError = errors.detailedViewMetrics;
  const watchHoursError = errors.allTimeWatchHours || errors.periodWatchHours; 
  const growthData = growthMetrics?.metrics;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Channel Growth</h2>
          <p className="text-gray-400">Track growth metrics and milestone progress</p>
        </div>
        <div className="flex items-center gap-2">
          {(isLoading || isChangingPeriod) && (
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
          title="Subscribers"
          value={subscribers.toLocaleString()}
          // Hide change if period is 'all' (trend is 0/null)
          change={period === 'all' || growthData?.subscribers.trend == null || growthData?.subscribers.trend === 0 
            ? 0 
            : Math.round(growthData.subscribers.trend)}
          loading={isLoading}
          subtitle={period === 'all' 
            ? 'Total Subscribers' // Show total when 'all' is selected
            : `${(growthData?.subscribers.total ?? 0).toLocaleString()} new in ${periodString}`}
          error={growthError || !channel ? "Error loading subs/trend" : undefined}
        />
        
        <StatsCard
          icon={Play}
          title="Video Views"
          value={views.toLocaleString()}
          // Hide change if period is 'all' (trend is 0/null)
          change={period === 'all' || growthData?.views.trend == null || growthData?.views.trend === 0 
            ? 0 
            : Math.round(growthData.views.trend)}
          loading={isLoading}
          subtitle={period === 'all'
            ? 'Total Views' // Show total when 'all' is selected
            : `${detailedViewMetrics?.viewsByPeriod?.[period === '7d' ? 'last7d' : 'last30d']?.toLocaleString() ?? 'N/A'} in ${periodString}`
          }
          error={growthError || viewsError ? "Error loading views/trend" : undefined}
        />
        
        <StatsCard
          icon={Clock}
          title="Watch Hours"
          value={creatorWatchHours.formattedHours}
          change={0} // No trend here
          loading={isLoading}
          subtitle={period === 'all' 
            ? 'Total Watch Hours' // Show total when 'all' is selected
            : `${creatorWatchHours.periodTotal.toFixed(1)} hours in ${periodString}`}
          error={watchHoursError ? "Error loading watch hours" : undefined}
        />
        
        <StatsCard
          icon={TrendingUp}
          title="Engagement"
          value={`${engagementRate.toFixed(1)}%`}
          // Hide change if period is 'all' (trend is 0/null)
          change={period === 'all' || growthData?.engagement.trend == null || growthData?.engagement.trend === 0 
            ? 0 
            : Math.round(growthData.engagement.trend)}
          loading={isLoading}
          subtitle={`For ${periodString}`} // Subtitle reflects selected period
          error={growthError ? "Error loading engagement" : undefined}
        />
      </div>

      {/* Growth Chart & Growth Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Growth Trends</h3>
          <div className="p-4 bg-black/50 rounded-xl border border-gray-800/50">
            <GrowthChart data={growthMetrics?.metrics} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Growth Milestones</h3>
          <div className="space-y-4">
            <MilestoneCard
              title="Subscriber Growth"
              current={subscribers}
              goal={getNextMilestone(subscribers, growthMilestones.subscriberMilestones)}
              unit="subscribers"
              icon={<Users className="w-5 h-5" />}
            />
            
            <MilestoneCard
              title="View Count"
              current={views}
              goal={getNextMilestone(views, growthMilestones.viewMilestones)}
              unit="views"
              icon={<Play className="w-5 h-5" />}
            />
            
            <MilestoneCard
              title="Watch Time"
              current={watchHours}
              goal={getNextMilestone(watchHours, growthMilestones.watchHourMilestones)}
              unit="watch hours"
              icon={<Clock className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 
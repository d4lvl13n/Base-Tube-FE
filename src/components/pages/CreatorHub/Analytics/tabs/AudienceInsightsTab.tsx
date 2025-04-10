import React, { useState } from 'react';
import { 
  Users, 
  Globe, 
  Clock, 
  CalendarClock,
  TrendingUp, 
  BarChart,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { WatchTimeChart } from '../charts/WatchTimeChart';

// Bar chart component for demographic data visualization
const DemographicBarChart: React.FC<{ 
  data: { name: string; value: number; color?: string }[];
  title: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="space-y-2">
      <h4 className="text-base font-medium text-gray-300">{title}</h4>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span>{item.value}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded overflow-hidden">
              <div 
                className={`h-full ${item.color || 'bg-[#fa7517]'}`} 
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AudienceInsightsTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [isChangingPeriod, setIsChangingPeriod] = useState(false);
  
  const { 
    channelWatchPatterns,
    detailedViewMetrics,
    demographics,
    isLoading,
    errors,
    invalidateAnalytics
  } = useCreatorAnalytics(period, channelId);

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

  // Map weekday patterns for a weekly view chart
  const watchTimeByDay = channelWatchPatterns?.weekdayPatterns?.map(pattern => ({
    day: getDayName(pattern.dayOfWeek),
    views: pattern.viewCount
  })) ?? [];

  // Get the top location from real data
  const topLocation = demographics?.geoDistribution?.[0] || { country: 'Unknown', percentage: 0, viewCount: 0 };

  // Organizing data for demographic charts from real API data
  const countryData = demographics?.geoDistribution?.map(country => ({
    name: country.country,
    value: country.percentage
  })) ?? [];

  const deviceData = demographics?.deviceUsage?.map(device => {
    // Custom colors based on device type
    let color = 'bg-[#fa7517]';
    if (device.type.toLowerCase().includes('mobile')) {
      color = 'bg-green-500';
    } else if (device.type.toLowerCase().includes('desktop')) {
      color = 'bg-blue-500';
    } else if (device.type.toLowerCase().includes('tablet')) {
      color = 'bg-purple-500';
    }
    
    return {
      name: device.type,
      value: device.percentage,
      color
    };
  }) ?? [];

  // Get device icon based on type
  const getDeviceIcon = (type: string) => {
    type = type.toLowerCase();
    if (type.includes('mobile')) return Smartphone;
    if (type.includes('desktop')) return Monitor;
    if (type.includes('tablet')) return Tablet;
    return Globe;
  };

  // Get the primary device
  const primaryDevice = demographics?.deviceUsage?.[0] || { type: 'Unknown', percentage: 0, viewCount: 0 };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Audience Insights</h2>
          <p className="text-gray-400">Understand who is watching your content</p>
        </div>
        <div className="flex items-center gap-2">
          {(isLoading || isChangingPeriod) && (
            <div className="animate-spin">
              <Users className="w-4 h-4 text-[#fa7517]" />
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

      {/* Audience Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Globe}
          title="Top Location"
          value={topLocation.country}
          change={0}
          loading={isLoading}
          subtitle={`${topLocation.percentage}% of viewers`}
          error={errors.demographics ? "Error loading location" : undefined}
        />
        
        <StatsCard
          icon={Clock}
          title="Avg Watch Duration"
          value={`${((channelWatchPatterns?.durationStats?.averageWatchDuration ?? 0) / 60).toFixed(1)}m`}
          change={0}
          loading={isLoading}
          subtitle={`${(detailedViewMetrics?.completedViews ?? 0).toLocaleString()} completed views`}
          error={errors.channelWatchPatterns || errors.detailedViewMetrics ? "Error loading duration/views" : undefined}
        />
        
        <StatsCard
          icon={getDeviceIcon(primaryDevice.type)}
          title="Primary Device"
          value={primaryDevice.type}
          change={0}
          loading={isLoading}
          subtitle={`${primaryDevice.percentage}% of viewers`}
          error={errors.demographics ? "Error loading device" : undefined}
        />
      </div>

      {/* Audience Demographics */}
      <div className="p-6 bg-black/50 rounded-xl">
        <h3 className="text-xl font-semibold mb-4">Audience Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">          
          <DemographicBarChart 
            title={`Geographic Distribution (${period === '7d' ? '7 days' : period === '30d' ? '30 days' : 'all time'})`} 
            data={countryData} 
          />
          
          <DemographicBarChart 
            title={`Device Usage (${period === '7d' ? '7 days' : period === '30d' ? '30 days' : 'all time'})`} 
            data={deviceData} 
          />
        </div>
      </div>

      {/* Viewing Patterns */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Viewing Patterns</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 bg-black/50 rounded-xl">
            <h4 className="text-base font-medium text-gray-300 mb-4">Watch Time by Hour</h4>
            <WatchTimeChart 
              data={Array.from({ length: 24 }, (_, hour) => {
                const hourData = channelWatchPatterns?.hourlyPatterns?.find(d => d.hour === hour);
                return {
                  hour,
                  viewCount: hourData?.viewCount || 0
                };
              })}
            />
          </div>
          
          <div className="p-6 bg-black/50 rounded-xl">
            <h4 className="text-base font-medium text-gray-300 mb-4">Watch Time by Day of Week</h4>
            <div className="h-64 flex items-end justify-between px-4">
              {watchTimeByDay.map((day, index) => {
                const maxViews = Math.max(...watchTimeByDay.map(d => d.views));
                const percentage = maxViews ? (day.views / maxViews) * 100 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-10 bg-gradient-to-t from-[#fa7517] to-[#fa7517]/70 rounded-t" 
                      style={{ height: `${percentage}%` }}
                    />
                    <div className="mt-2 text-sm text-gray-400">{day.day.substring(0, 3)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex % 7];
}

function getMaxViewDay(data: { day: string; views: number }[]): { day: string; views: number } {
  if (!data.length) return { day: 'N/A', views: 0 };
  
  return data.reduce((max, current) => {
    return current.views > max.views ? current : max;
  }, data[0]);
} 
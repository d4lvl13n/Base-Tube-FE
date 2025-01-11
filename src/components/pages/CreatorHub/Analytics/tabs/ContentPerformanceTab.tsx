import React, { useState } from 'react';
import { Clock, Play, TrendingUp } from 'lucide-react';
import { useAnalyticsData } from '../../../../../hooks/useAnalyticsData';
import { WatchTimeChart } from '../charts/WatchTimeChart';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { getChannelVideos } from '../../../../../api/channel';
import { useQuery } from '@tanstack/react-query';
import { formatDuration } from '../../../../../utils/format';
import { Video } from '../../../../../types/video';

export const ContentPerformanceTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const { 
    watchPatterns, 
    creatorWatchHours,
    detailedViewMetrics,
    isLoading: metricsLoading 
  } = useAnalyticsData(period, channelId);

  const { 
    data: channelVideos,
    isLoading: videosLoading
  } = useQuery({
    queryKey: ['channelVideos', channelId],
    queryFn: () => getChannelVideos(channelId),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = metricsLoading || videosLoading;

  const performanceData = {
    watchTime: {
      total: creatorWatchHours ?? 0,
      timeFrames: watchPatterns?.timeFrames?.daily ?? {
        watchTimeHours: 0,
        videosWatched: 0,
        completionRate: 0
      }
    },
    completion: {
      overall: watchPatterns?.completionRates?.overall ?? 0,
      byDuration: watchPatterns?.completionRates?.byDuration ?? {
        short: 0,
        medium: 0,
        long: 0
      }
    },
    views: {
      total: detailedViewMetrics?.totalViews ?? 0,
      weeklyChange: detailedViewMetrics?.viewsByPeriod ? 
        ((detailedViewMetrics.viewsByPeriod.last7d / 
          detailedViewMetrics.viewsByPeriod.last30d) - 1) * 100 : 0
    },
    recentVideos: channelVideos?.data ?? []
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Content Performance</h2>
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
          icon={Clock}
          title="Watch Time"
          value={`${performanceData.watchTime.total}h`}
          change={0}
          loading={isLoading}
          subtitle={`${performanceData.watchTime.timeFrames.videosWatched} videos watched`}
        />
        <StatsCard
          icon={Play}
          title="Total Views"
          value={performanceData.views.total.toLocaleString()}
          change={performanceData.views.weeklyChange}
          loading={isLoading}
          subtitle="Monthly trend"
        />
        <StatsCard
          icon={TrendingUp}
          title="Completion Rate"
          value={`${performanceData.completion.overall}%`}
          change={0}
          loading={isLoading}
          subtitle="Average across all videos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Watch Time Distribution</h3>
          <WatchTimeChart data={watchPatterns?.peakHours ?? []} />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Recent Videos Performance</h3>
          <div className="bg-black/50 rounded-xl p-4">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-sm">
                  <th className="text-left py-2">Video</th>
                  <th className="text-right py-2">Views</th>
                  <th className="text-right py-2">Length</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.recentVideos.map((video: Video) => (
                  <tr key={video.id} className="border-t border-gray-800">
                    <td className="py-3 truncate max-w-[200px]">{video.title}</td>
                    <td className="text-right text-[#fa7517]">
                      {video.views?.toLocaleString() ?? '0'}
                    </td>
                    <td className="text-right text-blue-400">
                      {formatDuration(video?.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
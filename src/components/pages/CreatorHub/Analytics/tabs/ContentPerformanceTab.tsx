import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  TrendingUp,
  ExternalLink,
  BarChart2,
  Loader as LoaderIcon,
  Star,
  Info
} from 'lucide-react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import { WatchTimeChart } from '../charts/WatchTimeChart';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { getVideoById } from '../../../../../api/video';
import {
  DURATION_BUCKET_LABELS,
  DURATION_BUCKET_ORDER,
  formatPercent,
  weightedPercentWatched
} from '../metrics';

export const ContentPerformanceTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  
  const {
    channelWatchPatterns,
    detailedViewMetrics,
    isLoading: metricsLoading,
    errors,
  } = useCreatorAnalytics(period, channelId);

  const watchPatternsError = errors.channelWatchPatterns;
  const viewsError = errors.detailedViewMetrics;

  const isLoading = metricsLoading;

  // Handle period change with cache invalidation
  // Just switch the period. Every period-sensitive query has the period in
  // its key, so React Query fetches the new key by itself. Invalidating the
  // whole channel first (what this used to do) also refetched the OLD
  // period's queries — ~19 requests for one click on the selector.
  const handlePeriodChange = (newPeriod: '7d' | '30d' | 'all') => {
    if (newPeriod !== period) setPeriod(newPeriod);
  };

  // For display strings
  const periodString = period === '7d' ? '7 days' : period === '30d' ? '30 days' : 'all time';

  // There used to be a `viewTrend` here: last-vs-first point of the LIKE series,
  // falling back to 7d/30d views, a ratio of a window to a window that contains
  // it and is therefore always <= 0. It rendered as a permanent red "down"
  // badge on Total Views. Deleted — no trend source exists for this card
  // (docs/ANALYTICS_REVIEW_2026-08-29.md finding 8).
  const performanceData = {
    watchTime: {
      // Use channel-specific watch hours data from durationStats
      total: channelWatchPatterns?.durationStats?.averageWatchDuration ?? 0,
      timeFrames: {
        // Calculate watch time in hours from avgWatchSeconds in hourlyPatterns
        watchTimeHours: 
          channelWatchPatterns?.hourlyPatterns?.reduce(
            (total, pattern) => total + (pattern.avgWatchSeconds / 3600), 
            0
          ) ?? 0,
        videosWatched: channelWatchPatterns?.durationStats?.totalViews ?? 0,
        completionRate: weightedPercentWatched(channelWatchPatterns?.retentionByDuration)
      }
    },
    completion: {
      // Weighted by the views in each bucket.
      overall: weightedPercentWatched(channelWatchPatterns?.retentionByDuration)
    },
    views: {
      total: detailedViewMetrics?.totalViews ?? 0
    },
    // Use hourlyPatterns for peak hours data
    peakHours: channelWatchPatterns?.hourlyPatterns?.map(pattern => ({
      hour: pattern.hour,
      viewCount: pattern.viewCount
    })) ?? []
  };

  // Fetch thumbnails for top retained videos when data is available
  useEffect(() => {
    const fetchThumbnails = async () => {
      if (!channelWatchPatterns?.topRetainedVideos?.length) return;
      
      const newThumbnails: Record<string, string> = {};
      
      // Create promises for all video thumbnail fetches
      const thumbnailPromises = channelWatchPatterns.topRetainedVideos.map(async (video) => {
        try {
          // If we already have this thumbnail cached, skip fetching
          if (videoThumbnails[video.videoId]) return;
          
          // Fetch video details to get the thumbnail
          const videoDetails = await getVideoById(video.videoId.toString());
          if (videoDetails?.thumbnail_url) {
            newThumbnails[video.videoId] = videoDetails.thumbnail_url;
          }
        } catch (error) {
          console.error(`Failed to fetch thumbnail for video ${video.videoId}:`, error);
        }
      });
      
      // Wait for all fetches to complete
      await Promise.all(thumbnailPromises);
      
      // Update state with new thumbnails
      if (Object.keys(newThumbnails).length > 0) {
        setVideoThumbnails(prev => ({
          ...prev,
          ...newThumbnails
        }));
      }
    };
    
    fetchThumbnails();
  }, [channelWatchPatterns?.topRetainedVideos]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Content Overview</h2>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="animate-spin">
              <Play className="w-4 h-4 text-[#fa7517]" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Clock}
          title="Avg Watch Duration"
          value={`${(performanceData.watchTime.total / 60).toFixed(1)}m`}
          loading={isLoading}
          subtitle={`${performanceData.watchTime.timeFrames.videosWatched.toLocaleString()} views in ${periodString}`}
          error={watchPatternsError ? 'Error loading watch patterns' : undefined}
        />
        <StatsCard
          icon={Play}
          title="Total Views"
          value={performanceData.views.total.toLocaleString()}
          loading={isLoading}
          subtitle="All time"
          error={viewsError ? 'Error loading views' : undefined}
        />
        <StatsCard
          icon={TrendingUp}
          title="Avg. % watched"
          value={formatPercent(performanceData.completion.overall)}
          loading={isLoading}
          subtitle="Weighted by views, all video lengths"
          error={watchPatternsError ? 'Error loading watch depth' : undefined}
        />
      </div>

      {/* Watch Time Distribution - Now Full Width */}
      <div className="space-y-4 bg-black/30 rounded-xl p-5 border border-[#fa7517]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-[#fa7517]" />
            <h3 className="text-xl font-semibold">Watch Time Distribution</h3>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <Info className="w-4 h-4 mr-1" />
            <span>When your audience is most active</span>
          </div>
        </div>
        <div className="h-80">
          <WatchTimeChart 
            data={
              // Sort the data by hour and ensure all 24 hours are represented
              Array.from({ length: 24 }, (_, hour) => {
                // Find the entry for this hour from channel-specific data
                const hourData = (performanceData.peakHours || [])
                  .find(entry => entry.hour === hour);
                
                return {
                  hour,
                  viewCount: hourData?.viewCount || 0
                };
              })
            } 
          />
        </div>
        <div className="mt-2 text-sm text-gray-400 bg-black/30 p-3 rounded">
          <div className="flex items-start">
            <div className="text-[#fa7517] mr-2 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <strong>Watch Time Distribution</strong> shows when your audience is most active throughout the day.
              Consider scheduling your new content releases to align with peak viewing hours to maximize initial visibility.
              Hours are bucketed server-side in UTC.
            </div>
          </div>
        </div>
      </div>

      {/* Video Retention Section - Now More Prominent */}
      <div className="space-y-4 bg-black/30 rounded-xl p-5 border border-[#fa7517]/20">
        <div className="flex items-center">
          <Star className="w-5 h-5 mr-2 text-[#fa7517]" />
          <h3 className="text-xl font-semibold">Videos with Highest Retention</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th className="text-left py-2 pl-2">Video</th>
                <th className="text-right py-2">Retention Rate</th>
                <th className="text-right py-2">Avg Watch Time</th>
                <th className="text-right py-2">Video Length</th>
                <th className="text-right py-2">Views</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="flex flex-col items-center">
                      <LoaderIcon className="w-8 h-8 text-[#fa7517] animate-spin mb-2" />
                      <span className="text-gray-400">Loading retention data...</span>
                    </div>
                  </td>
                </tr>
              ) : !channelWatchPatterns?.topRetainedVideos?.length ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <BarChart2 className="w-8 h-8 text-gray-600 mb-2" />
                      <span>No retention data available</span>
                    </div>
                  </td>
                </tr>
              ) : (
                channelWatchPatterns.topRetainedVideos.map(video => (
                  <tr key={video.videoId} className="border-t border-gray-800 hover:bg-black/30">
                    <td className="py-3 pl-2">
                      <div className="flex items-center">
                        <div className="w-16 h-9 rounded overflow-hidden mr-2 flex-shrink-0 bg-gray-800">
                          {videoThumbnails[video.videoId] ? (
                            <img
                              src={videoThumbnails[video.videoId]}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // Fall back to gradient background if image fails to load
                                target.style.display = 'none';
                                target.parentElement!.classList.add('bg-gradient-to-r', 'from-[#fa7517]/40', 'to-[#fa7517]/10');
                                
                                // Add play icon if it's not there
                                if (!target.parentElement!.querySelector('.play-icon')) {
                                  const playIcon = document.createElement('div');
                                  playIcon.className = 'play-icon flex items-center justify-center h-full w-full';
                                  const icon = document.createElement('div');
                                  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-[#fa7517]"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
                                  playIcon.appendChild(icon);
                                  target.parentElement!.appendChild(playIcon);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-[#fa7517]/40 to-[#fa7517]/10 flex items-center justify-center">
                              <Play className="w-4 h-4 text-[#fa7517]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <a
                            href={`/video/${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-[#fa7517] transition-colors truncate block"
                            title={video.title}
                          >
                            <div className="flex items-center">
                              <span className="truncate max-w-[120px] md:max-w-[220px]">{video.title}</span>
                              <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0 opacity-50" />
                            </div>
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-medium text-[#fa7517] whitespace-nowrap">
                      {video.retentionRate.toFixed(1)}%
                    </td>
                    <td className="text-right text-blue-400 whitespace-nowrap">
                      {(video.avgWatchDuration / 60).toFixed(2)}m
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {(video.videoLength / 60).toFixed(2)}m
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {video.viewCount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-sm text-gray-400 bg-black/30 p-3 rounded">
          <div className="flex items-start">
            <div className="text-[#fa7517] mr-2 mt-0.5">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <strong>Retention Rate</strong> shows the percentage of the video that viewers watch on average. 
              Higher retention rates indicate more engaging content that keeps viewers watching longer.
              Focus on understanding what makes your high-retention videos successful and apply those 
              techniques to future content. For detailed metrics of all videos, check the "Video Performance" tab.
            </div>
          </div>
        </div>
      </div>

      {/* Retention by Duration Section */}
      <div className="space-y-4 bg-black/30 rounded-xl p-5 border border-[#fa7517]/20">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-[#fa7517]" />
          <h3 className="text-xl font-semibold">Avg. % watched by video length</h3>
        </div>
        {/* Bucket boundaries come from creatorAnalyticsService: <=60s, <=300s,
            <=1200s, above. The labels used to read "under 3 min" / "3-10 min" /
            "over 10 min" and the very_short bucket was never rendered at all
            (docs/ANALYTICS_REVIEW_2026-08-29.md finding 12). */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DURATION_BUCKET_ORDER.map((category) => {
            const bucket = channelWatchPatterns?.retentionByDuration?.find(
              (item) => item.durationCategory === category
            );
            const rate = bucket && Number.isFinite(bucket.retentionRate)
              ? Math.min(100, Math.max(0, bucket.retentionRate))
              : null;

            return (
              <div key={category} className="bg-black/30 p-4 rounded-lg border border-gray-800/50">
                <h4 className="text-gray-400 mb-2">
                  <span className="text-xs">{DURATION_BUCKET_LABELS[category]}</span>
                </h4>
                <div className="text-2xl font-bold">{formatPercent(rate)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {bucket ? `${bucket.viewCount.toLocaleString()} views` : 'No views yet'}
                </div>
                <div className="h-2 w-full bg-gray-800 mt-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#fa7517]"
                    style={{ width: `${rate ?? 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-sm text-gray-400 bg-black/30 p-3 rounded">
          <div className="flex items-start">
            <div className="text-[#fa7517] mr-2 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <strong>Avg. % watched by video length</strong> shows how much of a video your audience gets through, for each video length.
              Use this data to optimize your future content strategy by focusing on durations that achieve the highest retention rates.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
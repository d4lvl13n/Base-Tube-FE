import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Clock,
  Award,
  Loader
} from 'lucide-react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { format, parseISO } from 'date-fns';
import { LineChart } from '../charts/LineChart';
import { getVideoById } from '../../../../../api/video';
import { formatPercent, sumCounts, weightedPercentWatched } from '../metrics';

// Video card component
const TopVideoCard: React.FC<{
  thumbnail: string;
  title: string;
  videoId: number | string;
  metric: { icon: React.ReactNode; value: string; label: string };
  secondaryMetric: { value: string; label: string };
}> = ({ thumbnail, title, videoId, metric, secondaryMetric }) => {
  const [loadedThumbnail, setLoadedThumbnail] = useState<string | null>(thumbnail);
  
  // Try to fetch thumbnail if not provided
  useEffect(() => {
    const fetchThumbnail = async () => {
      if (!thumbnail && videoId) {
        try {
          const videoDetails = await getVideoById(videoId.toString());
          if (videoDetails?.thumbnail_url) {
            setLoadedThumbnail(videoDetails.thumbnail_url);
          }
        } catch (error) {
          console.error(`Failed to fetch thumbnail for video ${videoId}:`, error);
        }
      }
    };
    
    fetchThumbnail();
  }, [thumbnail, videoId]);
  
  return (
    <div className="bg-black/30 rounded-lg overflow-hidden flex">
      <div className="w-24 h-16 flex-shrink-0 bg-gray-800">
        <img 
          src={loadedThumbnail || '/placeholder-thumbnail.jpg'} 
          alt="" 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-thumbnail.jpg';
          }}
        />
      </div>
      <div className="p-3 flex-grow min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{title}</h4>
        <div className="flex items-center mt-1">
          <div className="text-[#fa7517] mr-1">
            {metric.icon}
          </div>
          <span className="text-[#fa7517] font-medium mr-1">{metric.value}</span>
          <span className="text-gray-400 text-xs">{metric.label}</span>
        </div>
        <div className="text-gray-400 text-xs mt-1">
          {secondaryMetric.value} {secondaryMetric.label}
        </div>
      </div>
    </div>
  );
};

// Comment card component
const CommentCard: React.FC<{
  avatar: string;
  username: string;
  comment: string;
  likes: number;
  videoTitle: string;
  date: string;
}> = ({ avatar, username, comment, likes, videoTitle, date }) => {
  return (
    <div className="bg-black/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
          <img 
            src={avatar || '/placeholder-avatar.jpg'} 
            alt={username} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-avatar.jpg';
            }}
          />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-medium text-white">{username}</h4>
            <span className="text-xs text-gray-400">{format(parseISO(date), 'MMM d')}</span>
          </div>
          <p className="text-sm text-gray-300 mb-2">{comment}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center text-xs text-gray-400">
              <ThumbsUp className="w-3 h-3 mr-1 text-[#fa7517]" />
              <span>{likes} likes</span>
            </div>
            <div className="text-xs italic text-gray-500">
              on "{videoTitle}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-black/30 rounded-lg p-6 text-center">
    <p className="text-gray-400">{message}</p>
  </div>
);

// Loading component for charts
const ChartLoading: React.FC = () => (
  <div className="flex justify-center items-center h-[300px]">
    <Loader className="w-8 h-8 animate-spin text-gray-500" />
  </div>
);

// Function to safely format date, returning original string or index if invalid
const safeFormatDate = (dateString: string | undefined | null, index: number): string => {
  if (!dateString) return `Point ${index + 1}`; // Fallback if date string is null/undefined
  try {
    const dateObj = new Date(dateString);
    // Check if dateObj is a valid date
    if (!isNaN(dateObj.getTime())) {
      return format(dateObj, 'MMM d');
    }
  } catch (e) {
    // Catch potential errors during Date construction (though less likely)
    console.error(`Error parsing date string: ${dateString}`, e);
  }
  return `Point ${index + 1}`; // Fallback for invalid dates
};

export const EngagementAnalyticsTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  
  const { 
    channelWatchPatterns, 
    engagementTrends,
    topLikedContent,
    topSharedContent,
    topComments,
    isLoading,
    errors,
  } = useCreatorAnalytics(period, channelId);
  
  // Handle period change with cache invalidation
  // Just switch the period. Every period-sensitive query has the period in
  // its key, so React Query fetches the new key by itself. Invalidating the
  // whole channel first (what this used to do) also refetched the OLD
  // period's queries — ~19 requests for one click on the selector.
  const handlePeriodChange = (newPeriod: '7d' | '30d' | 'all') => {
    if (newPeriod !== period) setPeriod(newPeriod);
  };
  
  // Totals are the SUM over the selected window. They used to read the last
  // point of the series, so "Total Likes, 7 days" showed the likes on the most
  // recent active day (docs/ANALYTICS_REVIEW_2026-08-29.md finding 3).
  //
  // No trend badges here: the endpoint only returns the current window, so a
  // real period-over-period comparison is not available. A badge computed from
  // the first vs. last point of the same window (what this used to do) is not a
  // trend, so nothing is shown rather than something wrong.
  const totalLikes = sumCounts(engagementTrends?.likeGrowth);
  const totalComments = sumCounts(engagementTrends?.commentGrowth);
  const totalShares = sumCounts(engagementTrends?.shareGrowth);

  // Weighted by the views in each duration bucket, not a flat average.
  const avgPercentWatched = weightedPercentWatched(channelWatchPatterns?.retentionByDuration);

  // For display strings
  const periodString = period === '7d' ? '7 days' : period === '30d' ? '30 days' : 'all time';

  // Per card, not per group: three of these read engagementTrends but the
  // fourth reads channelWatchPatterns, so gating the whole block on
  // engagementTrends hid a watch-patterns failure behind a healthy-looking
  // number (and hid three healthy numbers behind an engagement failure).
  const engagementError = errors.engagementTrends;
  const watchPatternsError = errors.channelWatchPatterns;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Engagement Analytics</h2>
          <p className="text-gray-400">Track how viewers interact with your content</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="animate-spin">
              <Loader className="w-4 h-4 text-[#fa7517]" />
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

      {/* Engagement Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={ThumbsUp}
          title="Total Likes"
          value={totalLikes.toLocaleString()}
          loading={isLoading}
          subtitle={`For ${periodString}`}
          error={engagementError ? 'Error loading likes' : undefined}
        />

        <StatsCard
          icon={MessageCircle}
          title="Comments"
          value={totalComments.toLocaleString()}
          loading={isLoading}
          subtitle={`For ${periodString}`}
          error={engagementError ? 'Error loading comments' : undefined}
        />

        <StatsCard
          icon={Share2}
          title="Shares"
          value={totalShares.toLocaleString()}
          loading={isLoading}
          subtitle={`For ${periodString}`}
          error={engagementError ? 'Error loading shares' : undefined}
        />

        <StatsCard
          icon={Clock}
          title="Avg. % watched"
          value={formatPercent(avgPercentWatched)}
          loading={isLoading}
          subtitle="Share of each video watched, weighted by views"
          error={watchPatternsError ? 'Error loading watch depth' : undefined}
        />
      </div>

      {/* Engagement Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-black/50 p-6 rounded-xl">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <ThumbsUp className="w-5 h-5 mr-2 text-[#fa7517]" />
            Like Growth Trend
          </h3>
          {isLoading ? (
            <ChartLoading />
          ) : engagementError ? (
             <div className="h-[300px] flex items-center justify-center text-red-500">Error loading trends.</div>
          ): engagementTrends?.likeGrowth && engagementTrends.likeGrowth.length > 0 ? (
            <LineChart 
              data={engagementTrends.likeGrowth.map((item, index) => ({
                date: safeFormatDate(item.date, index),
                count: item.count
              }))}
              xKey="date"
              yKey="count"
              color="#fa7517"
            />
          ) : (
            <div className="flex justify-center items-center h-[300px]">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
        
        <div className="bg-black/50 p-6 rounded-xl">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-400" />
            Comment Growth Trend
          </h3>
          {isLoading ? (
            <ChartLoading />
          ) : engagementError ? (
             <div className="h-[300px] flex items-center justify-center text-red-500">Error loading trends.</div>
          ): engagementTrends?.commentGrowth && engagementTrends.commentGrowth.length > 0 ? (
            <LineChart 
              data={engagementTrends.commentGrowth.map((item, index) => ({
                date: safeFormatDate(item.date, index),
                count: item.count
              }))}
              xKey="date"
              yKey="count"
              color="#60a5fa"
            />
          ) : (
            <div className="flex justify-center items-center h-[300px]">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center">
            <ThumbsUp className="w-5 h-5 mr-2 text-[#fa7517]" />
            Most Liked Videos
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : topLikedContent && topLikedContent.length > 0 ? (
            <div className="space-y-3">
              {topLikedContent.map((video, index) => (
                <TopVideoCard
                  key={index}
                  thumbnail={video.thumbnail}
                  title={video.title}
                  videoId={video.id}
                  metric={{
                    icon: <ThumbsUp className="w-3 h-3" />,
                    value: video.likes.toLocaleString(),
                    label: "likes"
                  }}
                  secondaryMetric={{
                    value: `${video.likeRate.toFixed(1)}%`,
                    label: "like rate"
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No liked videos data available" />
          )}
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center">
            <Share2 className="w-5 h-5 mr-2 text-green-400" />
            Most Shared Videos
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : topSharedContent && topSharedContent.length > 0 ? (
            <div className="space-y-3">
              {topSharedContent.map((video, index) => (
                <TopVideoCard
                  key={index}
                  thumbnail={video.thumbnail}
                  title={video.title}
                  videoId={video.id}
                  metric={{
                    icon: <Share2 className="w-3 h-3" />,
                    value: video.shares.toLocaleString(),
                    label: "shares"
                  }}
                  secondaryMetric={{
                    value: `${video.shareRate.toFixed(1)}%`,
                    label: "share rate"
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No shared videos data available" />
          )}
        </div>
      </div>

      {/* Top Comments */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-400" />
          Top Comments
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : topComments && topComments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topComments.map((comment, index) => (
              <CommentCard
                key={index}
                avatar={comment.avatar}
                username={comment.username}
                comment={comment.comment}
                likes={comment.likes}
                videoTitle={comment.videoTitle}
                date={comment.date}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No top comments data available" />
        )}
      </div>
    </div>
  );
}; 
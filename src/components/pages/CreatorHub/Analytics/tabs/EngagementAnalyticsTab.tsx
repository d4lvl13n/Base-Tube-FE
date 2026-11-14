import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Clock,
  Award,
  Loader,
  Reply
} from 'lucide-react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { format, parseISO } from 'date-fns';
import { LineChart } from '../charts/LineChart';
import { getVideoById } from '../../../../../api/video';
import {
  COUNTED_VIEWS_NOTE,
  OWN_REPLIES_NOTE,
  appliedPeriodLabel,
  commentsAnsweredView,
  engagementGranularity,
  fillSeries,
  formatDateKey,
  formatPercent,
  isVisibleComment,
  joinNotes,
  percentOf,
  periodPhrase,
  sumCounts,
  weightedPercentWatched
} from '../metrics';

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

// Small label naming the period a list was computed over.
const PeriodTag: React.FC<{ label: string }> = ({ label }) => (
  <span className="ml-2 text-xs font-normal text-gray-400 border border-gray-700 rounded-full px-2 py-0.5">
    {label}
  </span>
);

export const EngagementAnalyticsTab: React.FC<{ channelId: string; channelName?: string }> = ({
  channelId,
  channelName
}) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  
  const { 
    channelWatchPatterns, 
    engagementTrends,
    topLikedContent,
    topLikedAppliedPeriod,
    topSharedContent,
    topSharedAppliedPeriod,
    topComments,
    socialMetrics,
    isLoading,
    loading,
    errors,
  } = useCreatorAnalytics(period, channelId);

  // Reply-based, over the backend's fixed social window (30 days): the period
  // selector does not change it, and the caption says so.
  const answered = socialMetrics ? commentsAnsweredView(socialMetrics.interactions) : null;
  
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

  const phrase = periodPhrase(period);
  const inPeriod = period === 'all' ? 'All time' : `In ${phrase}`;

  // Charts: date keys are UTC calendar days (Monday-keyed weeks on all time).
  // They are formatted as calendar dates — parsing "2026-11-10" as an instant
  // and printing it in local time showed it one day early west of UTC — and
  // every missing bucket is drawn as 0 rather than skipped.
  const granularity = engagementGranularity(engagementTrends?.granularity, period);
  const chartDays = period === '7d' ? 7 : period === '30d' ? 30 : null;
  const per = granularity === 'week' ? 'per week' : granularity === 'month' ? 'per month' : 'per day';
  const bucketNote = granularity === 'week'
    ? 'Weeks start on Monday, UTC.'
    : granularity === 'month' ? 'Months are UTC calendar months.' : 'Days are UTC calendar days.';
  const toChart = (series?: { date: string; count: number }[]) =>
    fillSeries(series, granularity, chartDays).map((point) => ({
      date: formatDateKey(point.date, granularity),
      count: point.count
    }));
  const likeChart = toChart(engagementTrends?.likeGrowth);
  const commentChart = toChart(engagementTrends?.commentGrowth);

  // Never render a comment the API marks deleted or hidden.
  const visibleTopComments = (topComments ?? []).filter(isVisibleComment);

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
          <p className="text-gray-400">
            How viewers interact with {channelName ? <span className="text-white">{channelName}</span> : 'this channel'} only
          </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatsCard
          icon={ThumbsUp}
          title="Total Likes"
          value={totalLikes.toLocaleString()}
          loading={loading.engagementTrends}
          subtitle={inPeriod}
          error={engagementError ? 'Error loading likes' : undefined}
        />

        <StatsCard
          icon={MessageCircle}
          title="Comments"
          value={totalComments.toLocaleString()}
          loading={loading.engagementTrends}
          subtitle={inPeriod}
          note={OWN_REPLIES_NOTE}
          error={engagementError ? 'Error loading comments' : undefined}
        />

        <StatsCard
          icon={Share2}
          title="Shares"
          value={totalShares.toLocaleString()}
          loading={loading.engagementTrends}
          subtitle={inPeriod}
          note="Shares made from the website were not recorded before the share-tracking update, so earlier periods undercount them."
          error={engagementError ? 'Error loading shares' : undefined}
        />

        <StatsCard
          icon={Clock}
          title="Avg. % watched"
          value={formatPercent(avgPercentWatched)}
          loading={loading.channelWatchPatterns}
          subtitle={`Share of each video watched, ${phrase}`}
          note={COUNTED_VIEWS_NOTE}
          error={watchPatternsError ? 'Error loading watch depth' : undefined}
        />

        <StatsCard
          icon={Reply}
          title="Comments answered"
          value={answered?.valueText ?? '—'}
          loading={loading.socialMetrics}
          subtitle={answered?.caption}
          note={joinNotes(answered?.note, 'Counts your replies to comments from others. The period selector does not change this card')}
          error={errors.socialMetrics ? 'Error loading replies' : undefined}
        />
      </div>

      {/* Engagement Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-black/50 p-6 rounded-xl">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <ThumbsUp className="w-5 h-5 mr-2 text-[#fa7517]" />
            Likes {per}
          </h3>
          <p className="text-xs text-gray-500 -mt-2 mb-3">{inPeriod}. {bucketNote}</p>
          {loading.engagementTrends ? (
            <ChartLoading />
          ) : engagementError ? (
             <div className="h-[300px] flex items-center justify-center text-red-500">Error loading trends.</div>
          ): likeChart.length > 0 ? (
            <LineChart 
              data={likeChart}
              xKey="date"
              yKey="count"
              color="#fa7517"
              seriesName={`Likes ${per}`}
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
            Comments {per}
          </h3>
          <p className="text-xs text-gray-500 -mt-2 mb-3">{inPeriod}. {bucketNote} Includes your own replies.</p>
          {loading.engagementTrends ? (
            <ChartLoading />
          ) : engagementError ? (
             <div className="h-[300px] flex items-center justify-center text-red-500">Error loading trends.</div>
          ): commentChart.length > 0 ? (
            <LineChart 
              data={commentChart}
              xKey="date"
              yKey="count"
              color="#60a5fa"
              seriesName={`Comments ${per}`}
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
            <PeriodTag label={appliedPeriodLabel(topLikedAppliedPeriod)} />
          </h3>
          {loading.topLikedContent ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : errors.topLikedContent ? (
            <p role="alert">Unable to load liked videos.</p>
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
                    value: formatPercent(percentOf(video.likes, video.views)),
                    label: `likes ÷ views (${Number(video.views || 0).toLocaleString()} views)`
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
            <PeriodTag label={appliedPeriodLabel(topSharedAppliedPeriod)} />
          </h3>
          {loading.topSharedContent ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : errors.topSharedContent ? (
            <p role="alert">Unable to load shared videos.</p>
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
                    value: formatPercent(percentOf(video.shares, video.views)),
                    label: `shares ÷ views (${Number(video.views || 0).toLocaleString()} views)`
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
          <PeriodTag label={appliedPeriodLabel(period)} />
        </h3>
        <p className="text-xs text-gray-500">Most-liked comments on your videos. Includes your own replies; deleted and hidden comments are never shown.</p>
        {loading.topComments ? (
          <div className="flex justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : errors.topComments ? (
            <p role="alert">Unable to load top comments.</p>
          ) : visibleTopComments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleTopComments.map((comment, index) => (
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
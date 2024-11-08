import React from 'react';
import { motion } from 'framer-motion';
import { Clock, PlayCircle, Calendar, TrendingUp, ThumbsUp, AlertCircle } from 'lucide-react';
import { WatchHistory, LikesHistory } from '../../../types/history';
import StatsCard from '../../pages/CreatorHub/StatsCard';
import { useWatchHistory, useLikesHistory } from '../../../hooks/useProfileData';
import EmptyState from '../EmptyState';
import Loader from '../Loader';
import HistoryItem from './HistoryItem';
import { useUserMetrics } from '../../../hooks/useMetricsData';

interface HistoryTabProps {
  errors?: {
    [key: string]: string;
  };
}

const HistoryTab: React.FC<HistoryTabProps> = ({ errors }) => {
  const { data: metrics, isLoading: isMetricsLoading } = useUserMetrics();
  const {
    data: watchHistory,
    isLoading: isWatchLoading,
    error: watchError,
  } = useWatchHistory();

  const {
    data: likesHistory,
    isLoading: isLikesLoading,
    error: likesError,
  } = useLikesHistory();

  // Handle loading state
  if (isWatchLoading || isLikesLoading || isMetricsLoading) {
    return <Loader />;
  }

  // Handle errors
  if (watchError || likesError) {
    return (
      <EmptyState
        title="Error Loading History"
        description="There was a problem loading your history. Please try again later."
        icon={AlertCircle}
      />
    );
  }

  // Extract data arrays
  const watchHistoryData = watchHistory?.data || [];
  const likesHistoryData = likesHistory?.data || [];

  // Handle empty state
  if (!watchHistoryData.length && !likesHistoryData.length) {
    return (
      <EmptyState
        title="No History Yet"
        description="Start watching videos to see your history here"
        icon={Clock}
      />
    );
  }

  const hasVideoData = (
    item: WatchHistory | LikesHistory
  ): item is (WatchHistory | LikesHistory) & { video: { channel: { name: string } } } => {
    return (
      item.video !== undefined &&
      item.video.title !== undefined &&
      item.video.channel !== undefined &&
      item.video.channel.name !== undefined
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard
          icon={Clock}
          title="Watch Time"
          value={`${metrics?.watchTimeStats.totalWatchTimeHours}h`}
          change={0}
          loading={isMetricsLoading}
        />
        <StatsCard
          icon={PlayCircle}
          title="Videos Watched"
          value={metrics?.videosWatched.toString() || '0'}
          change={0}
          loading={isMetricsLoading}
        />
        <StatsCard
          icon={Calendar}
          title="Active Days"
          value={metrics?.watchTimeStats.activeDays.toString() || '0'}
          change={0}
          loading={isMetricsLoading}
        />
        <StatsCard
          icon={TrendingUp}
          title="Daily Average"
          value={`${metrics?.watchTimeStats.dailyAverage}h`}
          change={0}
          loading={isMetricsLoading}
        />
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watch History */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Recent Watch History</h2>
          {watchHistoryData.length ? (
            <div className="space-y-4">
              {watchHistoryData
                .filter(hasVideoData)
                .slice(0, 5)
                .map((item) => (
                  <HistoryItem
                    key={`watch-${item.id}`}
                    title={item.video.title}
                    channelName={item.video.channel.name}
                    timestamp={item.createdAt}
                    thumbnailPath={item.video.thumbnail_path}
                    completed={item.completed}
                  />
                ))}
            </div>
          ) : (
            <EmptyState
              title="No Watch History"
              description="Your recent watch history will appear here"
              icon={Clock}
              className="h-[200px]"
            />
          )}
        </div>

        {/* Likes History */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Likes</h2>
          {likesHistoryData.length ? (
            <div className="space-y-4">
              {likesHistoryData
                .filter(hasVideoData)
                .slice(0, 5)
                .map((item) => (
                  <HistoryItem
                    key={`like-${item.id}`}
                    title={item.video.title}
                    channelName={item.video.channel.name}
                    timestamp={item.createdAt}
                    thumbnailPath={item.video.thumbnail_path}
                    isLiked={item.is_like}
                  />
                ))}
            </div>
          ) : (
            <EmptyState
              title="No Liked Videos"
              description="Videos you like will appear here"
              icon={ThumbsUp}
              className="h-[200px]"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HistoryTab;
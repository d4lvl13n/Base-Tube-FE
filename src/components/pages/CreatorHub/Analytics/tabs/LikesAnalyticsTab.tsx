import React from 'react';
import { useCreatorAnalytics } from '../../../../../hooks/useAnalyticsData';
import { LineChart } from '../charts/LineChart';
import { TopLikedVideosTable } from '../table/TopLikedVideosTable';
import Loader from '../../../../common/Loader';

interface LikesAnalyticsTabProps {
  channelId: string;
}

export const LikesAnalyticsTab: React.FC<LikesAnalyticsTabProps> = ({ channelId }) => {
  const { 
    likeGrowthTrends, 
    topLikedVideos, 
    isLoading, 
    errors 
  } = useCreatorAnalytics('all', channelId);

  const likeGrowthError = errors.likeGrowthTrends;
  const topVideosError = errors.topLikedVideos;

  return (
    <div className="space-y-8">
      {/* Like Growth Chart */}
      <div className="bg-black/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Like Growth Trends</h3>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Loader /></div>
        ) : likeGrowthError ? (
          <div className="h-64 flex items-center justify-center text-red-500">Error loading like trends.</div>
        ) : likeGrowthTrends && likeGrowthTrends.trends && likeGrowthTrends.trends.length > 0 ? (
          <LineChart
            data={likeGrowthTrends.trends.map(item => ({ ...item, date: new Date(item.date).toLocaleDateString() }))}
            xKey="date"
            yKey="likeCount"
            color="#fa7517"
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">No like trend data available.</div>
        )}
      </div>

      {/* Top Liked Videos */}
      <div className="bg-black/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Most Liked Videos</h3>
        {topVideosError ? (
           <div className="text-red-500 text-center p-4">Error loading top videos.</div>
        ) : (
          <TopLikedVideosTable videos={topLikedVideos} loading={isLoading} />
        )}
      </div>
    </div>
  );
};
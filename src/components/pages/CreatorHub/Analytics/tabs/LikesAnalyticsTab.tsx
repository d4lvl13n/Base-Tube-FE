import React from 'react';
import { useLikesAnalytics } from '../../../../../hooks/useLikesAnalytics';
import { LineChart } from '../charts/LineChart';
import { TopLikedVideosTable } from '../table/TopLikedVideosTable';

interface LikesAnalyticsTabProps {
  channelId: string;
}

export const LikesAnalyticsTab: React.FC<LikesAnalyticsTabProps> = ({ channelId }) => {
  const { likeGrowth, topVideos, isLoading } = useLikesAnalytics(channelId);

  return (
    <div className="space-y-8">
      {/* Like Growth Chart */}
      <div className="bg-black/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Like Growth Trends</h3>
        {likeGrowth && likeGrowth.trends && (
          <LineChart
            data={likeGrowth.trends}
            xKey="date"
            yKey="likeCount"
            color="#fa7517"
          />
        )}
      </div>

      {/* Top Liked Videos */}
      <div className="bg-black/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Most Liked Videos</h3>
        <TopLikedVideosTable videos={topVideos} loading={isLoading} />
      </div>
    </div>
  );
};
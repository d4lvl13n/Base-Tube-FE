import React from 'react';
import { Play, ThumbsUp, TrendingUp } from 'lucide-react';
import type { TopLikedVideo } from '../../../../../types/analytics';

interface TopLikedVideosTableProps {
  videos?: TopLikedVideo[];
  loading?: boolean;
}

export const TopLikedVideosTable: React.FC<TopLikedVideosTableProps> = ({ 
  videos = [], 
  loading = false 
}) => {
  if (loading) {
    return <div className="animate-pulse bg-black/50 rounded-xl p-4 h-48" />;
  }

  if (!Array.isArray(videos) || videos.length === 0) {
    return (
      <div className="bg-black/50 rounded-xl p-4 text-center text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="bg-black/50 rounded-xl p-4">
      <table className="w-full">
        <thead>
          <tr className="text-gray-400 text-sm">
            <th className="text-left py-2">Content</th>
            <th className="text-right py-2">
              <ThumbsUp className="w-4 h-4 inline" /> Likes
            </th>
            <th className="text-right py-2">
              <Play className="w-4 h-4 inline" /> Views
            </th>
            <th className="text-right py-2">
              <TrendingUp className="w-4 h-4 inline" /> Engagement
            </th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr key={video.videoId} className="border-t border-gray-800">
              <td className="py-3 truncate max-w-[200px]">
                <div className="flex items-center gap-2">
                  <img 
                    src={video.thumbnail || ''} 
                    alt={video.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <span>{video.title}</span>
                </div>
              </td>
              <td className="text-right text-[#fa7517]">
                {video.likeCount?.toLocaleString() ?? '0'}
              </td>
              <td className="text-right text-blue-400">
                {video.viewCount?.toLocaleString() ?? '0'}
              </td>
              <td className="text-right text-green-400">
                {video.likeToViewRatio ?? '0'}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
import React from 'react';
import { Play, Clock, TrendingUp } from 'lucide-react';
import { Video } from '../../../../../types/video';
import { formatDuration } from '../../../../../utils/format';

interface TopContentTableProps {
  videos?: Video[];
  loading?: boolean;
}

export const TopContentTable: React.FC<TopContentTableProps> = ({ videos = [], loading = false }) => {
  if (loading) {
    return <div className="animate-pulse bg-black/50 rounded-xl p-4 h-48" />;
  }

  return (
    <div className="bg-black/50 rounded-xl p-4">
      <table className="w-full">
        <thead>
          <tr className="text-gray-400 text-sm">
            <th className="text-left py-2">Content</th>
            <th className="text-right py-2"><Play className="w-4 h-4 inline" /> Views</th>
            <th className="text-right py-2"><Clock className="w-4 h-4 inline" /> Duration</th>
            <th className="text-right py-2"><TrendingUp className="w-4 h-4 inline" /> Trend</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr key={video.id} className="border-t border-gray-800">
              <td className="py-3 truncate max-w-[200px]">{video.title}</td>
              <td className="text-right text-[#fa7517]">
                {video.views.toLocaleString()}
              </td>
              <td className="text-right text-blue-400">
                {formatDuration(video.duration)}
              </td>
              <td className="text-right text-green-400">
                {video.trending_score.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
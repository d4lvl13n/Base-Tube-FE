// src/components/channel/VideoGrid.tsx

import React from 'react';
import { Video } from '../../../types/video';
import VideoCard from '../VideoCard';
import PlaceholderVideoCard from '../PlaceHolderVideoCard';

interface VideoGridProps {
  videos: Video[];
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  videos, 
  loadMore, 
  hasMore = false,
  loading = false 
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            size="normal"
          />
        ))}
        {loading && (
          <>
            <PlaceholderVideoCard size="normal" />
            <PlaceholderVideoCard size="normal" />
            <PlaceholderVideoCard size="normal" />
            <PlaceholderVideoCard size="normal" />
          </>
        )}
      </div>
      
      {hasMore && !loading && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-gray-800/50 text-white rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;

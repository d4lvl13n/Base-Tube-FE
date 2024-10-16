// src/components/channel/VideoGrid.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Video } from '../../../types/video';
import VideoCard from '../../common/VideoCard';

interface VideoGridProps {
  videos: Video[];
  loadMore: () => void;
  hasMore: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ videos, loadMore, hasMore }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} size="normal" />
        ))}
      </div>
      {hasMore && (
        <motion.button
          className="mt-8 bg-[#fa7517] text-black px-6 py-2 rounded-full font-bold mx-auto block"
          onClick={loadMore}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Load More
        </motion.button>
      )}
    </div>
  );
};

export default VideoGrid;

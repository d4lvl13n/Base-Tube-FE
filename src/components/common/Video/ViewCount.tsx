// src/components/common/Video/ViewCount.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Video } from '../../../types/video';
import { useWindowSize } from '../../../hooks/useWindowSize';

interface ViewCountProps {
  video: Video;
}

export const ViewCount: React.FC<ViewCountProps> = ({ video }) => {
  const viewCount = video.views_count ?? video.views ?? 0;
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  return (
    <motion.div
      className={
        isMobile
          ? "relative bg-black bg-opacity-70 rounded-lg px-4 py-2 pointer-events-none mt-2"
          : "video-overlay view-count bg-black bg-opacity-70 rounded-lg px-4 py-2 pointer-events-none"
      }
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <p className="text-white font-semibold text-sm">
        {viewCount.toLocaleString()} views
      </p>
    </motion.div>
  );
};
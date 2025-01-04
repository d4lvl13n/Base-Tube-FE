// src/components/common/Video/ViewCount.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { formatNumber } from '../../../utils/format';
import type { Video } from '../../../types/video';

interface ViewCountProps {
  video: Video;
}

export const ViewCount: React.FC<ViewCountProps> = ({ video }) => {
  const viewCount = video.views_count ?? video.views ?? 0;
  
  return (
    <motion.div
      className="video-overlay view-count bg-black bg-opacity-70 rounded-lg px-4 py-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <p className="text-white font-semibold text-sm">
        {formatNumber(viewCount)} views
      </p>
    </motion.div>
  );
};
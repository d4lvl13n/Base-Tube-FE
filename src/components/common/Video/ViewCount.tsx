// src/components/Video/ViewCount.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { formatNumber } from '../../../utils/format';
import type { Video } from '../../../types/video';

interface ViewCountProps {
  video: Video;
}

export const ViewCount: React.FC<ViewCountProps> = ({ video }) => {
  return (
    <motion.div
      className="absolute top-4 right-4 bg-black bg-opacity-70 rounded-lg p-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <p className="text-white font-semibold">{formatNumber(video.views)} views</p>
    </motion.div>
  );
};
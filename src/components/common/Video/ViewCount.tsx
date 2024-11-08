// src/components/Video/ViewCount.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Video } from '../../../types/video';

interface ViewCountProps {
  video: Video;
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) {
    return '0';
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
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
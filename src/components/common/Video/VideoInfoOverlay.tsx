// src/components/common/Video/VideoInfoOverlay.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Video } from '../../../types/video';

interface VideoInfoOverlayProps {
  video: Video;
}

export const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({ video }) => {
  return (
    <motion.div
      className="absolute bottom-4 left-4 bg-black bg-opacity-70 rounded-lg p-4 max-w-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      style={{ pointerEvents: 'none' }}
    >
      <h2 className="text-xl font-bold text-white mb-2">{video.title}</h2>
      <p className="text-sm text-gray-300">{video.description}</p>
    </motion.div>
  );
};
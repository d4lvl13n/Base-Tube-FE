// src/components/common/Video/VideoInfoOverlay.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Video } from '../../../types/video';
import RichTextDisplay from '../RichTextDisplay';

interface VideoInfoOverlayProps {
  video: Video;
}

export const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({ video }) => {
  return (
    <motion.div
      className="video-overlay video-info-overlay bg-black bg-opacity-70 rounded-lg p-4 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-xl font-bold text-white mb-2">{video.title}</h2>
      <div className="text-sm text-gray-300 line-clamp-3">
        <RichTextDisplay content={video.description || ''} />
      </div>
    </motion.div>
  );
};
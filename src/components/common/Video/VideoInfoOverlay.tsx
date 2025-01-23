// src/components/common/Video/VideoInfoOverlay.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Video } from '../../../types/video';
import { useWindowSize } from '../../../hooks/useWindowSize';
import RichTextDisplay from '../RichTextDisplay';

interface VideoInfoOverlayProps {
  video: Video;
}

export const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({ video }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  return (
    <motion.div
      className={
        isMobile
          ? "relative pointer-events-none w-full bg-black bg-opacity-70 rounded-lg p-4 backdrop-blur-sm mt-2"
          : "video-overlay video-info-overlay bg-black bg-opacity-70 rounded-lg p-4 backdrop-blur-sm pointer-events-none"
      }
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.2 }}
    >
      <div className="pointer-events-auto">
        <h2 className="text-xl font-bold text-white mb-2">{video.title}</h2>
        <div className="text-sm text-gray-300 line-clamp-3">
          <RichTextDisplay content={video.description || ''} />
        </div>
      </div>
    </motion.div>
  );
};
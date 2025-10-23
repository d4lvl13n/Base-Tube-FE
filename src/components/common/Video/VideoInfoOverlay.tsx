// src/components/common/Video/VideoInfoOverlay.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Video } from '../../../types/video';
import { useWindowSize } from '../../../hooks/useWindowSize';
import RichTextDisplay from '../RichTextDisplay';
import { useDescriptionDock } from '../../../contexts/DescriptionDockContext';

interface VideoInfoOverlayProps {
  video: Video;
}

export const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({ video }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const { open } = useDescriptionDock();

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
        <button
          onClick={(e) => { e.stopPropagation(); open(video); }}
          className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-white/90 bg-[#fa7517] hover:bg-[#fa7517]/80 px-3 py-1.5 rounded-full"
        >
          View more
        </button>
      </div>
    </motion.div>
  );
};
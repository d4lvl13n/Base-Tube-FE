import React, { useRef } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X, Compass } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getRecommendedVideos } from '../../../../api/video';
import { DiscoveryVideoCard } from './DiscoveryVideoCard';
import { useWindowSize } from '../../../../hooks/useWindowSize';

interface DiscoveryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideoId: string;
}

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  isOpen,
  onClose,
  currentVideoId
}) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const panelHeight = isMobile ? 280 : 220;
  const dragControls = useDragControls();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendedVideos', currentVideoId],
    queryFn: () => getRecommendedVideos(1, 20),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter out current video from recommendations
  const videos = data?.videos.filter(v => v.id.toString() !== currentVideoId) || [];

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close panel if dragged down more than 50px
    if (info.offset.y > 50) {
      onClose();
    }
  };

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-[44]"
            onClick={handleBackdropClick}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            drag={isMobile ? "y" : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[45] bg-black/85 backdrop-blur-xl border-t border-white/10"
            style={{ height: panelHeight }}
          >
            {/* Drag handle (mobile) */}
            {isMobile && (
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 bg-white/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#fa7517]" />
                <h3 className="text-white font-semibold text-sm">Discover More</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="relative h-[calc(100%-48px)] overflow-hidden">
              {/* Left gradient fade */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/85 to-transparent z-10 pointer-events-none" />

              {/* Right gradient fade */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/85 to-transparent z-10 pointer-events-none" />

              {/* Scrollable content */}
              <div
                ref={scrollContainerRef}
                className="flex gap-4 px-6 py-3 overflow-x-auto overflow-y-hidden scrollbar-hide h-full items-start"
                style={{ scrollBehavior: 'smooth' }}
              >
                {isLoading ? (
                  // Loading shimmer
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[160px] animate-pulse">
                      <div className="w-full aspect-video bg-gray-800 rounded-lg" />
                      <div className="mt-2 space-y-1">
                        <div className="h-3 bg-gray-800 rounded w-full" />
                        <div className="h-3 bg-gray-800 rounded w-3/4" />
                        <div className="h-2 bg-gray-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : error ? (
                  <div className="flex items-center justify-center w-full text-gray-400 text-sm">
                    Failed to load recommendations
                  </div>
                ) : videos.length === 0 ? (
                  <div className="flex items-center justify-center w-full text-gray-400 text-sm">
                    No recommendations available
                  </div>
                ) : (
                  videos.map((video) => (
                    <DiscoveryVideoCard
                      key={video.id}
                      video={video}
                      onClick={onClose}
                    />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

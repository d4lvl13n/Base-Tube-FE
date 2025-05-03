import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Calendar, Clock, ExternalLink, Info, Shield, MessageCircle } from 'lucide-react';
import { PassVideo } from '../../types/pass'; // Import PassVideo type

// Update the interface to extend from PassVideo and include additional fields
interface VideoDetailsType extends Partial<PassVideo> {
  id: string;
  description?: string;  // Add back description
  created_at?: string;   // Add back created_at
  // Other fields are inherited from PassVideo
}

interface VideoDescriptionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoDetailsType | null;
  passTitle: string;
  creatorName?: string;
  onPlay: () => void; // Function to play the selected video
  videoIndex: number;
  totalVideos: number;
}

const VideoDescriptionPanel: React.FC<VideoDescriptionPanelProps> = ({
  isOpen,
  onClose,
  video,
  passTitle,
  creatorName,
  onPlay,
  videoIndex,
  totalVideos
}) => {
  if (!video) return null;

  // Format duration if available
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown duration';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="fixed right-0 top-0 bottom-0 h-screen w-[500px] bg-black/95 z-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Border */}
            <div className="absolute left-0 inset-y-0 w-[2px] h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517]/30 via-[#fa7517]/10 to-[#fa7517]/30" />
            </div>

            {/* Content */}
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-800/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-[#fa7517]" />
                    <h2 className="text-xl font-semibold">Video Details</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </motion.button>
                </div>
                <p className="text-gray-400 text-sm">Part of: {passTitle}</p>
                {creatorName && <p className="text-gray-500 text-sm">By {creatorName}</p>}
              </div>

              {/* Main Content - Scrollable Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Video Thumbnail with Play Button */}
                  <div className="relative aspect-video rounded-xl overflow-hidden group">
                    <img 
                      src={video.thumbnail_url || '/assets/Content-pass.webp'} 
                      alt={video.title || 'Video thumbnail'} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                    {/* Play button overlay */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onPlay}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="bg-[#fa7517]/80 hover:bg-[#fa7517] rounded-full w-16 h-16 flex items-center justify-center shadow-xl transition-colors duration-300">
                        <Play className="w-8 h-8 text-white" fill="white" />
                      </div>
                    </motion.button>
                    
                    {/* Video number badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium">
                      Video {videoIndex + 1} of {totalVideos}
                    </div>
                  </div>

                  {/* Video Title */}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      {video.title || `Video ${videoIndex + 1}`}
                    </h1>
                  </div>

                  {/* Video Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-white/5">
                      <Calendar className="w-4 h-4 text-[#fa7517]" />
                      <div className="text-sm">
                        <p className="text-gray-400">Added</p>
                        <p className="text-white">{formatDate(video.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-white/5">
                      <Clock className="w-4 h-4 text-[#fa7517]" />
                      <div className="text-sm">
                        <p className="text-gray-400">Duration</p>
                        <p className="text-white">{formatDuration(video.duration)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-[#fa7517]" />
                      <h3 className="font-medium">Description</h3>
                    </div>
                    <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {video.description || "No description available for this video."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Action Buttons */}
              <div className="p-6 border-t border-gray-800/30 space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onPlay}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#fa7517] to-orange-500 rounded-xl font-semibold text-white
                    flex items-center justify-center space-x-3 shadow-lg hover:shadow-orange-500/20"
                >
                  <Play className="w-5 h-5" fill="white" />
                  <span>Play Now</span>
                </motion.button>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Comments</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoDescriptionPanel; 
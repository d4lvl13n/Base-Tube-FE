import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../types/video';
import { Channel } from '../../types/channel';
import { Play, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCardProps {
  video: Video & { channel?: Channel };
  size: 'normal' | 'large';
  className?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, size, className = '' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Match EXACT fallback logic used elsewhere
  const channelImageUrl =
    video.channel?.channel_image_url ||
    (video.channel?.channel_image_path
      ? video.channel.channel_image_path.startsWith('http')
        ? video.channel.channel_image_path
        : `${process.env.REACT_APP_API_URL}/${video.channel.channel_image_path}`
      : '/assets/default-cover.jpg'
    );

  // Helper to standardize thumbnail URL
  const getThumbnailUrl = (video: Video): string => {
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    if (video.thumbnail_path?.startsWith('http')) {
      return video.thumbnail_path;
    }
    return video.thumbnail_path
      ? `${process.env.REACT_APP_API_URL}/${video.thumbnail_path}`
      : '/assets/default-thumbnail.jpg';
  };

  // Format length of video
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format numeric view counts
  const formatViews = (views: number | undefined): string => {
    if (!views) return '0';
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <Link to={`/video/${video.id}`} className={className}>
      <motion.div
        className={`group relative w-full bg-gray-900/30 rounded-xl overflow-hidden
                    transition-all duration-300 hover:ring-2 hover:ring-[#fa7517]/50
                    ${size === 'large' ? 'col-span-2 row-span-2' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Fixed Aspect Ratio */}
        <div className="relative w-full pt-[56.25%]">
          {/* Thumbnail */}
          <div className="absolute inset-0">
            <img
              src={getThumbnailUrl(video)}
              alt={video.title}
              loading="lazy"
              className={`w-full h-full object-cover transition-opacity duration-500
                         ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Loading Placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}

            {/* Initial Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3
                  className={`text-white font-semibold line-clamp-2 mb-2
                              ${size === 'large' ? 'text-lg' : 'text-sm'}`}
                >
                  {video.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Eye size={14} className="text-[#fa7517]" />
                    <span>{formatViews(video.views_count ?? video.views ?? 0)}</span>
                  </div>
                  <div className="px-2 py-1 bg-black/50 rounded-md">
                    {formatDuration(video.duration)}
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Overlay */}
            <div
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                         transition-all duration-300 flex items-center justify-center"
            >
              {/* Centered Play Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <Play className="text-white w-16 h-16" />
              </motion.div>

              {/* Channel Banner (only if channel is provided) */}
              {video.channel?.name && (
                <motion.div
                  className="absolute bottom-4 left-4 right-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="relative w-full h-16 rounded-lg overflow-hidden">
                    <img
                      src={channelImageUrl}
                      alt={video.channel.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent">
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                        <p className="text-white text-sm font-medium tracking-wide">
                          {video.channel.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default VideoCard;
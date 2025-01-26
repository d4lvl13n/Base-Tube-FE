import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../../types/video';
import { Play, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  featuredVideos: Video[];
  renderPlaceholder: () => React.ReactNode;
}

const HeroSection: React.FC<HeroSectionProps> = ({ featuredVideos, renderPlaceholder }) => {
  if (!Array.isArray(featuredVideos) || featuredVideos.length === 0) {
    return <div className="flex flex-wrap gap-4 mb-8">{renderPlaceholder()}</div>;
  }

  const formatViews = (views: number | undefined): string => {
    if (!views) return '0';
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Featured</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featuredVideos.slice(0, 2).map((video) => (
          <Link 
            key={video.id} 
            to={`/video/${video.id}`} 
            className="relative group overflow-hidden rounded-xl"
          >
            {/* Container with controlled aspect ratio and max-height */}
            <div className="relative aspect-video max-h-[400px]">
              {/* Thumbnail with object-fit: cover to maintain aspect ratio */}
              <img 
                src={video.thumbnail_url || 
                  (video.thumbnail_path?.startsWith('http')
                    ? video.thumbnail_path
                    : video.thumbnail_path
                      ? `${process.env.REACT_APP_API_URL}/${video.thumbnail_path}`
                      : '/assets/default-thumbnail.jpg')}
                alt={video.title} 
                className="w-full h-full object-cover"
              />

              {/* Initial View Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                {/* Title and Stats - Moved up slightly */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-semibold text-white line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Eye size={16} className="text-[#fa7517]" />
                      <span>{formatViews(video.views_count)}</span>
                    </div>
                    <div className="px-2 py-1 bg-black/50 rounded-md">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 
                           transition-all duration-300 flex items-center justify-center">
                {/* Play Button */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <Play className="text-white w-12 h-12 md:w-16 md:h-16" />
                </motion.div>

                {/* Channel Banner - Adjusted position */}
                {video.channel?.name && (
                  <motion.div
                    className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="relative w-full h-16 md:h-20 rounded-lg overflow-hidden">
                      <img
                        src={video.channel.channel_image_url || '/assets/default-cover.jpg'}
                        alt={video.channel.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                          <p className="text-white text-sm md:text-base font-medium tracking-wide">
                            {video.channel.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;

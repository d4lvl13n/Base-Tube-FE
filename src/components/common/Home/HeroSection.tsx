import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../../types/video';
import { Play, Eye, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  featuredVideos: Video[];
  renderPlaceholder: () => React.ReactNode;
}

const HeroSection: React.FC<HeroSectionProps> = ({ featuredVideos, renderPlaceholder }) => {
  if (!Array.isArray(featuredVideos) || featuredVideos.length === 0) {
    return <div className="flex flex-wrap gap-4 mb-8">{renderPlaceholder()}</div>;
  }

  return (
    <div className="mb-8 mr-16">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Featured</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featuredVideos.slice(0, 2).map((video) => (
          <Link 
            key={video.id} 
            to={`/video/${video.id}`} 
            className="relative group overflow-hidden rounded-lg aspect-video"
          >
            <img 
              src={`${process.env.REACT_APP_API_URL}/${video.thumbnail_path}`} 
              alt={video.title} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <Play className="text-white w-16 h-16" />
              </motion.div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent group-hover:opacity-0 transition-opacity duration-300">
              <h3 className="text-lg font-bold text-white line-clamp-2">{video.title}</h3>
              {video.channel && (
                <div className="flex items-center mt-2">
                  {(video.channel.ownerPicture || video.channel.User?.picture) && (
                    <img
                      src={`${process.env.REACT_APP_API_URL}/${video.channel.ownerPicture || video.channel.User?.picture}`}
                      alt={video.channel.name}
                      className="w-6 h-6 rounded-full object-cover mr-2"
                    />
                  )}
                  <p className="text-sm text-gray-300">{video.channel.name}</p>
                </div>
              )}
              <div className="flex items-center space-x-4 text-xs text-gray-300 mt-2">
                <span className="flex items-center">
                  <Eye size={14} className="mr-1" />
                  {formatNumber(video.views)}
                </span>
                <span className="flex items-center">
                  <Heart size={14} className="mr-1" />
                  {formatNumber(video.likes)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
}

export default HeroSection;

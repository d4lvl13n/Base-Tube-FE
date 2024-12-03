import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../types/video';
import { Play, Eye, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCardProps {
  video: Video;
  size: 'normal' | 'large';
  className?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, size }) => {
  return (
    <Link to={`/video/${video.id}`} className="group relative">
      <div className={`relative ${size === 'large' ? 'aspect-video' : 'aspect-video'}`}>
        <img
          src={`${process.env.REACT_APP_API_URL}/${video.thumbnail_path}`}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Play className="text-white w-12 h-12" />
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent group-hover:opacity-0 transition-opacity duration-300">
          <div className="flex items-center space-x-2 mb-2">
            {video.channel && video.channel.ownerProfileImage && (
              <img
                src={`${process.env.REACT_APP_API_URL}/${video.channel.ownerProfileImage}`}
                alt={video.channel.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <h3 className="text-sm font-semibold text-white line-clamp-1">{video.title}</h3>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-300">
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
      </div>
    </Link>
  );
};

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

export default VideoCard;
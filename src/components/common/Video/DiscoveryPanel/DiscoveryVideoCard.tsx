import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RecommendedVideo } from '../../../../types/video';

interface DiscoveryVideoCardProps {
  video: RecommendedVideo;
  onClick: () => void;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatViews = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
};

export const DiscoveryVideoCard: React.FC<DiscoveryVideoCardProps> = ({ video, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onClick();
    navigate(`/video/${video.id}`);
  };

  return (
    <motion.div
      className="flex-shrink-0 w-[160px] cursor-pointer group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {formatDuration(video.duration)}
        </div>
        {/* Hover ring effect */}
        <div className="absolute inset-0 rounded-lg ring-0 group-hover:ring-2 ring-[#fa7517]/50 transition-all duration-200" />
      </div>

      {/* Title and metadata */}
      <div className="mt-2 space-y-0.5">
        <h4 className="text-white text-xs font-medium line-clamp-2 leading-tight group-hover:text-[#fa7517] transition-colors">
          {video.title}
        </h4>
        <p className="text-gray-400 text-[10px] truncate">
          {video.channel.name}
        </p>
        <p className="text-gray-500 text-[10px]">
          {formatViews(video.views_count)}
        </p>
      </div>
    </motion.div>
  );
};

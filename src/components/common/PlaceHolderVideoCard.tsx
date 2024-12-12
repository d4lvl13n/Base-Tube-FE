import React from 'react';
import { motion } from 'framer-motion';

interface PlaceholderVideoCardProps {
  size: 'large' | 'normal';
  className?: string;
}

const PlaceholderVideoCard: React.FC<PlaceholderVideoCardProps> = ({ size, className }) => (
  <motion.div 
    className={`bg-gray-900 rounded-xl overflow-hidden
                ${size === 'large' ? 'col-span-2 row-span-2' : ''} 
                ${className || ''}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Thumbnail */}
    <div className={`aspect-video bg-gray-800 animate-pulse`} />
    
    {/* Content */}
    <div className="p-4">
      <div className="flex items-start space-x-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />
        
        <div className="flex-1">
          {/* Title */}
          <div className="h-5 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-5 bg-gray-800 rounded animate-pulse w-3/4" />
          {/* Channel name */}
          <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2 mt-2" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex space-x-4 mt-4">
        <div className="h-4 bg-gray-800 rounded animate-pulse w-16" />
        <div className="h-4 bg-gray-800 rounded animate-pulse w-16" />
        <div className="h-4 bg-gray-800 rounded animate-pulse w-16" />
      </div>
    </div>
  </motion.div>
);

export default PlaceholderVideoCard;

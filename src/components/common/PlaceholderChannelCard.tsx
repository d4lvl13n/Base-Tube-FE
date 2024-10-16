import React from 'react';
import { motion } from 'framer-motion';
import { Users, Video } from 'lucide-react';

const PlaceholderChannelCard: React.FC = () => {
  return (
    <motion.div
      className="bg-gray-800 rounded-lg overflow-hidden"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <div className="relative aspect-video">
        <div className="w-full h-full bg-gray-700 animate-pulse" />
        <div className="absolute bottom-4 left-4 flex items-center">
          <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-600 animate-pulse" />
        </div>
      </div>
      <div className="p-4">
        <div className="h-6 bg-gray-700 rounded animate-pulse mb-2" />
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400 flex items-center">
            <Users size={16} className="mr-1" />
            <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
          </span>
          <span className="text-sm text-gray-400 flex items-center">
            <Video size={16} className="mr-1" />
            <div className="h-4 w-12 bg-gray-700 rounded animate-pulse" />
          </span>
        </div>
        <div className="w-full h-8 bg-gray-700 rounded-full animate-pulse" />
      </div>
    </motion.div>
  );
};

export default PlaceholderChannelCard;


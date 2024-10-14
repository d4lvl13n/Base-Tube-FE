import React from 'react';
import { motion } from 'framer-motion';

interface PlaceholderVideoCardProps {
  size: 'large' | 'normal';
  className?: string;
}

const PlaceholderVideoCard: React.FC<PlaceholderVideoCardProps> = ({ size, className }) => (
  <motion.div 
    className={`bg-gray-800 rounded-lg overflow-hidden ${size === 'large' ? 'col-span-2 row-span-2' : ''} ${className || ''}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className={`bg-gray-700 animate-pulse ${size === 'large' ? 'h-80' : 'h-40'}`}></div>
    <div className="p-4">
      <div className="h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
      <div className="h-3 bg-gray-700 rounded animate-pulse w-2/3"></div>
    </div>
  </motion.div>
);

export default PlaceholderVideoCard;

// src/components/Video/CreatorBox.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Channel } from '../../../types/channel';

interface CreatorBoxProps {
  channel: Channel;
}

export const CreatorBox: React.FC<CreatorBoxProps> = ({ channel }) => {
  const avatarUrl = channel.ownerPicture
    ? `${process.env.REACT_APP_API_URL}/${channel.ownerPicture}`
    : '/assets/default-avatar.jpg';

  // Handler to prevent event propagation
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <motion.div
      className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-4 flex items-center space-x-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      // Ensure the overlay itself doesn't block pointer events
      style={{ pointerEvents: 'none' }}
    >
      <img
        src={avatarUrl}
        alt={channel.name}
        className="w-12 h-12 rounded-full object-cover cursor-pointer"
        onClick={(e) => {
          handleClick(e);
          // Navigate to channel page or perform desired action
        }}
        style={{ pointerEvents: 'auto' }} // Enable pointer events on the avatar
      />
      <div
        onClick={handleClick}
        style={{ pointerEvents: 'auto' }} // Enable pointer events on the text
      >
        <h3 className="text-white font-semibold">{channel.name}</h3>
        <p className="text-sm text-gray-300">
          {channel.subscribers_count} subscribers
        </p>
      </div>
      <motion.button
        className="bg-[#fa7517] text-black px-4 py-2 rounded-full font-bold"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          handleClick(e);
          // Perform subscribe action
        }}
        style={{ pointerEvents: 'auto' }} // Enable pointer events on the button
      >
        Subscribe
      </motion.button>
    </motion.div>
  );
};

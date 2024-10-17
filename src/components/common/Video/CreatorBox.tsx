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

  return (
    <motion.div
      className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-4 flex items-center space-x-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <img
        src={avatarUrl}
        alt={channel.name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div>
        <h3 className="text-white font-semibold">{channel.name}</h3>
        <p className="text-sm text-gray-300">{channel.subscribers_count} subscribers</p>
      </div>
      <motion.button
        className="bg-[#fa7517] text-black px-4 py-2 rounded-full font-bold"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Subscribe
      </motion.button>
    </motion.div>
  );
};

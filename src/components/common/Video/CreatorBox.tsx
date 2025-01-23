// src/components/Video/CreatorBox.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Channel } from '../../../types/channel';
import { SubscribeButton } from '../../common/buttons/SubscribeButton';
import { useWindowSize } from '../../../hooks/useWindowSize';

interface CreatorBoxProps {
  channel: Channel;
}

export const CreatorBox: React.FC<CreatorBoxProps> = ({ channel }) => {
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  const avatarUrl = channel.ownerProfileImage
    ? channel.ownerProfileImage.startsWith('http')
      ? channel.ownerProfileImage
      : `${process.env.REACT_APP_API_URL}/${channel.ownerProfileImage}`
    : '/assets/default-avatar.jpg';

  const handleChannelClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/channel/${channel.handle || channel.id}`);
  };

  return (
    <motion.div
      className={`
        bg-black bg-opacity-70 rounded-lg p-4 flex items-center space-x-4
        ${isMobile 
          ? 'relative mt-2 w-full pointer-events-auto' 
          : 'absolute top-4 left-4 pointer-events-none'}
      `}
      initial={{ opacity: 0, x: isMobile ? 0 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <img
        src={avatarUrl}
        alt={channel.name}
        className="w-12 h-12 rounded-full object-cover cursor-pointer"
        onClick={handleChannelClick}
        style={{ pointerEvents: 'auto' }}
      />
      <div
        onClick={handleChannelClick}
        style={{ pointerEvents: 'auto' }}
        className="cursor-pointer"
      >
        <h3 className="text-white font-semibold">{channel.name}</h3>
        <p className="text-sm text-gray-300">
          {channel.subscribers_count?.toLocaleString()} subscribers
        </p>
      </div>
      <SubscribeButton 
        channelId={channel.id}
        className="pointer-events-auto"
      />
    </motion.div>
  );
};

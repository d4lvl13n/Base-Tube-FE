import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Channel } from '../../../types/channel';
import { SubscribeButton } from '../buttons/SubscribeButton';

interface PersistentCreatorBarProps {
  channel: Channel;
}

export const PersistentCreatorBar: React.FC<PersistentCreatorBarProps> = ({ channel }) => {
  const navigate = useNavigate();

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
      className="fixed bottom-24 left-4 z-[35] bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-2 flex items-center gap-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
    >
      <img
        src={avatarUrl}
        alt={channel.name}
        className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-[#fa7517]/50 transition-all"
        onClick={handleChannelClick}
      />
      <div
        onClick={handleChannelClick}
        className="cursor-pointer max-w-[120px]"
      >
        <h4 className="text-white text-sm font-medium truncate">{channel.name}</h4>
      </div>
      <SubscribeButton
        channelId={channel.id}
        className="!px-3 !py-1 text-xs"
      />
    </motion.div>
  );
};

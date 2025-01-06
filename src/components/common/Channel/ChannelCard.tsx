import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Video } from 'lucide-react';
import { useChannelData } from '../../../hooks/useChannelData';
import { SubscribeButton } from '../buttons/SubscribeButton';
import { Channel } from '../../../types/channel';

interface ChannelCardProps {
  channel: Channel;
  variant?: 'default' | 'compact';
  className?: string;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  variant = 'default',
  className = ''
}) => {
  const { channel: channelData, isLoading } = useChannelData(channel.id);

  const coverImageUrl = channel.channel_image_path
    ? `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
    : '/assets/default-cover.jpg';

  const avatarUrl = channel.ownerProfileImage
    ? `${process.env.REACT_APP_API_URL}/${channel.ownerProfileImage}`
    : '/assets/default-avatar.jpg';

  const channelLink = `/channel/${channel.handle || channel.id}`;

  if (variant === 'compact') {
    return (
      <Link
        to={channelLink}
        className={`flex items-center space-x-4 p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors ${className}`}
      >
        <img
          src={avatarUrl}
          alt={channel.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-grow">
          <h3 className="font-semibold">{channel.name}</h3>
          <p className="text-sm text-gray-400">
            {channel.subscribers_count?.toLocaleString()} subscribers
          </p>
        </div>
        <SubscribeButton
          channelId={channel.id}
          className="px-4 py-2 rounded-full font-bold"
        />
      </Link>
    );
  }

  return (
    <motion.div
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <Link to={channelLink}>
        <div className="relative aspect-video">
          <img
            src={coverImageUrl}
            alt={`${channel.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <div className="absolute bottom-4 left-4 flex items-center">
            <img
              src={avatarUrl}
              alt={`${channel.name} owner`}
              className="w-16 h-16 rounded-full border-4 border-white shadow-md"
            />
          </div>
        </div>
        <div className="p-6">
          <h3 className="font-bold text-xl mb-2 truncate">{channel.name}</h3>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-300 flex items-center">
              <Users size={16} className="mr-1 text-[#fa7517]" />
              {channel.subscribers_count?.toLocaleString() || 0}
            </span>
            <span className="text-sm text-gray-300 flex items-center">
              <Video size={16} className="mr-1 text-[#fa7517]" />
              {channel.videos_count || 0}
            </span>
          </div>
          <SubscribeButton
            channelId={channel.id}
            className="w-full"
          />
        </div>
      </Link>
    </motion.div>
  );
};

export default ChannelCard;
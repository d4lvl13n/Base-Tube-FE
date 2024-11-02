import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Video, CheckCircle } from 'lucide-react';
import { Channel } from '../../../types/channel';
import { subscribeToChannel, unsubscribeFromChannel } from '../../../api/channel';

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
  const [isSubscribed, setIsSubscribed] = useState(channel.subscribeStatus === 1);

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking subscribe button
    try {
      if (isSubscribed) {
        await unsubscribeFromChannel(channel.id.toString());
      } else {
        await subscribeToChannel(channel.id.toString());
      }
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  const coverImageUrl = channel.channel_image_path
    ? `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
    : '/assets/default-cover.jpg';

  const avatarUrl = channel.ownerPicture
    ? `${process.env.REACT_APP_API_URL}/${channel.ownerPicture}`
    : '/assets/default-avatar.jpg';

  if (variant === 'compact') {
    return (
      <Link
        to={`/channel/${channel.id}`}
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
        <motion.button
          onClick={handleSubscribe}
          className={`px-4 py-2 rounded-full font-bold ${
            isSubscribed
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-[#fa7517] text-black hover:bg-[#ff8c3a]'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSubscribed ? (
            <>
              <CheckCircle className="inline-block mr-2" size={18} />
              Subscribed
            </>
          ) : (
            'Subscribe'
          )}
        </motion.button>
      </Link>
    );
  }

  return (
    <motion.div
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <Link to={`/channel/${channel.id}`}>
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
              {channel.videosCount || 0}
            </span>
          </div>
          <motion.button
            onClick={handleSubscribe}
            className={`w-full py-2 rounded-full font-bold transition-all duration-300 ${
              isSubscribed
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gradient-to-r from-[#fa7517] to-[#ffa041] text-black hover:shadow-lg'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubscribed ? (
              <>
                <CheckCircle className="inline-block mr-2" size={18} />
                Subscribed
              </>
            ) : (
              'Subscribe'
            )}
          </motion.button>
        </div>
      </Link>
    </motion.div>
  );
};

export default ChannelCard;
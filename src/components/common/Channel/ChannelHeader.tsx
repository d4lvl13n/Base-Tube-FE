// src/components/common/Channel/ChannelHeader.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Channel } from '../../../types/channel';
import { Facebook, Twitter, Instagram, Users, Video } from 'lucide-react';
import { SubscribeButton } from '../buttons/SubscribeButton';
import RichTextDisplay from '../RichTextDisplay';

interface ChannelHeaderProps {
  channel: Channel;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel }) => {
  console.log('Channel data in header:', {
    channel_image_url: channel.channel_image_url,
    channel_image_path: channel.channel_image_path
  });

  // Match the EXACT fallback logic used by ChannelPreviewCard:
  const coverImageUrl =
    channel.channel_image_url ||
    (channel.channel_image_path
      ? channel.channel_image_path.startsWith('http')
        ? channel.channel_image_path
        : `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
      : '/assets/default-cover.jpg');

  // Standardized avatar logic
  const rawAvatar = channel.ownerProfileImage || '';
  const avatarUrl = rawAvatar
    ? (rawAvatar.startsWith('http')
      ? rawAvatar
      : `${process.env.REACT_APP_API_URL}/${rawAvatar}`)
    : '/assets/default-avatar.jpg';

  return (
    <motion.div
      className="relative overflow-hidden pt-16"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Banner Image */}
      <div className="h-80 overflow-hidden">
        <img
          src={coverImageUrl}
          alt={`${channel.name} cover`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Channel Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
        <div className="flex items-end space-x-6 mb-4">
          <img
            src={avatarUrl}
            alt={channel.name}
            className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
          />
          <div className="flex-grow">
            <h1 className="text-4xl font-bold text-white mb-2">{channel.name}</h1>
            <div className="flex items-center space-x-4 text-gray-300">
              <span className="flex items-center">
                <Users size={18} className="mr-2 text-[#fa7517]" />
                {channel.subscribers_count?.toLocaleString() || 0} subscribers
              </span>
              <span className="flex items-center">
                <Video size={16} className="mr-1 text-[#fa7517]" />
                {(channel.videos_count ?? 0).toLocaleString()} videos
              </span>
            </div>
          </div>
          <div className="flex space-x-4">
            {channel.facebook_link && (
              <a href={channel.facebook_link} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#fa7517] transition-colors">
                <Facebook size={24} />
              </a>
            )}
            {channel.twitter_link && (
              <a href={channel.twitter_link} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#fa7517] transition-colors">
                <Twitter size={24} />
              </a>
            )}
            {channel.instagram_link && (
              <a href={channel.instagram_link} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#fa7517] transition-colors">
                <Instagram size={24} />
              </a>
            )}
          </div>
          {!channel.isOwner && (
            <SubscribeButton
              channelId={channel.id}
              className="ml-4"
            />
          )}
        </div>

        {/* Channel Description */}
        <div className="text-gray-300 mt-4 max-w-3xl">
          <RichTextDisplay content={channel.description || ''} />
        </div>
      </div>
    </motion.div>
  );
};

export default ChannelHeader;

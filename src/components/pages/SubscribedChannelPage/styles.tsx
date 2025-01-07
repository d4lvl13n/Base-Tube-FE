import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, ExternalLink, Clock } from 'lucide-react';
import { SubscribedChannel } from './types';
import { SortSelectProps, PageSizeSelectProps, SortOption } from './types';

interface ChannelGridProps {
  children: React.ReactNode;
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 
                    gap-4 sm:gap-6 mt-8 mx-auto max-w-[2400px]">
      {children}
    </div>
  );
};

export const SortSelect: React.FC<SortSelectProps> = ({ value, onChange, className }) => {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className={`bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 
                 hover:border-[#fa7517] transition-colors ${className}`}
    >
      <option value="subscribers_count">Most Popular</option>
      <option value="createdAt">Recently Added</option>
      <option value="name">Alphabetical</option>
    </select>
  );
};

export const PageSizeSelect: React.FC<PageSizeSelectProps> = ({ value, onChange, className }) => {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 
                 hover:border-[#fa7517] transition-colors ${className}`}
    >
      <option value={12}>12 per page</option>
      <option value={24}>24 per page</option>
      <option value={48}>48 per page</option>
    </select>
  );
};

export const SubscribedChannelCard: React.FC<{ 
  channel: SubscribedChannel;
  onWatched?: (channelId: number) => void;
}> = ({ channel, onWatched }) => {
  // Standardized cover image logic
  const coverImageUrl = channel.channel_image_url
    ? channel.channel_image_url
    : (channel.channel_image_path
      ? channel.channel_image_path.startsWith('http')
        ? channel.channel_image_path
        : `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
      : '/assets/default-cover.jpg'
    );

  // Standardized avatar logic
  const rawAvatar =
    channel.ownerProfileImage ||
    channel.user?.profile_image_url ||
    '';

  const avatarUrl = rawAvatar
    ? (rawAvatar.startsWith('http')
      ? rawAvatar
      : `${process.env.REACT_APP_API_URL}/${rawAvatar}`)
    : '/assets/default-avatar.jpg';

  const ownerName = channel.ownerUsername || channel.user?.username || 'Unknown';
  const createdDate = new Date(channel.createdAt).toLocaleDateString();

  return (
    <motion.div
      className="relative flex-shrink-0 w-full group"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      {channel.hasNewContent && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-1 -left-1 z-20"
          onClick={(e) => {
            e.stopPropagation();
            onWatched?.(channel.id);
          }}
        >
          <div className="relative cursor-pointer group/badge">
            {/* Pulsing background effect */}
            <motion.div
              className="absolute inset-0 rounded-lg bg-[#fa7517]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Badge content */}
            <div className="relative flex items-center gap-1.5 bg-gradient-to-r from-[#fa7517] to-[#fa9517] 
                          text-white px-3 py-1.5 rounded-lg shadow-lg 
                          transform transition-all duration-300
                          group-hover/badge:translate-y-[-2px] group-hover/badge:shadow-xl">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-sm font-medium whitespace-nowrap">New Content</span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="h-48 relative overflow-hidden rounded-xl">
        {/* Hover border effect */}
        <div className="absolute inset-0 z-10 rounded-xl border-2 border-transparent 
                     group-hover:border-[#fa7517] group-hover:shadow-[0_0_15px_rgba(250,117,23,0.3)]
                     transition-all duration-300" />

        <motion.img 
          src={coverImageUrl}
          alt={`${channel.name} cover`}
          className="w-full h-full object-cover transition-all duration-500
                    group-hover:scale-110 group-hover:brightness-75"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end space-x-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#fa7517] to-[#fa9517] opacity-0 
                            group-hover:opacity-100 blur-md transition-opacity duration-300" />
                <img
                  src={avatarUrl}
                  alt={channel.name}
                  className="relative w-16 h-16 rounded-full border-2 border-white shadow-lg 
                         transform transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              <motion.div 
                className="flex-grow"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{channel.name}</h3>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-300">@{channel.handle}</p>
                  {channel.isOwner && (
                    <span className="bg-[#fa7517]/20 text-[#fa7517] px-2 py-0.5 rounded text-xs">
                      Owner
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/90 to-black/70 
                    opacity-0 group-hover:opacity-100 transition-all duration-300
                    flex flex-col justify-between p-6 transform translate-y-2 
                    group-hover:translate-y-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400">Joined {createdDate}</span>
            </div>
            <Link
              to={`/channel/${channel.handle}`}
              className="p-2 bg-[#fa7517] rounded-lg transition-all duration-300
                     text-white hover:bg-[#fa9517] hover:scale-110"
            >
              <ExternalLink className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {channel.description && (
              <p className="text-gray-100 text-sm line-clamp-2 
                       transform transition-all duration-300">
                {channel.description}
              </p>
            )}
            <div className="flex items-center justify-between text-gray-100">
              <span className="flex items-center group-hover:text-[#fa7517] transition-colors">
                <Users size={16} className="mr-2" />
                {channel.subscribers_count?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-gray-400">
                by {ownerName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {channel.last_video_at && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
          Last video: {new Date(channel.last_video_at).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
};

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl my-4">
    <p>{message}</p>
  </div>
);
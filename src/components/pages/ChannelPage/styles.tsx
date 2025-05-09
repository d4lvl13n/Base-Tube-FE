// src/components/ChannelPage/styles.tsx
import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../../common/Header';
import Sidebar from '../../common/Sidebar';
import PlaceholderChannelCard from '../../common/PlaceholderChannelCard';
import FloatingNavigation from '../../common/FloatingNavigation';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ChannelCardProps, ChannelPageStylesProps } from './types';
import { ANIMATIONS, TAILWIND_CLASSES } from '../../../constants/animations';
import { processImageUrl } from '../../../utils/imageUtils';

export const ChannelPageLayout: React.FC<ChannelPageStylesProps> = memo(({
  channels = [],
  loading,
  error,
  hasMore,
  sort,
  handleLoadMore,
  handleSortChange,
  navigationOptions,
}) => {
  const showInitialLoader = loading && channels.length === 0 && !error;

  return (
    <div className="bg-[#000000] text-white min-h-screen overflow-x-hidden">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <div className="flex pt-16">
        <Sidebar className="fixed left-0 top-16 bottom-0 z-40" />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1920px] mx-auto w-full ml-16">
          <motion.h1 
            className="text-3xl sm:text-4xl font-bold mb-8 text-center lg:text-left"
            {...ANIMATIONS.pageTitle}
          >
            Discover Amazing Channels
          </motion.h1>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="text-red-500 mb-4 text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {showInitialLoader && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(12).fill(null).map((_, i) => (
                <PlaceholderChannelCard key={i} />
              ))}
            </div>
          )}

          {!showInitialLoader && channels.length > 0 && (
            <InfiniteScroll
              dataLength={channels.length}
              next={handleLoadMore}
              hasMore={hasMore}
              loader={
                <motion.div 
                  className="flex justify-center mt-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#fa7517]" />
                </motion.div>
              }
              endMessage={
                <p className="text-center mt-8 text-gray-400">
                  You've seen all channels!
                </p>
              }
            >
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                layout
              >
                {channels.map(channel => (
                  <ChannelCard key={channel.id} channel={channel} />
                ))}
              </motion.div>
            </InfiniteScroll>
          )}

          {!showInitialLoader && channels.length === 0 && !loading && !error && (
            <p className="text-center text-gray-400 mt-8">No channels found.</p>
          )}
        </main>
      </div>

      <FloatingNavigation
        options={navigationOptions}
        activeOption={sort}
        setActiveOption={handleSortChange}
      />
    </div>
  );
});

export const ChannelCard: React.FC<ChannelCardProps> = memo(({ channel }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const coverImageUrl = channel.channel_image_url || 
    (channel.channel_image_path
      ? channel.channel_image_path.startsWith('http')
        ? channel.channel_image_path
        : `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
      : '/assets/default-cover.jpg');
  
  const avatarUrl = processImageUrl(
    channel.ownerProfileImage, 
    '/assets/default-avatar.jpg'
  );

  return (
    <motion.div
      {...ANIMATIONS.card}
      className={`${TAILWIND_CLASSES.channelCard} group`}
    >
      <div className="h-48 sm:h-56 relative overflow-hidden">
        <motion.img 
          src={coverImageUrl}
          alt={`${channel.name} cover`}
          className={`w-full h-full object-cover transition-all duration-500
                     group-hover:scale-110 group-hover:brightness-75
                     ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
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
                <p className="text-gray-300">@{channel.handle}</p>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/90 to-black/70 
                      opacity-0 group-hover:opacity-100 transition-all duration-300
                      flex flex-col justify-between p-6 transform translate-y-2 
                      group-hover:translate-y-0">
          <div className="flex justify-end">
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
            <div className="flex items-center text-gray-100">
              <span className="flex items-center group-hover:text-[#fa7517] transition-colors">
                <Users size={16} className="mr-2" />
                {channel.subscribers_count?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Add display names for better debugging
ChannelPageLayout.displayName = 'ChannelPageLayout';ChannelCard.displayName = 'ChannelCard';

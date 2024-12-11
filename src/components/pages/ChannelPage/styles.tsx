// src/components/ChannelPage/styles.tsx
import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Video, ExternalLink } from 'lucide-react';
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
  sortOptions,
  isLoadingMore
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

          <motion.div 
            className="flex flex-wrap justify-center lg:justify-start space-x-2 sm:space-x-4 mb-8"
            {...ANIMATIONS.sortOptions}
          >
            {sortOptions.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => handleSortChange(key)}
                className={TAILWIND_CLASSES.sortButton(sort === key)}
              >
                <Icon className="inline-block mr-2" size={18} />
                {label}
              </button>
            ))}
          </motion.div>

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
        options={sortOptions}
        activeOption={sort}
        setActiveOption={handleSortChange}
      />
    </div>
  );
});

export const ChannelCard: React.FC<ChannelCardProps> = memo(({ channel }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const coverImageUrl = processImageUrl(
    channel.channel_image_path, 
    '/assets/default-cover.jpg'
  );
  
  const avatarUrl = processImageUrl(
    channel.ownerProfileImage, 
    '/assets/default-avatar.jpg'
  );

  return (
    <motion.div
      {...ANIMATIONS.card}
      className={TAILWIND_CLASSES.channelCard}
    >
      <div className="h-40 relative">
        <motion.img 
          src={coverImageUrl}
          alt={`${channel.name} cover`}
          className={`w-full h-full object-cover transition-opacity duration-300
                     ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end space-x-4">
              <img
                src={avatarUrl}
                alt={channel.name}
                className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
              />
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-white mb-1">{channel.name}</h3>
                <p className="text-gray-300">@{channel.handle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 
                      transition-opacity duration-300 flex flex-col justify-between p-4">
          <div className="flex justify-end">
            <Link
              to={`/channel/${channel.handle}`}
              className="p-2 bg-[#fa7517]/10 rounded-lg transition-colors 
                       text-white hover:text-[#fa7517]"
            >
              <ExternalLink className="w-5 h-5" />
            </Link>
          </div>
          <div className="space-y-4">
            {channel.description && (
              <p className="text-gray-300 text-sm line-clamp-2">
                {channel.description}
              </p>
            )}
            <div className="flex items-center space-x-4 text-gray-300">
              <span className="flex items-center">
                <Users size={14} className="mr-1 text-[#fa7517]" />
                {channel.subscribers_count.toLocaleString()} subscribers
              </span>
              <span className="flex items-center">
                <Video size={14} className="mr-1 text-[#fa7517]" />
                {channel.videosCount?.toLocaleString() || '0'} videos
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Add display names for better debugging
ChannelPageLayout.displayName = 'ChannelPageLayout';
ChannelCard.displayName = 'ChannelCard';
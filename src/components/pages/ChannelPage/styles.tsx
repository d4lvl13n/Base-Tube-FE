// src/components/ChannelPage/styles.tsx
import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Plus, Users, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../../common/Header';
import Sidebar from '../../common/Sidebar';
import PlaceholderChannelCard from '../../common/PlaceholderChannelCard';
import FloatingNavigation from '../../common/FloatingNavigation';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ChannelCardProps, ChannelPageStylesProps } from './types';
import { ANIMATIONS } from '../../../constants/animations';
import { processImageUrl } from '../../../utils/imageUtils';
import { useNavigation } from '../../../contexts/NavigationContext';
import { htmlToPlainText } from '../../../utils/html';

export const ChannelPageLayout: React.FC<ChannelPageStylesProps> = memo(({
  channels = [],
  total,
  loading,
  error,
  hasMore,
  sort,
  handleLoadMore,
  handleSortChange,
  navigationOptions,
}) => {
  const { navStyle } = useNavigation();
  const isFloatingNav = navStyle === 'floating';
  const showInitialLoader = loading && channels.length === 0 && !error;
  const activeSortLabel = navigationOptions.find((option) => option.key === sort)?.label || 'Channels';

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <div className="flex pt-16">
        <Sidebar className={`${isFloatingNav ? '' : 'fixed left-0 top-16 bottom-0 z-40'}`} />
        <main
          className={`min-h-[calc(100vh-64px)] flex-1 p-4 sm:p-6 md:p-8 ${isFloatingNav ? '' : 'ml-16'}`}
        >
          <div className="mx-auto w-full max-w-[1920px] pb-28">
            <motion.div
              className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
              {...ANIMATIONS.pageTitle}
            >
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#fa7517]/20 bg-[#fa7517]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ffb37b]">
                  {activeSortLabel}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-normal text-white">
                  Discover Amazing Channels
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
                  Find creators, communities, and premium content surfaces across Base.Tube.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-[rgba(214,235,253,0.12)] bg-black/[0.72] px-4 py-2 text-sm text-gray-300 shadow-[0_0_0_1px_rgba(176,199,217,0.08)]">
                  <span className="font-semibold text-white">{total.toLocaleString()}</span> channels indexed
                </div>
                <Link
                  to="/create-channel"
                  className="inline-flex items-center gap-2 rounded-full border border-[#fa7517]/50 bg-[#fa7517] px-4 py-2 text-sm font-semibold text-black shadow-[0_0_22px_rgba(250,117,23,0.24)] transition hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Create Channel
                </Link>
              </div>
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
          </div>
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
  const coverImageUrl = processImageUrl(
    channel.channel_image_url || channel.channel_image_path,
    '/assets/default-cover.jpg'
  );
  
  const avatarUrl = processImageUrl(
    channel.ownerProfileImage, 
    '/assets/default-avatar.jpg'
  );
  const description = htmlToPlainText(channel.description);

  return (
    <motion.article
      {...ANIMATIONS.card}
      className="group overflow-hidden rounded-xl border border-[rgba(214,235,253,0.10)] bg-[#08080a] shadow-[0_0_0_1px_rgba(176,199,217,0.05),0_16px_40px_rgba(0,0,0,0.36)]"
    >
      <div className="h-48 sm:h-56 relative overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-[#111114]" />
        )}
        <motion.img 
          src={coverImageUrl}
          alt={`${channel.name} cover`}
          className={`w-full h-full object-cover transition-all duration-500
                     group-hover:scale-110 group-hover:brightness-75
                     ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
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

        <div className="absolute inset-0 bg-black/[0.92]
                      opacity-0 group-hover:opacity-100 transition-all duration-300
                      flex flex-col justify-between p-5 transform translate-y-2
                      group-hover:translate-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/[0.42]">Channel</p>
              <h3 className="mt-1 line-clamp-1 text-lg font-bold text-white">{channel.name}</h3>
            </div>
            <Link
              to={`/channel/${channel.handle}`}
              aria-label={`Open ${channel.name}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#fa7517]/50 bg-[#fa7517] text-black shadow-[0_0_22px_rgba(250,117,23,0.28)] transition-all duration-300 hover:scale-105"
            >
              <ExternalLink className="h-[18px] w-[18px]" />
            </Link>
          </div>
          
          <div className="space-y-4 rounded-lg border border-white/10 bg-[#0b0b0d] p-4">
            {description && (
              <p className="line-clamp-3 text-sm leading-5 text-gray-200">
                {description}
              </p>
            )}
            <div className="flex items-center justify-between gap-3 text-gray-100">
              <span className="flex items-center text-sm font-medium text-[#fa7517]">
                <Users size={16} className="mr-2" />
                {channel.subscribers_count?.toLocaleString() || 0}
              </span>
              <span className="flex items-center text-sm text-gray-500">
                <Video size={15} className="mr-1.5" />
                {channel.videos_count?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
});

// Add display names for better debugging
ChannelPageLayout.displayName = 'ChannelPageLayout';
ChannelCard.displayName = 'ChannelCard';

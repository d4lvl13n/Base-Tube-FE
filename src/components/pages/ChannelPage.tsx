import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import { getChannels, subscribeToChannel, unsubscribeFromChannel } from '../../api/channel';
import { Channel } from '../../types/channel';
import { Users, Video, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import PlaceholderChannelCard from '../common/PlaceholderChannelCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import FloatingNavigation from '../common/FloatingNavigation';

const ChannelPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('subscribers_count');
  const [error, setError] = useState<string | null>(null);

  const sortOptions = [
    { key: 'subscribers_count', icon: Users, label: 'Most Subscribers' },
    { key: 'updatedAt', icon: Clock, label: 'Recently Active' },
    { key: 'createdAt', icon: TrendingUp, label: 'New Channels' },
  ];

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`Fetching channels: page=${page}, sort=${sort}`);
      const response = await getChannels(page, 12, sort);
      console.log('Channels response:', response);
      if (response.success && Array.isArray(response.data)) {
        setChannels((prevChannels) =>
          page === 1 ? response.data : [...prevChannels, ...response.data]
        );
        setHasMore(page < response.totalPages);
        setError(null);
      } else {
        console.error('Invalid response format:', response);
        setError('Failed to fetch channels. Please try again later.');
        setChannels([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      setError('An error occurred while fetching channels. Please try again later.');
      setChannels([]);
      setHasMore(false);
    }
    setLoading(false);
  }, [page, sort]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleSortChange = (newSort: string) => {
    if (newSort !== sort) {
      setSort(newSort);
      setPage(1);
      setChannels([]);
      setHasMore(true);
    }
  };

  return (
    <div className="bg-[#000000] text-white min-h-screen overflow-x-hidden">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <div className="flex pt-16">
        <Sidebar className="fixed left-0 top-16 bottom-0 z-40" />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1920px] mx-auto w-full ml-16" id="scrollableDiv">
          <motion.h1 
            className="text-3xl sm:text-4xl font-bold mb-8 text-center lg:text-left"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Discover Amazing Channels
          </motion.h1>

          {/* Sorting options */}
          <motion.div 
            className="flex flex-wrap justify-center lg:justify-start space-x-2 sm:space-x-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {sortOptions.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => handleSortChange(key)}
                className={`px-4 py-2 rounded-full transition-all duration-300 ease-in-out ${
                  sort === key 
                    ? 'bg-gradient-to-r from-[#fa7517] to-[#ffa041] text-black shadow-lg' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <Icon className="inline-block mr-2" size={18} />
                {label}
              </button>
            ))}
          </motion.div>

          {/* Error message */}
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

          <InfiniteScroll
            dataLength={channels.length}
            next={handleLoadMore}
            hasMore={hasMore}
            loader={
              <motion.div 
                className="flex justify-center mt-12"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#fa7517]"></div>
              </motion.div>
            }
            endMessage={
              <p style={{ textAlign: 'center', marginTop: '20px' }}>
                <b>You have seen all channels!</b>
              </p>
            }
          >
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {channels.length > 0
                ? channels.map((channel) => (
                    <ChannelCard key={channel.id} channel={channel} />
                  ))
                : !loading &&
                  Array(12)
                    .fill(null)
                    .map((_, index) => <PlaceholderChannelCard key={index} />)}
            </motion.div>
          </InfiniteScroll>
        </main>
      </div>
      <FloatingNavigation
        options={sortOptions}
        activeOption={sort}
        setActiveOption={handleSortChange}
      />
    </div>
  );
};

const ChannelCard: React.FC<{ channel: Channel }> = ({ channel }) => {
  const [isSubscribed, setIsSubscribed] = useState(channel.isSubscribed);

  const handleSubscribe = async () => {
    try {
      if (isSubscribed) {
        await unsubscribeFromChannel(channel.id);
      } else {
        await subscribeToChannel(channel.id);
      }
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  const coverImageUrl = channel.channel_image_path
    ? `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
    : '/assets/default-cover.jpg';

  const avatarUrl = channel.ownerProfileImage
    ? `${process.env.REACT_APP_API_URL}/${channel.ownerProfileImage}`
    : '/assets/default-avatar.jpg';

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
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
        <button
          onClick={handleSubscribe}
          className={`w-full py-2 rounded-full font-bold transition-all duration-300 ${
            isSubscribed
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gradient-to-r from-[#fa7517] to-[#ffa041] text-black hover:shadow-lg'
          }`}
        >
          {isSubscribed ? (
            <>
              <CheckCircle className="inline-block mr-2" size={18} />
              Subscribed
            </>
          ) : (
            'Subscribe'
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ChannelPage;

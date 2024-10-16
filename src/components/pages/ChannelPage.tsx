import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import { getChannels, subscribeToChannel, unsubscribeFromChannel } from '../../api/channel';
import { Channel } from '../../types/channel';
import { Users, Video, Clock, TrendingUp } from 'lucide-react';

const ChannelPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('subscribers_count');

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getChannels(page, 12, sort);
      if (response.success && Array.isArray(response.data)) {
        setChannels((prevChannels) =>
          page === 1 ? response.data : [...prevChannels, ...response.data]
        );
        setHasMore(page < response.totalPages);
      } else {
        console.error('Invalid response format:', response);
        setChannels([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
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
      <Header />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-2 sm:p-4 md:p-6 pr-16 max-w-[1920px] mx-auto w-full">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Explore Channels</h1>

          {/* Sorting options */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => handleSortChange('subscribers_count')}
              className={`px-4 py-2 rounded-full ${
                sort === 'subscribers_count' ? 'bg-[#fa7517] text-black' : 'bg-gray-800'
              }`}
            >
              <Users className="inline-block mr-2" size={18} />
              Most Subscribers
            </button>
            <button
              onClick={() => handleSortChange('updatedAt')}
              className={`px-4 py-2 rounded-full ${
                sort === 'updatedAt' ? 'bg-[#fa7517] text-black' : 'bg-gray-800'
              }`}
            >
              <Clock className="inline-block mr-2" size={18} />
              Recently Active
            </button>
            <button
              onClick={() => handleSortChange('createdAt')}
              className={`px-4 py-2 rounded-full ${
                sort === 'createdAt' ? 'bg-[#fa7517] text-black' : 'bg-gray-800'
              }`}
            >
              <TrendingUp className="inline-block mr-2" size={18} />
              New Channels
            </button>
          </div>

          {/* Channel grid */}
          {channels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {channels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          ) : (
            !loading && <p>No channels found.</p>
          )}

          {/* Load more button */}
          {!loading && hasMore && (
            <div className="flex justify-center mt-8">
              <motion.button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-[#fa7517] text-black rounded-full font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Load More
              </motion.button>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center mt-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fa7517]"></div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const ChannelCard: React.FC<{ channel: Channel }> = ({ channel }) => {
  const [isSubscribed, setIsSubscribed] = useState(channel.subscribeStatus === 1);

  const handleSubscribe = async () => {
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

  const coverImageUrl = channel.cover_image_path
    ? `${process.env.REACT_APP_API_URL}/${channel.cover_image_path}`
    : '/assets/default-cover.jpg';

  const avatarUrl = channel.channel_image_path
    ? `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
    : '/assets/default-avatar.jpg';

  return (
    <motion.div
      className="bg-gray-800 rounded-lg overflow-hidden"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <div className="relative aspect-video">
        <img
          src={coverImageUrl}
          alt={`${channel.name} banner`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 left-4 flex items-center">
          <img
            src={avatarUrl}
            alt={channel.name}
            className="w-12 h-12 rounded-full border-2 border-white"
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{channel.name}</h3>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400 flex items-center">
            <Users size={16} className="mr-1" />
            {channel.subscribers_count?.toLocaleString() || 0} subscribers
          </span>
          <span className="text-sm text-gray-400 flex items-center">
            <Video size={16} className="mr-1" />
            {channel.videosCount || 0} videos
          </span>
        </div>
        <button
          onClick={handleSubscribe}
          className="w-full bg-[#fa7517] text-black py-2 rounded-full font-bold"
        >
          {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      </div>
    </motion.div>
  );
};

export default ChannelPage;
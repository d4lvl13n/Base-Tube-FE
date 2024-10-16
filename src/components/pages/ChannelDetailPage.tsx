// src/pages/ChannelDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import ChannelHeader from '../common/Channel/ChannelHeader';
import VideoGrid from '../common/Channel/VideoGrid';
import { getChannelDetails, getChannelVideos } from '../../api/channel';
import { Channel } from '../../types/channel';
import { Video } from '../../types/video';

const ChannelDetailPage: React.FC = () => {
  const { id: channelId } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!channelId) {
        setError('Channel ID is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [channelData, videosData] = await Promise.all([
          getChannelDetails(channelId),
          getChannelVideos(channelId, 1)
        ]);
        setChannel(channelData.channel);
        setVideos(videosData.data);
        setHasMore(videosData.pagination.page < videosData.pagination.totalPages);
      } catch (err) {
        setError('Failed to load channel data. Please try again.');
      }
      setLoading(false);
    };

    fetchChannelData();
  }, [channelId]);

  const loadMoreVideos = async () => {
    if (!hasMore || loading || !channelId) return;
    
    setLoading(true);
    try {
      const videosData = await getChannelVideos(channelId, page + 1);
      setVideos(prev => [...prev, ...videosData.data]);
      setPage(prev => prev + 1);
      setHasMore(videosData.pagination.page < videosData.pagination.totalPages);
    } catch (err) {
      setError('Failed to load more videos. Please try again.');
    }
    setLoading(false);
  };

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence>
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center h-screen"
              >
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#fa7517]"></div>
              </motion.div>
            ) : channel ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ChannelHeader channel={channel} activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="p-6">
                  {activeTab === 'videos' && (
                    <VideoGrid videos={videos} loadMore={loadMoreVideos} hasMore={hasMore} />
                  )}
                  {activeTab === 'about' && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4">About</h2>
                      <p>{channel.description}</p>
                    </div>
                  )}
                  {activeTab === 'community' && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Community</h2>
                      <p>Community features coming soon!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ChannelDetailPage;
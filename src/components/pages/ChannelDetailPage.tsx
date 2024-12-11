// src/components/pages/ChannelDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import ChannelHeader from '../common/Channel/ChannelHeader';
import VideoGrid from '../common/Channel/VideoGrid';
import { getChannelVideos } from '../../api/channel';
import { Video } from '../../types/video';
import { useChannelData } from '../../hooks/useChannelData';
import RichTextDisplay from '../common/RichTextDisplay';

const ChannelDetailPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  console.log('Identifier:', identifier); // For debugging

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');

  const {
    channel,
    isLoading: isChannelLoading,
    error: channelError,
  } = useChannelData(identifier);

  useEffect(() => {
    if (channelError) {
      setError('Failed to load channel data. Please try again.');
    } else {
      setError(null);
    }
  }, [channelError]);

  useEffect(() => {
    if (!channel || !channel.id) {
      return; // Wait until channel data is available
    }

    const fetchChannelVideos = async () => {
      setLoading(true);
      try {
        const videosData = await getChannelVideos(channel.id.toString(), 1);
        setVideos(videosData.data);
        setHasMore(videosData.pagination.page < videosData.pagination.totalPages);
        setPage(1);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error(err);
        setError('Failed to load channel videos. Please try again.');
      }
      setLoading(false);
    };

    fetchChannelVideos();
  }, [channel]);

  const loadMoreVideos = async () => {
    if (!hasMore || loading || !channel || !channel.id) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const videosData = await getChannelVideos(channel.id.toString(), nextPage);
      setVideos((prev) => [...prev, ...videosData.data]);
      setPage(nextPage);
      setHasMore(videosData.pagination.page < videosData.pagination.totalPages);
    } catch (err) {
      console.error(err);
      setError('Failed to load more videos. Please try again.');
    }
    setLoading(false);
  };

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  if (isChannelLoading || !channel) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#fa7517]"></div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ChannelHeader
                channel={channel}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              <div className="p-6">
                {activeTab === 'videos' && (
                  <VideoGrid
                    videos={videos}
                    loadMore={loadMoreVideos}
                    hasMore={hasMore}
                  />
                )}
                {activeTab === 'about' && (
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4">About</h2>
                    <div className="bg-gray-900/30 rounded-xl p-6 backdrop-blur-sm border border-gray-800/30">
                      <RichTextDisplay content={channel.description || ''} />
                    </div>
                  </div>
                )}
                {activeTab === 'community' && (
                  <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-bold mb-4">Community</h2>
                    <div className="bg-gray-900/30 rounded-xl p-6 backdrop-blur-sm border border-gray-800/30">
                      <p className="text-gray-400">Community features coming soon!</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ChannelDetailPage;
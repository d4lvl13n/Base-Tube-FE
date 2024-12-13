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
import ChannelTabs from '../common/Channel/ChannelTabs';

const ChannelDetailPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');

  const {
    channel,
    isLoading: isChannelLoading,
    error: channelError,
  } = useChannelData(identifier);

  useEffect(() => {
    if (!channel?.id) return;

    const fetchChannelVideos = async () => {
      setLoading(true);
      try {
        const videosData = await getChannelVideos(channel.id.toString(), 1);
        setVideos(videosData.data);
        setHasMore(videosData.pagination.page < videosData.pagination.totalPages);
        setPage(1);
        setVideoError(null);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setVideoError('Unable to load videos at this time. Please try again later.');
      }
      setLoading(false);
    };

    fetchChannelVideos();
  }, [channel?.id]);

  const loadMoreVideos = async () => {
    if (!hasMore || loading || !channel?.id) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const videosData = await getChannelVideos(channel.id.toString(), nextPage);
      setVideos((prev) => [...prev, ...videosData.data]);
      setPage(nextPage);
      setHasMore(videosData.pagination.page < videosData.pagination.totalPages);
    } catch (err) {
      console.error('Error loading more videos:', err);
      setVideoError('Failed to load more videos. Please try again.');
    }
    setLoading(false);
  };

  // If there's an error loading the channel itself, show that error
  if (channelError) {
    return (
      <div className="bg-black text-white min-h-screen">
        <Header />
        <div className="flex pt-16">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="text-center text-red-500 mt-10">
              Failed to load channel. Please try again.
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show loading state for the channel
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
              <ChannelHeader channel={channel} />
              <ChannelTabs 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />
              <div className="p-6">
                {activeTab === 'videos' && (
                  <>
                    {videoError ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <p className="text-red-400 text-center">{videoError}</p>
                        <button 
                          onClick={() => {
                            setVideoError(null);
                            if (channel?.id) {
                              const fetchVideos = async () => {
                                setLoading(true);
                                try {
                                  const videosData = await getChannelVideos(channel.id.toString(), 1);
                                  setVideos(videosData.data);
                                  setHasMore(videosData.pagination.page < videosData.pagination.totalPages);
                                  setPage(1);
                                  setVideoError(null);
                                } catch (err) {
                                  setVideoError('Unable to load videos. Please try again later.');
                                }
                                setLoading(false);
                              };
                              fetchVideos();
                            }
                          }}
                          className="mt-4 px-4 py-2 bg-[#fa7517] text-black rounded-lg hover:bg-[#fa9517] transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <VideoGrid
                        videos={videos}
                        loadMore={loadMoreVideos}
                        hasMore={hasMore}
                      />
                    )}
                  </>
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
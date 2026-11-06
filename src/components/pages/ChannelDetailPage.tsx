// src/components/pages/ChannelDetailPage.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChannelOverview } from '../../hooks/useChannelOverview';
import { useContentPrefetch } from '../../hooks/useContentPrefetch';
import { useContentReady } from '../../performance/useContentReady';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import ChannelHeader from '../common/Channel/ChannelHeader';
import VideoGrid from '../common/Channel/VideoGrid';
import RichTextDisplay from '../common/RichTextDisplay';
import ChannelTabs from '../common/Channel/ChannelTabs';
import { passApi } from '../../api/pass';
import { Link } from 'react-router-dom';

const ChannelDetailPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  
  const [activeTab, setActiveTab] = useState('videos');
  const overview = useChannelOverview(identifier);
  const { channel, videos } = overview;
  const isChannelLoading = overview.isLoading;
  const channelError = overview.error && !channel;
  const videoError = overview.isFetchNextPageError ? 'Failed to load more videos. Please try again.' : null;
  const prefetch = useContentPrefetch();
  useContentReady('channel_content_ready', Boolean(channel));
  const passes = useQuery({
    queryKey: ['channel-passes', channel?.id],
    queryFn: () => passApi.discoverPasses({ channel_id: String(channel!.id), limit: 24 }),
    enabled: Boolean(channel?.id) && activeTab === 'products',
    staleTime: 60_000,
  });
  const channelPasses = passes.data?.data ?? [];
  const passesLoading = passes.isLoading;
  const loadMoreVideos = () => {
    if (overview.hasNextPage && !overview.isFetching) void overview.fetchNextPage();
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
              Failed to load channel. <button onClick={() => void overview.refetch()} className="text-[#fa7517]">Try again</button>
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
        <main {...prefetch} className="flex-1 overflow-x-hidden">
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
                    {videoError && (
                      <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <p className="text-red-400">{videoError}</p>
                        <button onClick={() => void overview.fetchNextPage()} className="mt-4 px-4 py-2 bg-[#fa7517] text-black rounded-lg">Try Again</button>
                      </div>
                    )}
                    {videos.length === 0 && <p className="text-gray-400">No videos on this channel yet.</p>}
                    <VideoGrid videos={videos} loading={overview.isFetchingNextPage} loadMore={loadMoreVideos} hasMore={Boolean(overview.hasNextPage) && !overview.isFetchNextPageError} />
                  </>
                )}
                {activeTab === 'products' && (
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4">Passes</h2>
                    {passesLoading ? (
                      <p className="text-gray-400">Loading passes…</p>
                    ) : passes.isError ? (<p role="alert" className="text-gray-400">Passes could not be loaded. <button onClick={() => void passes.refetch()} className="text-[#fa7517]">Try again</button></p>) : channelPasses.length === 0 ? (
                      <p className="text-gray-400">No passes for sale on this channel yet.</p>
                    ) : (
                      <ul className="grid gap-4 sm:grid-cols-2">
                        {channelPasses.map((pass) => (
                          <li key={pass.id}>
                            <Link
                              to={`/p/${pass.slug || pass.id}`}
                              className="block rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-[#fa7517]/50"
                            >
                              <p className="font-medium text-white">{pass.title}</p>
                              <p className="text-sm text-gray-400 mt-1">{pass.formatted_price}</p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
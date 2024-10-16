import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoGrid from './VideoGrid';
import { Channel } from '../../../types/channel';
import { Video } from '../../../types/video';

interface ChannelContentProps {
  channel: Channel;
  videos: Video[];
  loadMore: () => void;
  hasMore: boolean;
}

const ChannelContent: React.FC<ChannelContentProps> = ({ channel, videos, loadMore, hasMore }) => {
  const [activeTab, setActiveTab] = useState('videos');

  const tabContent = {
    videos: <VideoGrid videos={videos} loadMore={loadMore} hasMore={hasMore} />,
    about: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">About</h2>
        <p>{channel.description}</p>
      </div>
    ),
    community: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Community</h2>
        <p>Community features coming soon!</p>
      </div>
    ),
  };

  return (
    <div>
      <div className="flex justify-center space-x-4 mb-6">
        {Object.keys(tabContent).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-full ${
              activeTab === tab ? 'bg-[#fa7517] text-black' : 'bg-gray-800 text-white'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {tabContent[activeTab as keyof typeof tabContent]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ChannelContent;
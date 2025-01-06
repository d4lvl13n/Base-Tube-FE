import React from 'react';
import { motion } from 'framer-motion';
import { Channel } from '../../../types/channel';
import { Users, Video } from 'lucide-react';

interface ChannelInfoProps {
  channel: Channel;
}

const ChannelInfo: React.FC<ChannelInfoProps> = ({ channel }) => {
  return (
    <motion.div 
      className="bg-gray-900 p-6 rounded-lg shadow-lg mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <div className="flex items-center">
            <Users className="mr-2 text-[#fa7517]" />
            <span>{(channel.subscribers_count ?? 0).toLocaleString()} subscribers</span>
          </div>
          <div className="flex items-center">
            <Video className="mr-2 text-[#fa7517]" />
            <span>{(channel.videos_count ?? 0).toLocaleString()} videos</span>
          </div>
        </div>
        {!channel.isOwner && (
          <button className="bg-[#fa7517] text-black px-6 py-2 rounded-full font-bold">
            Subscribe
          </button>
        )}
      </div>
      <p className="text-gray-300">{channel.description}</p>
    </motion.div>
  );
};

export default ChannelInfo;
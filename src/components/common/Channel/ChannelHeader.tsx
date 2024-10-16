// src/components/common/Channel/ChannelHeader.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Channel } from '../../../types/channel';
import { Facebook, Twitter, Instagram, Users, Video } from 'lucide-react';

interface ChannelHeaderProps {
  channel: Channel;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel, activeTab, setActiveTab }) => {
  const tabs = ['Videos', 'About', 'Community'];

  return (
    <motion.div 
      className="relative overflow-hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Banner Image */}
      <div className="h-80 overflow-hidden"> {/* Increased height */}
        <img 
          src={`${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`} 
          alt={`${channel.name} cover`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Channel Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
        <div className="flex items-end space-x-6 mb-4">
          <img 
            src={`${process.env.REACT_APP_API_URL}/${channel.ownerPicture}`} 
            alt={channel.name}
            className="w-28 h-28 rounded-full border-4 border-white shadow-lg" 
          />
          <div className="flex-grow">
            <h1 className="text-4xl font-bold text-white mb-2">{channel.name}</h1>
            <div className="flex items-center space-x-4 text-gray-300">
              <span className="flex items-center">
                <Users size={18} className="mr-2 text-[#fa7517]" />
                {channel.subscribers_count} subscribers
              </span>
              <span className="flex items-center">
                <Video size={18} className="mr-2 text-[#fa7517]" />
                {channel.videosCount} videos
              </span>
            </div>
          </div>
          <div className="flex space-x-4">
            {channel.facebook_link && (
              <a href={channel.facebook_link} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#fa7517] transition-colors">
                <Facebook size={24} />
              </a>
            )}
            {channel.twitter_link && (
              <a href={channel.twitter_link} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#fa7517] transition-colors">
                <Twitter size={24} />
              </a>
            )}
            {channel.instagram_link && (
              <a href={channel.instagram_link} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#fa7517] transition-colors">
                <Instagram size={24} />
              </a>
            )}
          </div>
          {!channel.isOwner && (
            <motion.button 
              className="bg-[#fa7517] text-black px-6 py-2 rounded-full font-bold hover:bg-[#ff8c3a] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Subscribe
            </motion.button>
          )}
        </div>

        {/* Channel Description */}
        <p className="text-gray-300 mt-4 max-w-3xl">{channel.description}</p>

        {/* Tabs */}
        <div className="flex space-x-4 mt-6">
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              className={`px-4 py-2 rounded-full ${
                activeTab === tab.toLowerCase() 
                  ? 'bg-[#fa7517] text-black' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              } transition-colors`}
              onClick={() => setActiveTab(tab.toLowerCase())}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ChannelHeader;
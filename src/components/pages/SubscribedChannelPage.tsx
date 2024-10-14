import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hexagon, Bell, Grid, List, ChevronRight, ChevronLeft, Play, Heart, MessageCircle } from 'lucide-react';

const SubscribedChannelPage = () => {
  const [viewMode, setViewMode] = useState('grid');

  const channels = [
    { name: 'CryptoVision', avatar: '/api/placeholder/50/50', newVideos: 3 },
    { name: 'Web3 Explorers', avatar: '/api/placeholder/50/50', newVideos: 1 },
    { name: 'DeFi Masters', avatar: '/api/placeholder/50/50', newVideos: 2 },
    { name: 'NFT Creatives', avatar: '/api/placeholder/50/50', newVideos: 0 },
    { name: 'Blockchain Basics', avatar: '/api/placeholder/50/50', newVideos: 5 },
  ];

  return (
    <div className="bg-black text-white h-screen w-screen overflow-hidden relative">
      {/* Deep black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-10">
        <motion.div whileHover={{ scale: 1.1 }}>
          <Hexagon size={40} className="text-[#fa7517]" />
        </motion.div>
        <motion.button 
          className="bg-[#fa7517] text-black px-4 py-2 rounded-full font-bold"
          whileHover={{ scale: 1.05 }}
        >
          Connect Wallet
        </motion.button>
      </header>

      {/* Channel navigation */}
      <nav className="absolute top-20 left-0 right-0 flex justify-center space-x-4 overflow-x-auto py-4 px-8">
        {channels.map((channel) => (
          <motion.div
            key={channel.name}
            className="flex flex-col items-center"
            whileHover={{ scale: 1.1 }}
          >
            <div className="relative">
              <img src={channel.avatar} alt={channel.name} className="w-12 h-12 rounded-full" />
              {channel.newVideos > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#fa7517] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {channel.newVideos}
                </div>
              )}
            </div>
            <span className="mt-2 text-sm">{channel.name}</span>
          </motion.div>
        ))}
      </nav>

      {/* View mode toggle */}
      <div className="absolute top-40 right-8 flex space-x-2 bg-black bg-opacity-50 rounded-full p-1">
        <motion.button 
          className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-[#fa7517] text-black' : 'text-white'}`}
          onClick={() => setViewMode('grid')}
          whileHover={{ scale: 1.1 }}
        >
          <Grid size={20} />
        </motion.button>
        <motion.button 
          className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-[#fa7517] text-black' : 'text-white'}`}
          onClick={() => setViewMode('list')}
          whileHover={{ scale: 1.1 }}
        >
          <List size={20} />
        </motion.button>
      </div>

      {/* Main content area */}
      <main className="absolute inset-0 mt-52 p-8 overflow-hidden">
        <motion.div 
          className={viewMode === 'grid' ? "grid grid-cols-3 gap-6" : "space-y-4"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {[...Array(9)].map((_, index) => (
            <motion.div 
              key={index}
              className={`bg-gray-900 bg-opacity-70 rounded-2xl overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}
              whileHover={{ scale: 1.05, zIndex: 1 }}
              style={{
                boxShadow: `0 0 20px 5px rgba(250, 117, 23, 0.3), 
                            0 0 60px 10px rgba(250, 117, 23, 0.2), 
                            0 0 100px 20px rgba(250, 117, 23, 0.1)`
              }}
            >
              <img 
                src={`/api/placeholder/400/225`} 
                alt={`Video ${index + 1}`} 
                className={viewMode === 'grid' ? "w-full h-48 object-cover" : "w-48 h-28 object-cover"}
              />
              <div className="p-4">
                <h3 className="font-semibold">New Developments in DeFi</h3>
                <p className="text-sm text-gray-300">DeFi Masters • 3 hours ago</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="flex items-center"><Play size={16} className="mr-1 text-[#fa7517]" /> 15K</span>
                  <span className="flex items-center"><Heart size={16} className="mr-1 text-[#fa7517]" /> 1.2K</span>
                  <span className="flex items-center"><MessageCircle size={16} className="mr-1 text-[#fa7517]" /> 234</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Floating action button */}
      <motion.div 
        className="absolute bottom-8 right-8 bg-[#fa7517] rounded-full p-4"
        whileHover={{ scale: 1.1 }}
      >
        <Bell size={24} className="text-black" />
      </motion.div>

      {/* Side navigation arrows */}
      <motion.div 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
        whileHover={{ scale: 1.1 }}
      >
        <ChevronLeft size={32} className="text-[#fa7517]" />
      </motion.div>
      <motion.div 
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
        whileHover={{ scale: 1.1 }}
      >
        <ChevronRight size={32} className="text-[#fa7517]" />
      </motion.div>
    </div>
  );
};

export default SubscribedChannelPage;

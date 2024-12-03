import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Hexagon, 
  Bell, 
  Grid, 
  List, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';
import { useChannelSubscription } from '../../hooks/useChannelSubscription';

interface Channel {
  id: number;
  name: string;
  ownerProfileImage: string;
  subscribers_count: number;
  isOwner: boolean;
  isSubscribed: boolean;
  unique_id: string;
  createdAt: string;
  updatedAt: string;
  newVideos: number;
}

const SubscribedChannelPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const { unsubscribe, isLoading } = useChannelSubscription();

  const handleUnsubscribe = async (channelId: number) => {
    try {
      await unsubscribe.mutateAsync(channelId);
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  };

  const channels: Channel[] = [
    { 
      id: 1,
      name: 'CryptoVision',
      ownerProfileImage: '/api/placeholder/50/50',
      subscribers_count: 0,
      isOwner: false,
      isSubscribed: true,
      unique_id: 'crypto-vision',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      newVideos: 3
    },
    { 
      id: 2,
      name: 'Web3 Explorers',
      ownerProfileImage: '/api/placeholder/50/50',
      subscribers_count: 0,
      isOwner: false,
      isSubscribed: true,
      unique_id: 'web3-explorers',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      newVideos: 1
    },
    { 
      id: 3,
      name: 'DeFi Masters',
      ownerProfileImage: '/api/placeholder/50/50',
      subscribers_count: 0,
      isOwner: false,
      isSubscribed: true,
      unique_id: 'defi-masters',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      newVideos: 2
    },
    { 
      id: 4,
      name: 'NFT Creatives',
      ownerProfileImage: '/api/placeholder/50/50',
      subscribers_count: 0,
      isOwner: false,
      isSubscribed: true,
      unique_id: 'nft-creatives',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      newVideos: 0
    },
    { 
      id: 5,
      name: 'Blockchain Basics',
      ownerProfileImage: '/api/placeholder/50/50',
      subscribers_count: 0,
      isOwner: false,
      isSubscribed: true,
      unique_id: 'blockchain-basics',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      newVideos: 5
    },
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
              <img src={channel.ownerProfileImage} alt={channel.name} className="w-12 h-12 rounded-full" />
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
          {channels.map((channel, index) => (
            <motion.div 
              key={index}
              className={`bg-gray-900 bg-opacity-70 rounded-2xl overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}
              whileHover={{ scale: 1.05, zIndex: 1 }}
            >
              {/* Channel content */}
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <img src={channel.ownerProfileImage} alt={channel.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="font-semibold">{channel.name}</h3>
                    {channel.newVideos > 0 && (
                      <span className="text-sm text-[#fa7517]">{channel.newVideos} new videos</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleUnsubscribe(channel.id)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-full ${
                    isLoading ? 'bg-gray-600' : 'bg-[#fa7517] hover:bg-[#ff8c3b]'
                  }`}
                >
                  {isLoading ? 'Loading...' : 'Unsubscribe'}
                </button>
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

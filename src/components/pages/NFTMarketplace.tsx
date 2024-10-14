import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hexagon, Search, Filter, Tag, Clock, Zap, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const NFTMarketplace = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Trending', 'New Releases', 'Ending Soon', 'Exclusive Content'];

  const nfts = [
    { id: 1, title: "Crypto Explorers S1", creator: "Web3 Visionaries", price: "50 $TUBE", timeLeft: "2d 5h", exclusive: true },
    { id: 2, title: "DeFi Mastery Course", creator: "FinTech Gurus", price: "75 $TUBE", timeLeft: "4d 12h", exclusive: false },
    { id: 3, title: "NFT Art Showcase", creator: "Digital Picassos", price: "30 $TUBE", timeLeft: "1d 3h", exclusive: true },
    { id: 4, title: "Blockchain Basics", creator: "Crypto 101", price: "25 $TUBE", timeLeft: "6d 8h", exclusive: false },
    { id: 5, title: "Web3 Gaming Pass", creator: "MetaGamers", price: "60 $TUBE", timeLeft: "3d 7h", exclusive: true },
    { id: 6, title: "Decentralized Future", creator: "DAOists", price: "45 $TUBE", timeLeft: "5d 9h", exclusive: false },
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
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <input 
              className="w-full bg-gray-800 bg-opacity-50 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#fa7517]" 
              placeholder="Search NFT Content Passes" 
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <motion.button 
          className="bg-[#fa7517] text-black px-4 py-2 rounded-full font-bold"
          whileHover={{ scale: 1.05 }}
        >
          Connect Wallet
        </motion.button>
      </header>

      {/* Category Navigation */}
      <nav className="absolute top-20 left-0 right-0 flex justify-center space-x-4 z-10">
        {categories.map((category) => (
          <motion.button
            key={category}
            className={`px-4 py-2 rounded-full ${activeCategory === category ? 'bg-[#fa7517] text-black' : 'bg-black bg-opacity-50 text-white'}`}
            whileHover={{ scale: 1.1 }}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </motion.button>
        ))}
      </nav>

      {/* Main content area */}
      <main className="absolute inset-0 mt-32 p-8 overflow-hidden">
        <motion.div 
          className="grid grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {nfts.map((nft) => (
            <motion.div 
              key={nft.id}
              className="bg-gray-900 bg-opacity-70 rounded-2xl overflow-hidden relative"
              whileHover={{ scale: 1.05, zIndex: 1 }}
              style={{
                boxShadow: `0 0 20px 5px rgba(250, 117, 23, 0.3), 
                            0 0 60px 10px rgba(250, 117, 23, 0.2), 
                            0 0 100px 20px rgba(250, 117, 23, 0.1)`
              }}
            >
              <img src={`/api/placeholder/400/225`} alt={nft.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-lg">{nft.title}</h3>
                <p className="text-sm text-gray-300 mb-2">by {nft.creator}</p>
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <DollarSign size={16} className="text-[#fa7517] mr-1" />
                    {nft.price}
                  </span>
                  <span className="flex items-center">
                    <Clock size={16} className="text-[#fa7517] mr-1" />
                    {nft.timeLeft}
                  </span>
                </div>
              </div>
              {nft.exclusive && (
                <div className="absolute top-2 right-2 bg-[#fa7517] text-black px-2 py-1 rounded-full text-xs font-bold">
                  Exclusive
                </div>
              )}
              <motion.button 
                className="absolute bottom-4 right-4 bg-[#fa7517] text-black px-4 py-2 rounded-full font-bold"
                whileHover={{ scale: 1.1 }}
              >
                Bid Now
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Floating action buttons */}
      <motion.div 
        className="absolute bottom-8 right-8 flex space-x-4"
      >
        <motion.div 
          className="bg-[#fa7517] rounded-full p-4"
          whileHover={{ scale: 1.1 }}
        >
          <Filter size={24} className="text-black" />
        </motion.div>
        <motion.div 
          className="bg-[#fa7517] rounded-full p-4"
          whileHover={{ scale: 1.1 }}
        >
          <Tag size={24} className="text-black" />
        </motion.div>
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

export default NFTMarketplace;

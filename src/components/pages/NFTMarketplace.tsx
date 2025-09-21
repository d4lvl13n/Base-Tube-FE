import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Sparkles, ChevronLeft, ChevronRight, DollarSign, Clock, Tag, GamepadIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

const getCategoryStyle = (category: string) => {
  const styles = {
    Crypto: 'bg-[#fa7517]/20 text-[#fa7517] border border-[#fa7517]/30',
    Gaming: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    Education: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    Sports: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Music: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
    Technology: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    Art: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    Fitness: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  };
  
  return styles[category as keyof typeof styles] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
};

const NFTMarketplace: React.FC = () => {
  const { navStyle } = useNavigation();
  
  if (!PASSES_ENABLED) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
        <Header />
        <div className="flex">
          {navStyle === 'classic' && <Sidebar />}
          <div className={`flex-1 ${navStyle === 'classic' ? 'ml-16' : ''} pt-16`}>
            <motion.div 
              className="bg-[#fa7517]/10 border border-[#fa7517]/20 rounded-lg m-4 p-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-2 text-[#fa7517]">
                <AlertCircle size={20} />
                <span className="font-semibold">Coming Soon</span>
              </div>
              <p className="text-gray-300 mt-2">
                The NFT Marketplace is not available yet. Check back soon!
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }
  
  const mockNFTs = [
    {
      id: 1,
      title: "Premium Creator Pass",
      creator: "Base.Tube Studios",
      price: "7,485.00 TUBE",
      category: "Crypto",
      verified: true,
      priceChange: "+2.78%",
      positive: true
    },
    {
      id: 2,
      title: "Gaming Bundle Pass",
      creator: "CBC Gaming",
      price: "2,584.00 TUBE",
      category: "Gaming",
      verified: true,
      priceChange: "+1.2%",
      positive: true
    },
    {
      id: 3,
      title: "Educational Content Pass",
      creator: "CryptoTeach",
      price: "3,250.00 TUBE",
      category: "Education",
      verified: true,
      priceChange: "-0.5%",
      positive: false
    },
    {
      id: 4,
      title: "Sports Premium Access",
      creator: "SportsFi",
      price: "5,100.00 TUBE",
      category: "Sports",
      verified: true,
      priceChange: "+4.2%",
      positive: true
    },
    {
      id: 5,
      title: "Music Creator Bundle",
      creator: "SoundBase",
      price: "4,750.00 TUBE",
      category: "Music",
      verified: true,
      priceChange: "+1.8%",
      positive: true
    },
    {
      id: 6,
      title: "Tech Insider Pass",
      creator: "TechBase",
      price: "6,300.00 TUBE",
      category: "Technology",
      verified: true,
      priceChange: "-1.2%",
      positive: false
    },
    {
      id: 7,
      title: "Art Collection Pass",
      creator: "ArtBase",
      price: "8,900.00 TUBE",
      category: "Art",
      verified: true,
      priceChange: "+5.4%",
      positive: true
    },
    {
      id: 8,
      title: "Fitness Premium Pass",
      creator: "FitTube",
      price: "3,800.00 TUBE",
      category: "Fitness",
      verified: false,
      priceChange: "+0.8%",
      positive: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <Header />
      <div className="flex">
        {navStyle === 'classic' && <Sidebar />}
        
        <div className={`flex-1 ${navStyle === 'classic' ? 'ml-16' : ''} pt-16`}>
          {/* Development Banner */}
          <motion.div 
            className="bg-[#fa7517]/10 border border-[#fa7517]/20 rounded-lg m-4 p-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-2 text-[#fa7517]">
              <AlertCircle size={20} />
              <span className="font-semibold">Development in Progress</span>
            </div>
            <p className="text-gray-300 mt-2">
              The NFT Marketplace is currently under development. Features will be available soon.
            </p>
          </motion.div>

          {/* Featured Pass Section */}
          <motion.div 
            className="mx-4 mb-6 p-6 rounded-2xl bg-gradient-to-r from-[#fa7517]/20 to-black/60 
                       border border-[#fa7517]/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-start space-x-6">
              <div className="w-1/3">
                <motion.div 
                  className="relative rounded-lg overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                >
                  <img 
                    src="/assets/mockup/featured-nft.jpg" 
                    alt="Featured NFT"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </motion.div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="text-[#fa7517]" size={20} />
                  <span className="text-[#fa7517] font-semibold">Featured Pass</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Ultimate Creator Bundle</h2>
                <p className="text-gray-300">
                  Get exclusive access to premium content and special features with our Ultimate Creator Bundle.
                  Includes early access to new features and premium support.
                </p>
                <div className="flex items-center space-x-4">
                  <span className="text-white flex items-center">
                    <DollarSign size={16} className="text-[#fa7517] mr-1" />
                    10,000 TUBE
                  </span>
                  <span className="text-white flex items-center">
                    <Clock size={16} className="text-[#fa7517] mr-1" />
                    24h left
                  </span>
                </div>
                <motion.button
                  className="bg-[#fa7517] text-black px-6 py-2 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Place Bid
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Market List Section */}
          <div className="mx-4 rounded-xl bg-black/40 backdrop-blur-sm border border-gray-800/50">
            {/* Header */}
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <button className="text-[#fa7517] font-semibold px-4 py-2 rounded-full 
                                   bg-[#fa7517]/10 hover:bg-[#fa7517]/20">
                    Trending
                  </button>
                  <button className="text-gray-400 px-4 py-2 rounded-full 
                                   hover:bg-gray-800/50">
                    Most Popular
                  </button>
                  <button className="text-gray-400 px-4 py-2 rounded-full 
                                   hover:bg-gray-800/50">
                    New Releases
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text"
                    placeholder="Search for creator..."
                    className="bg-black/50 border border-gray-800 rounded-full px-4 py-2
                             text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fa7517]"
                  />
                </div>
              </div>
            </div>

            {/* List Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm text-gray-400 border-b border-gray-800/50">
              <div className="col-span-4">Creator Details</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-3">NFT Content Pass Price</div>
              <div className="col-span-3">Price Evolution (7 Days)</div>
            </div>

            {/* List Items */}
            <div className="divide-y divide-gray-800/50">
              {mockNFTs.map((nft) => (
                <motion.div
                  key={nft.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800/20 cursor-pointer"
                  whileHover={{ scale: 1.002 }}
                >
                  <div className="col-span-4 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center">
                      <img 
                        src={`/assets/mockup/avatar${nft.id}.jpg`} 
                        alt={nft.creator}
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                    <div>
                      <div className="text-white font-medium flex items-center">
                        {nft.creator}
                        {nft.verified && (
                          <Sparkles size={14} className="ml-1 text-[#fa7517]" />
                        )}
                      </div>
                      <div className="text-sm text-gray-400">{nft.title}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <motion.span 
                      className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm
                        ${getCategoryStyle(nft.category)}
                      `}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <div className="flex items-center space-x-1">
                        {nft.category === 'Crypto' && <Tag size={12} />}
                        {nft.category === 'Gaming' && <GamepadIcon size={12} />}
                        {/* Add more category-specific icons */}
                        <span>{nft.category}</span>
                      </div>
                    </motion.span>
                  </div>
                  <div className="col-span-3 flex items-center text-white font-medium">
                    {nft.price}
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className={`flex items-center ${nft.positive ? 'text-green-400' : 'text-red-400'}`}>
                      {nft.priceChange}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/50">
              <div className="text-sm text-gray-400">
                Rows per page: <span className="text-white">30</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">1-6 of 25</span>
                <button className="p-1 rounded-full hover:bg-gray-800/50">
                  <ChevronLeft size={20} className="text-gray-400" />
                </button>
                <button className="p-1 rounded-full hover:bg-gray-800/50">
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTMarketplace;
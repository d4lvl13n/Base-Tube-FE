import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePurchasedPasses } from '../../../hooks/usePass';
import { useAccessList } from '../../../hooks/useOnchainPass';
import { Film, Play, Calendar, ExternalLink, Lock, Shield } from 'lucide-react';
import { Pass } from '../../../types/pass';
import type { OnchainAccessData } from '../../../types/onchainPass';
import PendingPassesClaim from './PendingPassesClaim';

interface PassCardProps {
  pass: Pass;
  access?: OnchainAccessData;
}

const PassCard: React.FC<PassCardProps> = ({ pass, access }) => {
  // Get the first video's thumbnail or use fallback
  const thumbnail = pass.videos?.[0]?.thumbnail_url || '/assets/Content-pass.webp';
  
  // Format the purchase date (if we had this info from the API)
  // For now, we'll just show a placeholder
  const purchaseDate = new Date().toLocaleDateString();
  
  // Get tier color for badge
  const getTierColor = (tier: string): string => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'bg-gradient-to-r from-amber-500 to-amber-700';
      case 'silver': return 'bg-gradient-to-r from-slate-300 to-slate-500';
      case 'gold': return 'bg-gradient-to-r from-yellow-300 to-yellow-600';
      case 'platinum': return 'bg-gradient-to-r from-sky-300 to-sky-600';
      default: return 'bg-gradient-to-r from-purple-400 to-purple-600';
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-black border border-gray-800 rounded-xl overflow-hidden group hover:shadow-lg hover:shadow-[#fa7517]/10"
    >
      {/* Card header with thumbnail */}
      <div className="relative">
        <img 
          src={thumbnail} 
          alt={pass.title} 
          className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />
        
        {/* Play overlay button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Tier badge */}
        <div className="absolute top-2 right-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${getTierColor(pass.tier)}`}>
            {pass.tier}
          </span>
        </div>
        
        {/* Owned badge */}
        <div className="absolute top-2 left-2">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Owned</span>
            </div>
            {process.env.REACT_APP_FEATURE_ONCHAIN_PASSES !== 'false' && access?.hasAccess ? (
              <div className="bg-emerald-700 text-white text-xs px-2 py-1 rounded-full" title={`source: ${access.source}\nupdated: ${new Date(access.timestamp).toLocaleString()}`}>
                On-chain
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{pass.title}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{pass.description || "No description available"}</p>
        
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-gray-400">
            <Film className="w-4 h-4 mr-1 text-[#fa7517]" />
            <span>{pass.videos?.length || 0} videos</span>
          </div>
          <div className="flex items-center text-gray-400">
            <Calendar className="w-4 h-4 mr-1 text-[#fa7517]" />
            <span>Purchased: {purchaseDate}</span>
          </div>
        </div>
      </div>
      
      {/* Card footer */}
      <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-800 flex justify-between items-center">
        <Link 
          to={`/watch/${pass.id}`}
          className="text-[#fa7517] hover:text-[#fa8527] text-sm font-medium flex items-center"
        >
          Watch Content
          <ExternalLink className="w-3 h-3 ml-1" />
        </Link>
        <span className="text-gray-400 text-sm">{pass.formatted_price}</span>
      </div>
    </motion.div>
  );
};

const PassesTab = () => {
  const { data: passes, isLoading, error } = usePurchasedPasses();
  const isOnchainEnabled = process.env.REACT_APP_FEATURE_ONCHAIN_PASSES !== 'false';
  const { data: accessList } = useAccessList({ enabled: isOnchainEnabled });
  const [searchQuery, setSearchQuery] = useState('');
  
  const accessByPassId = useMemo(() => {
    const map = new Map<string, OnchainAccessData>();
    const items = accessList?.data || [];
    for (const item of items) {
      if (item?.passId) map.set(item.passId, item);
    }
    return map;
  }, [accessList]);
  
  // Filter passes based on search query
  const filteredPasses = passes?.filter(pass => 
    pass.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pass.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pass.tier.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">My Content Passes</h2>
          <div className="w-64 h-10 bg-gray-700 animate-pulse rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800/30 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
        <p className="text-red-400 mb-4">Failed to load your content passes</p>
        <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
          Retry
        </button>
      </div>
    );
  }
  
  if (!passes?.length) {
    return (
      <div className="space-y-6">
        {/* Show pending passes even when no completed passes exist */}
        <PendingPassesClaim />

        <h2 className="text-2xl font-bold">My Content Passes</h2>
        <div className="p-8 border border-gray-800/30 rounded-xl bg-black/30 flex flex-col items-center justify-center text-center">
          <Lock className="w-12 h-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Content Passes Yet</h3>
          <p className="text-gray-400 max-w-md mb-6">
            You haven't purchased any content passes yet. Explore premium content from your favorite creators.
          </p>
          <Link to="/discover">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-[#fa7517] to-orange-600 rounded-lg text-white font-bold"
            >
              Discover Content Passes
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Pending Passes Claim Banner */}
      <PendingPassesClaim />

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold">My Content Passes</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search your passes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 focus:border-[#fa7517]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPasses?.map((pass) => (
          <PassCard key={pass.id} pass={pass} access={accessByPassId.get(pass.id)} />
        ))}
      </div>
    </div>
  );
};

export default PassesTab; 
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePurchasedPasses } from '../../hooks/usePass';
import { Film, Play, Calendar, ExternalLink, Lock, Shield, Search, Filter } from 'lucide-react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import { Pass } from '../../types/pass';

interface PassCardProps {
  pass: Pass;
}

const PassCard: React.FC<PassCardProps> = ({ pass }) => {
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
          <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Owned</span>
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

const MyPasses: React.FC = () => {
  const { data: passes, isLoading, error } = usePurchasedPasses();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter passes based on search query and filter
  const filteredPasses = passes?.filter(pass => {
    const matchesSearch = 
      pass.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pass.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pass.tier.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Apply tier filter if not 'all'
    const matchesFilter = activeFilter === 'all' ? true : pass.tier.toLowerCase() === activeFilter;
    
    return matchesSearch && matchesFilter;
  }) || [];
  
  const tierOptions = ['all', 'bronze', 'silver', 'gold', 'platinum'];
  
  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex pt-20">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 min-h-[calc(100vh-5rem)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <h1 className="text-3xl font-bold mb-4 md:mb-0">My Content Passes</h1>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search your passes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 focus:border-[#fa7517]"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                
                {/* Filter Button */}
                <div className="relative">
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="px-4 py-2 bg-black border border-gray-800 rounded-lg flex items-center gap-2 hover:bg-gray-900"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}</span>
                  </button>
                  
                  {/* Filter Dropdown */}
                  {filterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-gray-800 rounded-lg shadow-lg z-10"
                    >
                      {tierOptions.map((tier) => (
                        <button
                          key={tier}
                          onClick={() => {
                            setActiveFilter(tier);
                            setFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg ${
                            activeFilter === tier ? 'bg-[#fa7517]/20 text-[#fa7517]' : ''
                          }`}
                        >
                          {tier === 'all' ? 'All Tiers' : tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Content */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-800/30 rounded-xl h-64 animate-pulse" />
                ))}
              </div>
            )}
            
            {error && (
              <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                <p className="text-red-400 mb-4">Failed to load your content passes</p>
                <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                  Retry
                </button>
              </div>
            )}
            
            {!isLoading && !error && !passes?.length && (
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
            )}
            
            {!isLoading && !error && filteredPasses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPasses.map((pass) => (
                  <PassCard key={pass.id} pass={pass} />
                ))}
              </div>
            )}
            
            {!isLoading && !error && passes && passes.length > 0 && filteredPasses.length === 0 && (
              <div className="p-8 border border-gray-800/30 rounded-xl bg-black/30 text-center">
                <Search className="w-8 h-8 text-gray-500 mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-white mb-2">No Matching Passes</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  No passes match your current search or filter. Try adjusting your criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="px-6 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MyPasses; 
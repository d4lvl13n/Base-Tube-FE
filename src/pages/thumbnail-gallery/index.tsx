import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Sliders, FileDown, Image, ArrowDownWideNarrow, X } from 'lucide-react';
import { useAIThumbnailGallery } from '../../hooks/useAIthumbnail';
import { ThumbnailGalleryParams } from '../../types/thumbnail';
import { ThumbnailGrid } from '../../components/ThumbnailGallery/ThumbnailGrid';
import { ThumbnailDetailDrawer } from '../../components/ThumbnailGallery/ThumbnailDetailDrawer';
import { cn } from '../../lib/utils';
import { formatNumber } from '../../utils/format';

export default function ThumbnailGalleryPage() {
  // Gallery state
  const [params, setParams] = useState<ThumbnailGalleryParams>({
    limit: 20,
    offset: 0,
    sort: 'created_at',
    order: 'desc'
  });
  const [selectedThumbnailId, setSelectedThumbnailId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [usageFilter, setUsageFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [videoIdFilter, setVideoIdFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState<{value: string, label: string}>({ 
    value: 'created_at-desc', 
    label: 'Newest First' 
  });
  
  // Filter options
  const sortOptions = [
    { value: 'created_at-desc', label: 'Newest First' },
    { value: 'created_at-asc', label: 'Oldest First' },
    { value: 'download_count-desc', label: 'Most Popular' },
    { value: 'download_count-asc', label: 'Least Popular' },
  ];

  // Refs for infinite scrolling
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Search input debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        setParams(prev => ({ ...prev, search: searchQuery || undefined, offset: 0 }));
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Apply filters
  useEffect(() => {
    const [sort, order] = sortOption.value.split('-');
    
    let updatedParams: ThumbnailGalleryParams = {
      ...params,
      sort,
      order: order as 'asc' | 'desc',
      offset: 0 // Reset to first page when changing filters
    };
    
    // Apply usage filter if not 'all'
    if (usageFilter !== 'all') {
      updatedParams.used = usageFilter === 'used';
    } else {
      delete updatedParams.used;
    }
    
    // Apply videoId filter if present
    if (videoIdFilter && !isNaN(parseInt(videoIdFilter))) {
      updatedParams.videoId = parseInt(videoIdFilter);
    } else {
      delete updatedParams.videoId;
    }
    
    setParams(updatedParams);
  }, [sortOption, usageFilter, videoIdFilter]);
  
  // Fetch thumbnails
  const { 
    thumbnails, 
    totalCount, 
    hasMore, 
    isLoading, 
    fetchThumbnailById,
    isFetching,
    refetch
  } = useAIThumbnailGallery(params);
  
  // Load more thumbnails when scrolling to the bottom
  const loadMore = () => {
    if (!isLoading && !isFetching && hasMore) {
      setParams(prev => ({ 
        ...prev, 
        offset: (prev.offset ?? 0) + (prev.limit ?? 20) 
      }));
    }
  };
  
  // Setup IntersectionObserver for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isFetching) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isLoading, isFetching]);
  
  // Handle thumbnail selection
  const handleThumbnailClick = (id: number) => {
    setSelectedThumbnailId(id);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setUsageFilter('all');
    setVideoIdFilter('');
    setSortOption({ value: 'created_at-desc', label: 'Newest First' });
  };
  
  // Check if any filters are active
  const hasActiveFilters = 
    searchQuery || 
    usageFilter !== 'all' || 
    videoIdFilter || 
    sortOption.value !== 'created_at-desc';
  
  return (
    <>
      <Helmet>
        <title>AI Thumbnail Gallery | Base.tube</title>
        <meta name="description" content="Browse AI-generated thumbnails from Base.tube" />
        <meta property="og:title" content="AI Thumbnail Gallery | Base.tube" />
        <meta property="og:description" content="Browse AI-generated thumbnails from Base.tube" />
      </Helmet>
      
      <main className="flex flex-col min-h-screen bg-black">
        {/* Hero Header */}
        <section className="relative py-16 px-6 overflow-hidden bg-gradient-to-b from-gray-900 to-black border-b border-gray-800/30">
          {/* Gradient Orb */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#fa7517]/30 to-[#ff8c3a]/5 blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              AI Thumbnail Gallery
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-gray-400 max-w-2xl mx-auto"
            >
              Browse, search and download AI-generated thumbnails to use in your own videos
            </motion.p>
            
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 max-w-2xl mx-auto flex items-center"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search thumbnails by prompt content..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/80 backdrop-blur-sm border border-gray-800/30 rounded-l-lg focus:outline-none focus:border-[#fa7517]/50 focus:ring-1 focus:ring-[#fa7517]/20 text-white"
                />
                <Search className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "px-4 py-3 border border-gray-800/30 rounded-r-lg",
                  showFilters 
                    ? "bg-[#fa7517]/20 border-[#fa7517]/50 text-[#fa7517]" 
                    : "bg-gray-900/80 text-gray-400 hover:text-white"
                )}
              >
                <Sliders className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </section>
        
        {/* Filter Bar */}
        <motion.section
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: showFilters ? 'auto' : 0,
            opacity: showFilters ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-gray-800/30 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Filter Controls */}
              <div className="flex flex-1 flex-wrap items-center gap-4">
                {/* Filter by Usage */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Usage</label>
                  <div className="flex bg-gray-900/60 rounded-lg p-1">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'used', label: 'Used' },
                      { value: 'unused', label: 'Unused' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setUsageFilter(option.value as any)}
                        className={cn(
                          "text-sm px-3 py-1 rounded",
                          usageFilter === option.value
                            ? "bg-[#fa7517] text-black"
                            : "text-gray-400 hover:text-white"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Filter by Video ID */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Video ID</label>
                  <input
                    type="text"
                    value={videoIdFilter}
                    onChange={(e) => setVideoIdFilter(e.target.value)}
                    placeholder="Filter by Video ID..."
                    className="px-3 py-1.5 w-32 text-sm bg-gray-900/60 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517]/50 text-white"
                  />
                </div>
                
                {/* Sort Options */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Sort By</label>
                  <select
                    value={sortOption.value}
                    onChange={(e) => {
                      const selectedOption = sortOptions.find(opt => opt.value === e.target.value);
                      if (selectedOption) {
                        setSortOption(selectedOption);
                      }
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-900/60 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517]/50 text-white"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#fa7517] hover:underline flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </motion.section>
        
        {/* Gallery Section */}
        <section className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Gallery Stats */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-white text-xl">{searchQuery ? 'Search Results' : 'Thumbnail Gallery'}</h2>
                <div className="px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-400">
                  {formatNumber(totalCount)} thumbnails
                </div>
              </div>
            </div>
            
            {/* Thumbnail Grid */}
            <ThumbnailGrid 
              thumbnails={thumbnails}
              isLoading={isLoading}
              onThumbnailClick={handleThumbnailClick}
            />
            
            {/* Load More Indicator */}
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              {isFetching && hasMore && (
                <div className="flex flex-col items-center pt-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Image className="w-5 h-5 text-[#fa7517]" />
                  </motion.div>
                  <span className="text-gray-500 text-sm mt-2">Loading more thumbnails...</span>
                </div>
              )}
              
              {!hasMore && thumbnails.length > 0 && (
                <p className="text-gray-500 text-sm">You've reached the end of the gallery</p>
              )}
            </div>
          </div>
        </section>
        
        {/* Thumbnail Detail Drawer */}
        {selectedThumbnailId && (
          <ThumbnailDetailDrawer
            thumbnailId={selectedThumbnailId}
            isOpen={!!selectedThumbnailId}
            onClose={() => setSelectedThumbnailId(null)}
            fetchThumbnailById={fetchThumbnailById}
            onDownloadSuccess={() => refetch()}
          />
        )}
      </main>
    </>
  );
} 
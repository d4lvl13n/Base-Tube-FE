import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowUpRight, Image, Search, Sliders, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAIThumbnailInfiniteGallery } from '../../hooks/useAIthumbnail';
import { ThumbnailGalleryParams } from '../../types/thumbnail';
import { ThumbnailGrid } from '../../components/ThumbnailGallery/ThumbnailGrid';
import { ThumbnailDetailDrawer } from '../../components/ThumbnailGallery/ThumbnailDetailDrawer';
import { cn } from '../../lib/utils';
import { formatNumber } from '../../utils/format';

const PAGE_SIZE = 24;

const sortOptions = [
  { value: 'created_at-desc', label: 'Newest First' },
  { value: 'created_at-asc', label: 'Oldest First' },
  { value: 'download_count-desc', label: 'Most Popular' },
  { value: 'download_count-asc', label: 'Least Popular' },
];

export default function ThumbnailGalleryPage() {
  const [selectedThumbnailId, setSelectedThumbnailId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [usageFilter, setUsageFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [videoIdFilter, setVideoIdFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState<{value: string, label: string}>({ 
    value: 'created_at-desc', 
    label: 'Newest First' 
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [sort, order] = useMemo(() => {
    const [nextSort, nextOrder] = sortOption.value.split('-');
    return [nextSort, nextOrder as 'asc' | 'desc'];
  }, [sortOption.value]);

  const parsedVideoId = useMemo(() => {
    const numericVideoId = Number(videoIdFilter.trim());
    return Number.isInteger(numericVideoId) && numericVideoId > 0 ? numericVideoId : undefined;
  }, [videoIdFilter]);

  const galleryParams = useMemo<ThumbnailGalleryParams>(() => ({
    limit: PAGE_SIZE,
    search: debouncedSearchQuery || undefined,
    used: usageFilter === 'all' ? undefined : usageFilter === 'used',
    videoId: parsedVideoId,
    sort,
    order
  }), [debouncedSearchQuery, order, parsedVideoId, sort, usageFilter]);

  const { 
    thumbnails, 
    totalCount, 
    hasMore, 
    isLoading, 
    isError,
    error,
    fetchThumbnailById,
    isFetching,
    fetchNextPage,
    isFetchingNextPage,
    refetch
  } = useAIThumbnailInfiniteGallery(galleryParams);

  const isInitialLoading = isLoading && thumbnails.length === 0;

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasMore, isFetching, isFetchingNextPage, isLoading]);
  
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '600px 0px', threshold: 0 }
    );
    
    observer.observe(node);
    
    return () => {
      observer.unobserve(node);
    };
  }, [loadMore]);
  
  const handleThumbnailClick = useCallback((id: number) => {
    setSelectedThumbnailId(id);
  }, []);
  
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setUsageFilter('all');
    setVideoIdFilter('');
    setSortOption({ value: 'created_at-desc', label: 'Newest First' });
  }, []);
  
  const hasActiveFilters = Boolean(
    searchQuery || 
    usageFilter !== 'all' || 
    videoIdFilter || 
    sortOption.value !== 'created_at-desc'
  );
  
  return (
    <>
      <Helmet>
        <title>AI Thumbnail Gallery | Base.tube</title>
        <meta name="description" content="Browse AI-generated thumbnails from Base.tube" />
        <meta property="og:title" content="AI Thumbnail Gallery | Base.tube" />
        <meta property="og:description" content="Browse AI-generated thumbnails from Base.tube" />
      </Helmet>
      
      <main className="flex flex-col min-h-screen bg-black text-white">
        {/* Hero Header */}
        <section className="relative px-6 pb-8 pt-10 border-b border-white/10 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
            >
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#fa7517]/30 bg-[#fa7517]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#fa7517]">
                  <Image className="h-3.5 w-3.5" />
                  AI Studio
                </div>
                <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                  Thumbnail Gallery
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-400">
                  <span className="font-semibold text-white">{formatNumber(thumbnails.length)}</span>
                  <span>loaded</span>
                  <span className="text-gray-700">/</span>
                  <span>{formatNumber(totalCount)} total</span>
                </div>

                <Link
                  to="/ai-thumbnails/generate"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[#fa7517]/40 bg-[#fa7517] px-4 text-sm font-black text-black shadow-[0_0_30px_rgba(250,117,23,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#ff8a33]"
                >
                  <Sparkles className="h-4 w-4" />
                  Create thumbnail
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 flex items-stretch"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompt text"
                  className="h-14 w-full rounded-l-full border border-white/10 bg-[#0a0a0a] pl-12 pr-12 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition-colors placeholder:text-gray-600 focus:border-[#fa7517]/50"
                />
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-14 px-5 border border-l-0 border-white/10 rounded-r-full transition-colors",
                  showFilters 
                    ? "bg-[#fa7517] text-black"
                    : "bg-[#0a0a0a] text-gray-400 hover:text-white"
                )}
                aria-label="Toggle filters"
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
          className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-white/10 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Filter Controls */}
              <div className="flex flex-1 flex-wrap items-center gap-4">
                {/* Filter by Usage */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Usage</label>
                  <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'used', label: 'Used' },
                      { value: 'unused', label: 'Unused' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setUsageFilter(option.value as any)}
                        className={cn(
                          "text-sm px-4 py-1.5 rounded-full font-semibold transition-colors",
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
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Video ID</label>
                  <input
                    type="text"
                    value={videoIdFilter}
                    onChange={(e) => setVideoIdFilter(e.target.value)}
                    placeholder="Any"
                    inputMode="numeric"
                    className="h-10 w-32 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#fa7517]/50"
                  />
                </div>
                
                {/* Sort Options */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Sort By</label>
                  <select
                    value={sortOption.value}
                    onChange={(e) => {
                      const selectedOption = sortOptions.find(opt => opt.value === e.target.value);
                      if (selectedOption) {
                        setSortOption(selectedOption);
                      }
                    }}
                    className="h-10 rounded-full border border-white/10 bg-[#0a0a0a] px-4 text-sm font-semibold text-white outline-none transition-colors focus:border-[#fa7517]/50"
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
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-full border border-[#fa7517]/30 bg-[#fa7517]/10 px-4 py-2 text-sm font-semibold text-[#fa7517] transition-colors hover:bg-[#fa7517]/15"
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-white text-xl font-bold">{debouncedSearchQuery ? 'Search Results' : 'Gallery Feed'}</h2>
                <div className="px-2.5 py-1 bg-white/[0.04] border border-white/10 rounded-full text-xs text-gray-400">
                  {formatNumber(totalCount)} thumbnails
                </div>
              </div>
              {isFetching && !isFetchingNextPage && !isInitialLoading && (
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#fa7517]">
                  Refreshing
                </div>
              )}
            </div>

            {isError && (
              <div className="mb-6 flex flex-col gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-red-100">
                  {error instanceof Error ? error.message : 'The thumbnail gallery could not be loaded.'}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-full border border-red-300/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* Thumbnail Grid */}
            <ThumbnailGrid 
              thumbnails={thumbnails}
              isLoading={isInitialLoading}
              onThumbnailClick={handleThumbnailClick}
            />
            
            {/* Load More Indicator */}
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              {isFetchingNextPage && hasMore && (
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

// src/components/pages/CTREngine/GalleryPage.tsx
// User's thumbnail gallery - displays all generated thumbnails

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SignInButton, useUser } from '@clerk/clerk-react';
import { 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  Share2, 
  Lock, 
  Search, 
  Grid,
  List,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  BarChart2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import { usePublicThumbnailGenerator } from '../../../hooks/usePublicThumbnailGenerator';
import useCTREngine from '../../../hooks/useCTREngine';
import { ThumbnailDetailDrawer } from './components/ThumbnailDetailDrawer';
import { ViralSharePopup } from './components/ViralSharePopup';
import { cardStyles } from './styles/cardTokens';

const GalleryPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const { quota, isLoadingQuota } = useCTREngine();
  const {
    gallery,
    galleryLoading,
    loadGallery,
    deleteFromGallery,
    forceDownload,
  } = usePublicThumbnailGenerator();

  // UI State
  const [selectedThumbnail, setSelectedThumbnail] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViralShareOpen, setIsViralShareOpen] = useState(false);
  const [shareSelectedThumbnail, setShareSelectedThumbnail] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Load gallery on mount
  useEffect(() => {
    if (isSignedIn) {
      loadGallery(0);
    }
  }, [isSignedIn, loadGallery]);

  // Filter and sort thumbnails
  const filteredThumbnails = gallery
    .filter(thumb => 
      searchQuery.trim() === '' || 
      thumb.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleThumbnailClick = (thumbnail: any) => {
    setSelectedThumbnail(thumbnail);
    setIsDrawerOpen(true);
  };

  const handleShare = (thumbnail: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareSelectedThumbnail(thumbnail);
    setIsViralShareOpen(true);
  };

  const handleDelete = async (thumbnailId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId) return;
    
    if (!window.confirm('Are you sure you want to delete this thumbnail?')) return;
    
    setDeletingId(thumbnailId);
    try {
      await deleteFromGallery(thumbnailId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (thumbnail: any, e: React.MouseEvent) => {
    e.stopPropagation();
    await forceDownload(thumbnail.id.toString());
  };

  // Auth gate
  if (isLoaded && !isSignedIn) {
    return (
      <AIThumbnailsLayout quota={quota} isLoadingQuota={isLoadingQuota}>
        <div className="max-w-xl mx-auto text-center py-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center border border-[#fa7517]/30"
          >
            <Lock className="w-10 h-10 text-[#fa7517]" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Sign In to View Gallery
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-gray-400 mb-8 max-w-md mx-auto"
          >
            Your generated thumbnails are saved to your account. Sign in to access your full gallery.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SignInButton mode="modal">
              <button className="py-3.5 px-6 bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 text-white rounded-xl font-semibold transition-all shadow-lg shadow-[#fa7517]/25 flex items-center justify-center gap-2 mx-auto">
                <Sparkles className="w-5 h-5" />
                Sign In to Continue
              </button>
            </SignInButton>
          </motion.div>
        </div>
      </AIThumbnailsLayout>
    );
  }

  return (
    <AIThumbnailsLayout quota={quota} isLoadingQuota={isLoadingQuota}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#fa7517]/10 border border-[#fa7517]/30 rounded-full text-[#fa7517] text-sm font-medium mb-3"
            >
              <ImageIcon className="w-4 h-4" />
              My Gallery
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-2xl md:text-3xl font-bold text-white"
            >
              Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7517] to-orange-400">
                Thumbnails
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              {filteredThumbnails.length} thumbnail{filteredThumbnails.length !== 1 ? 's' : ''} generated
            </motion.p>
          </div>

          {/* Refresh Button */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => loadGallery(0)}
            disabled={galleryLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${galleryLoading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>

        {/* Search and Filters - Improved UX */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`${cardStyles.base} rounded-xl p-4`}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search - Full width on mobile */}
            <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search thumbnails by prompt..."
                className="w-full pl-10 pr-10 py-3 bg-black/40 border border-gray-800/50 rounded-xl text-white 
                        placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                        focus:border-[#fa7517]/50 transition-all text-sm"
            />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
          </div>

            {/* Controls Row */}
            <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
              {/* Sort Pills */}
              <div className="flex items-center gap-1 p-1 bg-black/40 border border-gray-800/50 rounded-xl">
                <span className="px-2 text-xs text-gray-500 hidden sm:inline">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </span>
                <button
                  onClick={() => setSortBy('newest')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    sortBy === 'newest' 
                      ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ArrowDown className="w-3 h-3" />
                  Newest
                </button>
                <button
                  onClick={() => setSortBy('oldest')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    sortBy === 'oldest' 
                      ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ArrowUp className="w-3 h-3" />
                  Oldest
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-800/50 hidden lg:block" />

          {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-black/40 border border-gray-800/50 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list' 
                      ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">List</span>
            </button>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 pt-3 border-t border-gray-800/50 flex items-center gap-2"
            >
              <span className="text-xs text-gray-500">Active filter:</span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fa7517]/10 border border-[#fa7517]/30 rounded-full text-xs text-[#fa7517] font-medium">
                <Search className="w-3 h-3" />
                "{searchQuery}"
                <button 
                  onClick={() => setSearchQuery('')}
                  className="ml-1 hover:bg-[#fa7517]/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
              <span className="text-xs text-gray-500">
                • {filteredThumbnails.length} result{filteredThumbnails.length !== 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Loading State */}
      {galleryLoading && gallery.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-[#fa7517] animate-spin mb-4" />
          <p className="text-gray-400">Loading your thumbnails...</p>
        </div>
      )}

      {/* Empty State */}
      {!galleryLoading && gallery.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No thumbnails yet</h3>
          <p className="text-gray-400 mb-6 max-w-sm">
            Start creating stunning thumbnails and they'll appear here
          </p>
          <Link
            to="/ai-thumbnails/generate"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fa7517] to-orange-500 text-white rounded-xl font-medium hover:from-[#fa7517]/90 hover:to-orange-500/90 transition-all shadow-lg shadow-[#fa7517]/25"
          >
            <Sparkles className="w-4 h-4" />
            Create Your First Thumbnail
          </Link>
        </motion.div>
      )}

      {/* No Results State */}
      {!galleryLoading && gallery.length > 0 && filteredThumbnails.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Search className="w-12 h-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-gray-400 mb-4">
            No thumbnails match "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-[#fa7517] hover:text-orange-400 text-sm font-medium"
          >
            Clear search
          </button>
        </motion.div>
      )}

      {/* Thumbnails Grid */}
      {filteredThumbnails.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
            : 'space-y-4'
          }
        >
          {filteredThumbnails.map((thumbnail, index) => (
            <motion.div
              key={thumbnail.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleThumbnailClick(thumbnail)}
              className={`group ${cardStyles.interactive} rounded-2xl overflow-hidden ${
                viewMode === 'list' ? 'flex' : ''
              }`}
            >
              {/* Thumbnail Image */}
              <div className={`relative overflow-hidden ${
                viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-video'
              }`}>
                <img
                  src={thumbnail.thumbnailUrl}
                  alt={thumbnail.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleDownload(thumbnail, e)}
                    className="p-2.5 bg-white/20 text-white rounded-xl shadow-lg backdrop-blur-sm border border-white/20"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleShare(thumbnail, e)}
                    className="p-2.5 bg-white/20 text-white rounded-xl shadow-lg backdrop-blur-sm border border-white/20"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </motion.button>
                  <Link
                    to={`/ai-thumbnails/audit?url=${encodeURIComponent(thumbnail.thumbnailUrl)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 bg-white/20 text-white rounded-xl shadow-lg backdrop-blur-sm border border-white/20 hover:bg-white/30 transition-colors"
                    title="Audit this thumbnail"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleDelete(thumbnail.id, e)}
                    disabled={deletingId === thumbnail.id}
                    className="p-2.5 bg-red-500/20 text-red-400 rounded-xl shadow-lg backdrop-blur-sm border border-red-500/20 hover:bg-red-500/30 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === thumbnail.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>

                {/* Download count badge */}
                {thumbnail.downloadCount > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {thumbnail.downloadCount}
                  </div>
                )}
              </div>

              {/* Thumbnail Info */}
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <p className="text-sm text-white line-clamp-2 mb-2 group-hover:text-[#fa7517] transition-colors">
                  {thumbnail.prompt}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(thumbnail.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(thumbnail.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {viewMode === 'list' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                      {thumbnail.size}
                    </span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                      {thumbnail.quality}
                    </span>
                    {thumbnail.style && (
                      <span className="px-2 py-0.5 bg-[#fa7517]/10 border border-[#fa7517]/20 rounded text-xs text-[#fa7517]">
                        {thumbnail.style}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Thumbnail Detail Drawer */}
      <ThumbnailDetailDrawer
        thumbnail={selectedThumbnail}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedThumbnail(null);
        }}
      />

      {/* Viral Share Popup */}
      <ViralSharePopup
        thumbnail={shareSelectedThumbnail}
        isOpen={isViralShareOpen}
        onClose={() => {
          setIsViralShareOpen(false);
          setShareSelectedThumbnail(null);
        }}
      />
    </AIThumbnailsLayout>
  );
};

export default GalleryPage;


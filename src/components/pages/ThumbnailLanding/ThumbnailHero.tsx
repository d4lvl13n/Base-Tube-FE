import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ArrowRight, Eye, TrendingUp, Image, Trash2, Share2, Download, Clock, Wand2, FolderOpen, Home } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import Button from '../../common/Button';
import CollapsibleThumbnailGenerator from './CollapsibleThumbnailGenerator';
import { usePublicThumbnailGenerator } from '../../../hooks/usePublicThumbnailGenerator';
import { ThumbnailDetailDrawer } from './ThumbnailDetailDrawer';
import { ViralSharePopup } from './ViralSharePopup';

type AppView = 'landing' | 'generator' | 'gallery';

interface ThumbnailHeroProps {
  onSignUpClick: () => void;
  /** Callback to notify parent when entering/exiting app mode */
  onAppModeChange?: (isAppMode: boolean) => void;
}

const ThumbnailHero: React.FC<ThumbnailHeroProps> = ({ onSignUpClick, onAppModeChange }) => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { gallery, galleryLoading, loadGallery, deleteFromGallery, quotaInfo } = usePublicThumbnailGenerator();
  
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedGalleryThumbnail, setSelectedGalleryThumbnail] = useState<any>(null);
  const [isGalleryDrawerOpen, setIsGalleryDrawerOpen] = useState(false);
  const [isViralShareOpen, setIsViralShareOpen] = useState(false);
  const [shareSelectedThumbnail, setShareSelectedThumbnail] = useState<any>(null);

  // Check if we're in "app mode" (not landing page)
  const isAppMode = currentView !== 'landing';

  const switchView = (view: AppView) => {
    setCurrentView(view);
    onAppModeChange?.(view !== 'landing');
    
    if (view === 'gallery') {
      loadGallery(0);
    }
  };

  const handleEnterProfessionalMode = () => {
    // Navigate to the dedicated Creative page instead of internal mode
    navigate('/ai-thumbnails/creative');
  };

  const handleBackToLanding = () => {
    switchView('landing');
  };
  
  const handleGalleryThumbnailClick = (thumbnail: any) => {
    setSelectedGalleryThumbnail({
      id: thumbnail.id.toString(),
      prompt: thumbnail.prompt,
      imageUrl: thumbnail.thumbnailUrl,
      createdAt: thumbnail.createdAt,
      shareUrl: thumbnail.shareUrl
    });
    setIsGalleryDrawerOpen(true);
  };
  
  const handleShareFromGallery = (thumbnail: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareSelectedThumbnail({
      id: thumbnail.id.toString(),
      prompt: thumbnail.prompt,
      imageUrl: thumbnail.thumbnailUrl,
      createdAt: thumbnail.createdAt,
      shareUrl: thumbnail.shareUrl
    });
    setIsViralShareOpen(true);
  };
  
  const handleDeleteFromGallery = async (thumbnailId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this thumbnail from your gallery?')) {
      await deleteFromGallery(thumbnailId);
    }
  };

  // App Navigation Bar Component
  const AppNavBar = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-8 pb-6 border-b border-white/10"
    >
      {/* Left: Back to Landing */}
      <button
        onClick={handleBackToLanding}
        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors group"
      >
        <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-sm">Back to Landing</span>
      </button>
      
      {/* Center: Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
        <button
          onClick={() => switchView('generator')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentView === 'generator'
              ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Create</span>
        </button>
        
        {isSignedIn && (
          <button
            onClick={() => switchView('gallery')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'gallery'
                ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>My Thumbnails</span>
            {gallery.length > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                currentView === 'gallery' ? 'bg-white/20' : 'bg-[#fa7517]/20 text-[#fa7517]'
              }`}>
                {gallery.length}
              </span>
            )}
          </button>
        )}
      </div>
      
      {/* Right: Quota Info */}
      {quotaInfo && (
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
          <div className="text-right">
            <p className="text-xs text-gray-400">Daily quota</p>
            <p className="text-sm font-semibold text-white">
              {quotaInfo.remaining}/{quotaInfo.limit}
            </p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            quotaInfo.tier === 'pro' ? 'bg-purple-500/20 text-purple-300' :
            quotaInfo.tier === 'free' ? 'bg-blue-500/20 text-blue-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {quotaInfo.tier}
          </span>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className={`relative ${isAppMode ? 'min-h-[calc(100vh-80px)]' : 'min-h-screen'} bg-gradient-to-br from-[#09090B] via-[#111114] to-[#09090B] overflow-hidden`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fa7517]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Grid Pattern - only show on landing */}
        {!isAppMode && (
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fa7517' fill-opacity='0.05'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        )}
      </div>

      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isAppMode ? 'pt-24' : 'pt-20'}`}>
        <AnimatePresence mode="wait">
          {/* ============================================ */}
          {/* APP MODE: Gallery View */}
          {/* ============================================ */}
          {currentView === 'gallery' && isSignedIn ? (
            <motion.div
              key="gallery-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col min-h-[calc(100vh-120px)]"
            >
              {/* App Navigation */}
              <AppNavBar />
              
              {/* Gallery Content */}
              <div className="flex-1">
                {galleryLoading && gallery.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-white/5 rounded-xl overflow-hidden border border-white/10 animate-pulse">
                        <div className="aspect-video bg-white/10" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-white/10 rounded w-3/4" />
                          <div className="h-3 bg-white/10 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : gallery.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                  >
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Image className="w-12 h-12 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-2">No thumbnails yet</h3>
                    <p className="text-gray-400 mb-6">Generate your first AI thumbnail to see it here</p>
                    <Button
                      onClick={() => switchView('generator')}
                      className="bg-gradient-to-r from-[#fa7517] to-orange-400 text-white px-6 py-3 rounded-xl"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Create Thumbnail
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  >
                    {gallery.map((thumbnail, index) => (
                      <motion.div
                        key={thumbnail.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * Math.min(index, 8) }}
                        onClick={() => handleGalleryThumbnailClick(thumbnail)}
                        className="group bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-[#fa7517]/50 transition-all duration-300 cursor-pointer"
                      >
                        <div className="relative aspect-video bg-black/40 overflow-hidden">
                          <img
                            src={thumbnail.thumbnailUrl}
                            alt={thumbnail.prompt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                            <button
                              onClick={(e) => handleShareFromGallery(thumbnail, e)}
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                              title="Share"
                            >
                              <Share2 className="w-5 h-5 text-white" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteFromGallery(thumbnail.id, e)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5 text-red-400" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                            {thumbnail.prompt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(thumbnail.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              {thumbnail.downloadCount}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : currentView === 'generator' ? (
            /* ============================================ */
            /* APP MODE: Generator View */
            /* ============================================ */
            <motion.div
              key="generator-view"
              initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col min-h-[calc(100vh-120px)]"
            >
              {/* App Navigation */}
              <AppNavBar />

              {/* Generator Content */}
              <div className="flex-1 flex items-start justify-center">
                <CollapsibleThumbnailGenerator 
                  className="w-full max-w-5xl"
                  isProfessionalMode={true}
                  onExitProfessionalMode={handleBackToLanding}
                  onSignUpClick={onSignUpClick}
                  onThumbnailGenerated={() => {
                    // Optionally switch to gallery after generation
                  }}
                />
              </div>
            </motion.div>
          ) : (
            /* ============================================ */
            /* LANDING MODE - Marketing Page */
            /* ============================================ */
            <motion.div
              key="landing-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-12 items-center min-h-screen"
            >
              {/* Left Section - Copy & CTA */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.8 }}
                className="lg:pr-8"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-full border border-[#fa7517]/30 mb-6"
                >
                  <Sparkles className="w-4 h-4 text-[#fa7517]" />
                  <span className="text-sm font-medium text-white">For Creators Who Refuse to Settle</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                >
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Your Ideas Deserve
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
                    Perfect Thumbnails
                  </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-gray-300 mb-8 leading-relaxed"
                >
                  Stop losing views to boring thumbnails. Create images that make people <span className="text-[#fa7517] font-semibold">stop scrolling</span> and start watching.
                </motion.p>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-3 gap-6 mb-8"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white mb-1">
                      <TrendingUp className="w-6 h-6 text-[#fa7517]" />
                      <span>More</span>
                    </div>
                    <p className="text-sm text-gray-400">Views</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white mb-1">
                      <Zap className="w-6 h-6 text-[#fa7517]" />
                      <span>Instant</span>
                    </div>
                    <p className="text-sm text-gray-400">Results</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white mb-1">
                      <Eye className="w-6 h-6 text-[#fa7517]" />
                      <span>Zero</span>
                    </div>
                    <p className="text-sm text-gray-400">Design Skills</p>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-8"
                >
                  <Button
                    onClick={onSignUpClick}
                    className="group relative bg-gradient-to-r from-[#fa7517] to-orange-400 hover:from-[#fa7517]/90 hover:to-orange-400/90 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-[#fa7517]/25 hover:shadow-[#fa7517]/40 transition-all duration-300"
                  >
                    <span className="flex items-center gap-2">
                      Create Your First Thumbnail
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
                  </Button>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-4 text-sm text-gray-400"
                >
                  <span>✓ Free to try</span>
                  <span>✓ No experience required</span>
                  <span>✓ Professional quality</span>
                </motion.div>
              </motion.div>

              {/* Right Section - Collapsible Thumbnail Generator */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="lg:pl-8"
              >
                <CollapsibleThumbnailGenerator 
                  className="w-full"
                  isProfessionalMode={false}
                  onEnterProfessionalMode={handleEnterProfessionalMode}
                  onSignUpClick={onSignUpClick}
                  onThumbnailGenerated={() => {
                    // After generating, switch to app mode
                    switchView('generator');
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* Gallery Thumbnail Detail Drawer */}
      <ThumbnailDetailDrawer
        thumbnail={selectedGalleryThumbnail}
        isOpen={isGalleryDrawerOpen}
        onClose={() => {
          setIsGalleryDrawerOpen(false);
          setSelectedGalleryThumbnail(null);
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
    </div>
  );
};

export default ThumbnailHero; 
// src/components/pages/CTREngine/CreativePage.tsx
// Premium Creative Thumbnail Generation Page

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Palette, 
  Wand2, 
  RefreshCw, 
  AlertCircle, 
  X, 
  Clock, 
  Zap,
  Image as ImageIcon,
  Share2,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import CTREngineLayout from './CTREngineLayout';
import { usePublicThumbnailGenerator, AspectRatio, Resolution } from '../../../hooks/usePublicThumbnailGenerator';
import useCTREngine from '../../../hooks/useCTREngine';
import { ThumbnailDetailDrawer } from '../ThumbnailLanding/ThumbnailDetailDrawer';
import { ViralSharePopup } from '../ThumbnailLanding/ViralSharePopup';
import { AspectRatioSelector } from '../ThumbnailLanding/AspectRatioSelector';
import { ResolutionSelector } from '../ThumbnailLanding/ResolutionSelector';
import { FaceConsistencyToggle } from '../ThumbnailLanding/FaceConsistencyToggle';
import { TitleTextInput, TitleStyle, TitlePosition, TitleColor } from '../ThumbnailLanding/TitleTextInput';

const CreativePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { quota, isLoadingQuota, error: ctrError, clearError: clearCtrError } = useCTREngine();
  const {
    generateThumbnail,
    thumbnails,
    loading,
    error,
    quotaInfo,
    clearError,
  } = usePublicThumbnailGenerator();

  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [promptFromUrl, setPromptFromUrl] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViralShareOpen, setIsViralShareOpen] = useState(false);
  const [shareSelectedThumbnail, setShareSelectedThumbnail] = useState<any>(null);

  // Form State
  const [prompt, setPrompt] = useState('');
  // NEW: Gemini 3 Pro options
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [includeFace, setIncludeFace] = useState(false);
  // Style & variations
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedVariations, setSelectedVariations] = useState(2);
  const [title, setTitle] = useState('');
  const [titleStyle, setTitleStyle] = useState<TitleStyle>({
    bold: true,
    outline: false,
    shadow: true,
    uppercase: true
  });
  const [titlePosition, setTitlePosition] = useState<TitlePosition>({
    vertical: 'top',
    horizontal: 'center'
  });
  const [titleColor, setTitleColor] = useState<TitleColor>({
    primary: 'white',
    name: 'White'
  });

  // Read prompt from URL params (from optimize-prompt flow)
  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt && !promptFromUrl) {
      setPrompt(decodeURIComponent(urlPrompt));
      setPromptFromUrl(true);
      // Show a hint that this is an optimized prompt
    }
  }, [searchParams, promptFromUrl]);

  // Example prompts
  const examplePrompts = [
    "How to Build a Gaming PC in 2024",
    "React Tutorial for Beginners",
    "Best Travel Destinations 2024",
    "Healthy Meal Prep Ideas",
    "iPhone 15 Pro Max Review"
  ];

  // Style presets
  const stylePresets = [
    { id: '', label: 'Default', icon: '✨' },
    { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
    { id: 'vibrant', label: 'Vibrant', icon: '🌈' },
    { id: 'minimal', label: 'Minimal', icon: '◻️' },
    { id: 'dramatic', label: 'Dramatic', icon: '🔥' },
    { id: 'retro', label: 'Retro', icon: '📼' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    clearError();
    await generateThumbnail(prompt, {
      // Gemini 3 Pro options (default model)
      aspectRatio,
      resolution,
      includeFace,
      // Style & variations
      style: selectedStyle.trim() || undefined,
      n: selectedVariations,
      // Title overlay
      title: title.trim() || undefined,
      titleStyle: title.trim() ? titleStyle : undefined,
      titlePosition: title.trim() ? titlePosition : undefined,
      titleColor: title.trim() ? titleColor : undefined
    });
  };

  const handleThumbnailClick = (thumbnail: any) => {
    setSelectedThumbnail(thumbnail);
    setIsDrawerOpen(true);
  };

  const handleShare = (thumbnail: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareSelectedThumbnail(thumbnail);
    setIsViralShareOpen(true);
  };

  const canGenerate = quotaInfo ? quotaInfo.remaining > 0 : true;

  return (
    <CTREngineLayout quota={quota} isLoadingQuota={isLoadingQuota}>
      {/* Page Header */}
      <div className="text-center mb-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#fa7517]/10 border border-[#fa7517]/30 rounded-full text-[#fa7517] text-sm font-medium mb-4"
        >
          <Palette className="w-4 h-4" />
          Creative Studio
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Create{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7517] to-orange-400">
            Stunning
          </span>{' '}
          Thumbnails
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 max-w-lg mx-auto"
        >
          Describe your vision and let AI bring it to life with professional-quality thumbnails
        </motion.p>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {(error || ctrError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-4xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 backdrop-blur-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-red-400">{error || ctrError}</p>
            <button
              onClick={() => { clearError(); clearCtrError(); }}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8"
        >
          <form onSubmit={handleGenerate}>
            {/* Optimized Prompt Banner */}
            {promptFromUrl && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-gradient-to-r from-[#fa7517]/10 to-orange-500/10 border border-[#fa7517]/20 rounded-xl flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[#fa7517]/20 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-[#fa7517]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Optimized Prompt Loaded</p>
                  <p className="text-xs text-gray-400">This prompt was AI-optimized based on your audit results</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPromptFromUrl(false)}
                  className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Prompt Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#fa7517]" />
                Describe Your Thumbnail
                {promptFromUrl && (
                  <span className="px-2 py-0.5 bg-[#fa7517]/20 text-[#fa7517] text-xs rounded-full font-medium">
                    Optimized
                  </span>
                )}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A vibrant gaming thumbnail featuring a surprised face with glowing neon effects and bold 3D text..."
                rows={promptFromUrl ? 6 : 3}
                className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white 
                          placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                          focus:border-[#fa7517]/50 backdrop-blur-sm transition-all resize-none
                          ${promptFromUrl ? 'border-[#fa7517]/30' : 'border-white/10'}`}
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500">{prompt.length}/500 characters • Be specific for better results</p>
            </div>

            {/* Example Prompts */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((example, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Presets */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#fa7517]" />
                Style
              </label>
              <div className="flex flex-wrap gap-2">
                {stylePresets.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                              ${selectedStyle === style.id
                                ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                              }`}
                  >
                    <span>{style.icon}</span>
                    <span>{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
            >
              <Settings className="w-4 h-4" />
              <span>Advanced Options</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Advanced Options */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-6 mb-6">
                    {/* Gemini 3 Pro Badge */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Powered by Gemini 3 Pro
                      </div>
                      <span className="text-gray-500">• Face consistency • Up to 4K • 10 aspect ratios</span>
                    </div>

                    {/* Aspect Ratio Selector */}
                    <AspectRatioSelector
                      selectedRatio={aspectRatio}
                      onRatioChange={setAspectRatio}
                      disabled={loading}
                    />

                    {/* Resolution & Variations Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Resolution */}
                      <ResolutionSelector
                        selectedResolution={resolution}
                        onResolutionChange={setResolution}
                        disabled={loading}
                        isPremiumUser={quotaInfo?.tier === 'pro' || quotaInfo?.tier === 'enterprise'}
                      />

                      {/* Variations */}
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Variations</h3>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setSelectedVariations(num)}
                              disabled={loading}
                              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2
                                         ${selectedVariations === num
                                           ? 'border-[#fa7517] bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                                           : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                                         }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Face Consistency Toggle */}
                    <FaceConsistencyToggle
                      enabled={includeFace}
                      onToggle={setIncludeFace}
                      disabled={loading}
                    />

                    {/* Title Overlay */}
                    <TitleTextInput
                      title={title}
                      onTitleChange={setTitle}
                      style={titleStyle}
                      onStyleChange={setTitleStyle}
                      position={titlePosition}
                      onPositionChange={setTitlePosition}
                      color={titleColor}
                      onColorChange={setTitleColor}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || !canGenerate || !prompt.trim()}
              whileHover={{ scale: canGenerate && !loading && prompt.trim() ? 1.02 : 1 }}
              whileTap={{ scale: canGenerate && !loading && prompt.trim() ? 0.98 : 1 }}
              className={`relative w-full py-4 px-6 rounded-xl font-semibold text-white transition-all
                         flex items-center justify-center gap-2 overflow-hidden
                         ${canGenerate && !loading && prompt.trim()
                           ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 shadow-lg shadow-[#fa7517]/25 hover:shadow-[#fa7517]/40'
                           : 'bg-white/10 cursor-not-allowed text-gray-400'
                         }`}
            >
              {/* Shimmer effect */}
              {canGenerate && !loading && prompt.trim() && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
              )}
              
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating {selectedVariations} thumbnail{selectedVariations > 1 ? 's' : ''}...</span>
                </>
              ) : !canGenerate ? (
                'Daily quota reached'
              ) : !prompt.trim() ? (
                'Enter a description to generate'
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate {selectedVariations} Thumbnail{selectedVariations > 1 ? 's' : ''}</span>
                </>
              )}
            </motion.button>

            {/* Quota Info */}
            {quotaInfo && (
              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#fa7517]" />
                  {quotaInfo.remaining}/{quotaInfo.limit} generations left
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Resets daily
                </span>
              </div>
            )}
          </form>
        </motion.div>

        {/* Generated Thumbnails */}
        <AnimatePresence>
          {thumbnails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#fa7517]" />
                Generated Thumbnails
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {thumbnails.map((thumbnail, index) => (
                  <motion.div
                    key={thumbnail.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleThumbnailClick(thumbnail)}
                    className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                      <img
                        src={thumbnail.imageUrl}
                        alt={thumbnail.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleShare(thumbnail, e)}
                          className="p-3 bg-white/20 text-white rounded-xl shadow-lg backdrop-blur-sm border border-white/20"
                        >
                          <Share2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-sm text-gray-400 line-clamp-2">{thumbnail.prompt}</p>
                      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(thumbnail.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm"
        >
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#fa7517]" />
            Tips for Great Thumbnails
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-[#fa7517]">•</span>
              Be specific about colors, emotions, and composition
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#fa7517]">•</span>
              Mention text placement and style if you want overlay text
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#fa7517]">•</span>
              Use style presets to achieve consistent visual themes
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#fa7517]">•</span>
              Generate multiple variations to find the perfect one
            </li>
          </ul>
        </motion.div>
      </div>

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
    </CTREngineLayout>
  );
};

export default CreativePage;


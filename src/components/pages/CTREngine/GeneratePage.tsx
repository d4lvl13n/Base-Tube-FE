// src/components/pages/CTREngine/GeneratePage.tsx
// Unified Thumbnail Generation Page - Combines Free-form and CTR-Optimized modes

import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
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
  ChevronUp,
  Target,
  Palette,
  ArrowLeft
} from 'lucide-react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import { usePublicThumbnailGenerator, AspectRatio, Resolution } from '../../../hooks/usePublicThumbnailGenerator';
import useCTREngine from '../../../hooks/useCTREngine';
import { ThumbnailDetailDrawer } from './components/ThumbnailDetailDrawer';
import { ViralSharePopup } from './components/ViralSharePopup';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { ResolutionSelector } from './components/ResolutionSelector';
import { FaceConsistencyToggle } from './components/FaceConsistencyToggle';
import { TitleTextInput, TitleStyle, TitlePosition, TitleColor } from './components/TitleTextInput';
import { NicheSelector } from './components/NicheSelector';
import { GeneratedConceptsGrid } from './components/GeneratedConceptsGrid';

type GenerationMode = 'creative' | 'ctr';

const GeneratePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Get both CTR engine and public generator hooks
  const {
    quota, 
    isLoadingQuota, 
    error: ctrError, 
    clearError: clearCtrError,
    generateThumbnails: generateCTR,
    generatedConcepts: hookGeneratedConcepts,
    detectedNiche: hookDetectedNiche,
    generationTime: hookGenerationTime,
    generationProgress: ctrProgress,
    clearGeneratedConcepts,
    niches,
    isLoadingNiches,
    faceReference,
    isAuthenticated,
  } = useCTREngine();

  // Use concepts from navigation state if available (from "Generate Better Thumbnail" flow)
  const navigationState = location.state as {
    generatedConcepts?: any[];
    detectedNiche?: string;
    generationTime?: number;
    optimizedPrompt?: any;
  } | null;
  
  const generatedConcepts = navigationState?.generatedConcepts || hookGeneratedConcepts;
  const detectedNiche = navigationState?.detectedNiche || hookDetectedNiche;
  const ctrGenerationTime = navigationState?.generationTime || hookGenerationTime;

  const {
    generateThumbnail,
    thumbnails,
    loading,
    error,
    quotaInfo,
    clearError,
  } = usePublicThumbnailGenerator();

  // Mode state - read from URL params for deep linking
  const urlMode = searchParams.get('mode') as GenerationMode | null;
  const urlPrompt = searchParams.get('prompt');
  const [mode, setMode] = useState<GenerationMode>(urlMode === 'ctr' ? 'ctr' : 'creative');

  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViralShareOpen, setIsViralShareOpen] = useState(false);
  const [shareSelectedThumbnail, setShareSelectedThumbnail] = useState<any>(null);

  // Creative mode state
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [includeFace, setIncludeFace] = useState(false);
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

  // CTR mode state
  const [ctrTitle, setCtrTitle] = useState('');
  const [ctrDescription, setCtrDescription] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [textOverlay, setTextOverlay] = useState('');
  const [ctrIncludeFace, setCtrIncludeFace] = useState(false);
  const [concepts, setConcepts] = useState(3);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');

  // Handle URL params for optimized prompt flow
  useEffect(() => {
    if (urlPrompt) {
      if (urlMode === 'ctr') {
        setCtrTitle(decodeURIComponent(urlPrompt));
      } else {
        setPrompt(decodeURIComponent(urlPrompt));
      }
    }
  }, [urlPrompt, urlMode]);

  // Style presets for creative mode
  const stylePresets = [
    { id: '', label: 'Default', icon: '✨' },
    { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
    { id: 'vibrant', label: 'Vibrant', icon: '🌈' },
    { id: 'minimal', label: 'Minimal', icon: '◻️' },
    { id: 'dramatic', label: 'Dramatic', icon: '🔥' },
    { id: 'retro', label: 'Retro', icon: '📼' },
  ];

  // Example prompts for creative mode
  const examplePrompts = [
    { text: "Epic gaming PC build with RGB lights and dramatic smoke", category: "Gaming" },
    { text: "Shocked face reacting to code on screen, neon colors", category: "Tech" },
    { text: "Cinematic mountain landscape with golden hour lighting", category: "Travel" },
    { text: "Colorful healthy meal prep containers, top-down view", category: "Lifestyle" },
  ];

  const handleCreativeGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    clearError();
    await generateThumbnail(prompt, {
      aspectRatio,
      resolution,
      includeFace,
      style: selectedStyle.trim() || undefined,
      n: selectedVariations,
      title: title.trim() || undefined,
      titleStyle: title.trim() ? titleStyle : undefined,
      titlePosition: title.trim() ? titlePosition : undefined,
      titleColor: title.trim() ? titleColor : undefined
    });
  };

  const handleCTRGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctrTitle.trim()) return;

    await generateCTR({
      title: ctrTitle.trim(),
      description: ctrDescription.trim() || undefined,
      niche: selectedNiche || undefined,
      textOverlay: textOverlay.trim() || undefined,
      includeFace: ctrIncludeFace && faceReference?.hasFaceReference,
      concepts,
      quality,
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

  const canGenerateCreative = quotaInfo ? quotaInfo.remaining > 0 : true;
  const canGenerateCTR = ctrTitle.trim().length > 0 && (quota?.generate?.remaining === undefined || quota.generate.remaining > 0);

  // Show CTR results if we have them
  if (generatedConcepts.length > 0) {
    return (
      <AIThumbnailsLayout quota={quota} isLoadingQuota={isLoadingQuota}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Back Button */}
            <div className="mb-6">
              <motion.button
                onClick={clearGeneratedConcepts}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Generate New Thumbnails
              </motion.button>
            </div>

            <GeneratedConceptsGrid 
              concepts={generatedConcepts}
              detectedNiche={detectedNiche}
            generationTime={ctrGenerationTime}
              onClear={clearGeneratedConcepts}
            />
          </motion.div>
      </AIThumbnailsLayout>
    );
  }

  return (
    <AIThumbnailsLayout quota={quota} isLoadingQuota={isLoadingQuota}>
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

      <div className="max-w-4xl mx-auto w-full">
        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-black/50 rounded-xl border border-gray-800/30 backdrop-blur-sm w-full sm:w-fit">
            <button
              onClick={() => setMode('creative')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none px-3 sm:px-5 py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[44px] sm:min-h-0
                ${mode === 'creative'
                  ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Palette className="w-4 h-4 flex-shrink-0" />
              <span className="hidden xs:inline">Free-form</span>
              <span className="xs:hidden">Free</span>
            </button>
            <button
              onClick={() => setMode('ctr')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none px-3 sm:px-5 py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[44px] sm:min-h-0
                ${mode === 'ctr'
                  ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Target className="w-4 h-4 flex-shrink-0" />
              <span className="hidden xs:inline">CTR-Optimized</span>
              <span className="xs:hidden">CTR</span>
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 px-1">
            {mode === 'creative' 
              ? 'Describe your thumbnail with a creative prompt'
              : 'Enter your video title for AI-optimized thumbnail concepts'}
          </p>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 border border-gray-800/30 rounded-2xl p-4 sm:p-6 backdrop-blur-sm mb-6 sm:mb-8"
        >
          <AnimatePresence mode="wait">
            {mode === 'creative' ? (
              /* ============================================ */
              /* CREATIVE MODE - Prompt-based generation */
              /* ============================================ */
              <motion.form
                key="creative-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleCreativeGenerate}
              >
                {/* Prompt Input */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-[#fa7517] flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Describe Your Thumbnail</span>
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A vibrant gaming thumbnail featuring a surprised face with glowing neon effects and bold 3D text..."
                    rows={4}
                    className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm sm:text-base
                              placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                              focus:border-[#fa7517]/50 backdrop-blur-sm transition-all resize-none"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-gray-500">{prompt.length}/500 characters</p>
                </div>

                {/* Example Prompts */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-black/40 border border-gray-800/50 rounded-xl">
                  <p className="text-xs sm:text-sm font-medium text-white mb-2 sm:mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#fa7517] flex-shrink-0" />
                    Try an example
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    {examplePrompts.map((example, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPrompt(example.text)}
                        className="group flex items-center gap-2 px-3 py-2.5 sm:py-2 bg-black/50 hover:bg-[#fa7517]/10 border border-gray-800/50 hover:border-[#fa7517]/30 rounded-lg transition-all min-h-[44px] sm:min-h-0 text-left"
                      >
                        <span className="px-1.5 py-0.5 bg-[#fa7517]/20 text-[#fa7517] text-[10px] font-semibold rounded flex-shrink-0">
                          {example.category}
                        </span>
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors truncate flex-1">
                          {example.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Presets */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Style</label>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {stylePresets.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        disabled={loading}
                        className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-0
                                  ${selectedStyle === style.id
                                    ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                                  }`}
                      >
                        <span className="text-base sm:text-lg">{style.icon}</span>
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
                      <div className="p-5 bg-black/40 border border-gray-800/50 rounded-xl space-y-6 mb-6">
                        <AspectRatioSelector
                          selectedRatio={aspectRatio}
                          onRatioChange={setAspectRatio}
                          disabled={loading}
                        />

                        <div className="grid md:grid-cols-2 gap-6">
                          <ResolutionSelector
                            selectedResolution={resolution}
                            onResolutionChange={setResolution}
                            disabled={loading}
                            isPremiumUser={quotaInfo?.tier === 'pro' || quotaInfo?.tier === 'enterprise'}
                          />

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

                        <FaceConsistencyToggle
                          enabled={includeFace}
                          onToggle={setIncludeFace}
                          disabled={loading}
                        />

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
                  disabled={loading || !canGenerateCreative || !prompt.trim()}
                  whileHover={{ scale: canGenerateCreative && !loading && prompt.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: canGenerateCreative && !loading && prompt.trim() ? 0.98 : 1 }}
                  className={`relative w-full py-4 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-white transition-all
                             flex items-center justify-center gap-2 overflow-hidden min-h-[52px] sm:min-h-[48px]
                             ${canGenerateCreative && !loading && prompt.trim()
                               ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 shadow-lg shadow-[#fa7517]/25 hover:shadow-[#fa7517]/40'
                               : 'bg-white/10 cursor-not-allowed text-gray-400'
                             }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0" />
                      <span className="text-sm sm:text-base">Creating {selectedVariations} thumbnail{selectedVariations > 1 ? 's' : ''}...</span>
                    </>
                  ) : !canGenerateCreative ? (
                    <>
                      <Clock className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">Daily limit reached</span>
                    </>
                  ) : !prompt.trim() ? (
                    <span className="text-sm sm:text-base">Describe your thumbnail idea</span>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">Create {selectedVariations} Thumbnail{selectedVariations > 1 ? 's' : ''}</span>
                    </>
                  )}
                </motion.button>

                {/* Quota Info */}
                {quotaInfo && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-gray-800/50 rounded-full">
                      <Zap className="w-4 h-4 text-[#fa7517]" />
                      <span className="text-[#fa7517] font-medium">{quotaInfo.used}</span>
                      <span className="text-gray-500">of {quotaInfo.limit} created today</span>
                    </div>
                  </div>
                )}
              </motion.form>
            ) : (
              /* ============================================ */
              /* CTR MODE - Title-based optimized generation */
              /* ============================================ */
              <motion.form
                key="ctr-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleCTRGenerate}
              >
                {/* Optimized prompt banner if from URL */}
                {urlPrompt && urlMode === 'ctr' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-gradient-to-r from-[#fa7517]/10 to-orange-500/10 border border-[#fa7517]/20 rounded-xl flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#fa7517]/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-[#fa7517]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Optimized from Audit</p>
                      <p className="text-xs text-gray-400">This prompt was generated based on your audit results</p>
                    </div>
                  </motion.div>
                )}

                {/* Title Input */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#fa7517]" />
                    Video Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={ctrTitle}
                    onChange={(e) => setCtrTitle(e.target.value)}
                    placeholder="How I Made $10,000 in One Day Trading Crypto"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white 
                              placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                              focus:border-[#fa7517]/50 backdrop-blur-sm transition-all"
                    disabled={ctrProgress.status === 'generating'}
                    maxLength={150}
                  />
                  <p className="mt-1.5 text-xs text-gray-500">{ctrTitle.length}/150 characters</p>
                </div>

                {/* Description Input */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-white mb-2">
                    Description <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={ctrDescription}
                    onChange={(e) => setCtrDescription(e.target.value)}
                    placeholder="Brief description of your video content..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white 
                              placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                              focus:border-[#fa7517]/50 backdrop-blur-sm transition-all resize-none"
                    disabled={ctrProgress.status === 'generating'}
                    maxLength={500}
                  />
                </div>

                {/* Niche Selection */}
                <div className="mb-4 sm:mb-5">
                  <label className="block text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Content Niche</label>
                  <NicheSelector
                niches={niches}
                    selectedNiche={selectedNiche}
                    onSelect={setSelectedNiche}
                    isLoading={isLoadingNiches || ctrProgress.status === 'generating'}
                    variant="pills"
                  />
                </div>

                {/* Text Overlay */}
                <div className="mb-4 sm:mb-5">
                  <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                    Text Overlay <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    placeholder="$10K IN 1 DAY"
                    className="w-full px-3 sm:px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm sm:text-base
                              placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                              focus:border-[#fa7517]/50 backdrop-blur-sm transition-all min-h-[44px] sm:min-h-0"
                    disabled={ctrProgress.status === 'generating'}
                    maxLength={50}
                  />
                  <p className="mt-1.5 text-xs text-gray-500">Short, impactful text for your thumbnail</p>
                </div>

                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors mb-3 sm:mb-4 min-h-[44px] sm:min-h-0"
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span>Advanced Options</span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
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
                      <div className="p-5 bg-black/40 border border-gray-800/50 rounded-xl space-y-5 mb-6">
                        {/* Number of Concepts */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-white mb-2 sm:mb-3">
                            Number of Concepts
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setConcepts(num)}
                                disabled={ctrProgress.status === 'generating'}
                                className={`py-2.5 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[44px] sm:min-h-0
                                           ${concepts === num
                                             ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                                             : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                           }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-gray-500">~{concepts * 15}s generation time</p>
                        </div>

                        {/* Quality */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-white mb-2 sm:mb-3">Quality</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 'low', label: 'Draft' },
                              { value: 'medium', label: 'Standard' },
                              { value: 'high', label: 'High' },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setQuality(opt.value as 'low' | 'medium' | 'high')}
                                disabled={ctrProgress.status === 'generating'}
                                className={`py-2.5 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-0
                                           ${quality === opt.value
                                             ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 text-white shadow-lg shadow-[#fa7517]/25'
                                             : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                           }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Face Reference Toggle */}
                        {isAuthenticated && (
                          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                            <label className="flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#fa7517]/10 flex items-center justify-center">
                                  {faceReference?.thumbnailUrl ? (
                                    <img src={faceReference.thumbnailUrl} alt="Face" className="w-full h-full rounded-xl object-cover" />
                                  ) : (
                                    <ImageIcon className="w-5 h-5 text-[#fa7517]" />
                                  )}
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-white">Include My Face</span>
                                  <p className="text-xs text-gray-500">
                                    {faceReference?.hasFaceReference ? 'Uses saved reference' : 'Set up in Settings'}
                                  </p>
                                </div>
                              </div>
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={ctrIncludeFace}
                                  onChange={(e) => setCtrIncludeFace(e.target.checked)}
                                  disabled={!faceReference?.hasFaceReference}
                                  className="sr-only"
                                />
                                <div className={`w-12 h-6 rounded-full transition-colors ${
                                  ctrIncludeFace && faceReference?.hasFaceReference ? 'bg-[#fa7517]' : 'bg-white/20'
                                }`}>
                                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                                    ctrIncludeFace && faceReference?.hasFaceReference ? 'left-[26px]' : 'left-0.5'
                                  }`} />
                                </div>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Generation Progress */}
                <AnimatePresence>
                  {ctrProgress.status === 'generating' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 p-5 bg-[#fa7517]/10 border border-[#fa7517]/20 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#fa7517]" />
                          Generating {concepts} concept{concepts > 1 ? 's' : ''}...
                        </span>
                        <span className="text-xs text-gray-400">~{concepts * 15}s estimated</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#fa7517] to-orange-500"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: concepts * 15, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={ctrProgress.status === 'generating' || !canGenerateCTR}
                  whileHover={{ scale: canGenerateCTR && ctrProgress.status !== 'generating' ? 1.02 : 1 }}
                  whileTap={{ scale: canGenerateCTR && ctrProgress.status !== 'generating' ? 0.98 : 1 }}
                  className={`relative w-full py-4 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-white transition-all
                             flex items-center justify-center gap-2 overflow-hidden min-h-[52px] sm:min-h-[48px]
                             ${canGenerateCTR && ctrProgress.status !== 'generating'
                               ? 'bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 shadow-lg shadow-[#fa7517]/25 hover:shadow-[#fa7517]/40'
                               : 'bg-white/10 cursor-not-allowed text-gray-400'
                             }`}
                >
                  {ctrProgress.status === 'generating' ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0" />
                      <span className="text-sm sm:text-base">Generating...</span>
                    </>
                  ) : !ctrTitle.trim() ? (
                    <span className="text-sm sm:text-base">Enter a title to generate</span>
                  ) : quota?.generate?.remaining === 0 ? (
                    'Generation quota exhausted'
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      <span>Generate {concepts} CTR Thumbnail{concepts > 1 ? 's' : ''}</span>
                    </>
                  )}
                </motion.button>

                {/* Quota Info */}
                {quota?.generate && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-gray-800/50 rounded-full">
                      <Zap className="w-4 h-4 text-[#fa7517]" />
                      <span className="text-[#fa7517] font-medium">{quota.generate.used}</span>
                      <span className="text-gray-500">of {quota.generate.limit === -1 ? '∞' : quota.generate.limit} generated today</span>
                    </div>
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Generated Creative Thumbnails */}
        <AnimatePresence>
          {thumbnails.length > 0 && mode === 'creative' && (
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
                    className="group bg-black/50 rounded-2xl overflow-hidden border border-gray-800/30 hover:border-[#fa7517]/30 transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                      <img
                        src={thumbnail.imageUrl}
                        alt={thumbnail.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
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
          className="bg-black/50 border border-gray-800/30 rounded-2xl p-5 backdrop-blur-sm"
        >
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#fa7517]" />
            {mode === 'creative' ? 'Tips for Great Thumbnails' : 'CTR Optimization Tips'}
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            {mode === 'creative' ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-[#fa7517]">•</span>
                  Be specific about colors, emotions, and composition
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#fa7517]">•</span>
                  Use style presets to achieve consistent visual themes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#fa7517]">•</span>
                  Generate multiple variations to find the perfect one
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-[#fa7517]">•</span>
                  Use compelling, curiosity-inducing titles
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#fa7517]">•</span>
                  Select the right niche for optimized styling
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#fa7517]">•</span>
                  Add short, impactful text overlays for better CTR
                </li>
              </>
            )}
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
    </AIThumbnailsLayout>
  );
};

export default GeneratePage;


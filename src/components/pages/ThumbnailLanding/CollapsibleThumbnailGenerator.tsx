import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCw, 
  Clock,
  Settings,
  ChevronUp,
  ChevronDown,
  Zap,
  X,
  Share2
} from 'lucide-react';
import { usePublicThumbnailGenerator } from '../../../hooks/usePublicThumbnailGenerator';
import Button from '../../common/Button';
import { ThumbnailDetailDrawer } from './ThumbnailDetailDrawer';
import { ViralSharePopup } from './ViralSharePopup';
import { SizeFormatSelector } from './SizeFormatSelector';
import { TitleTextInput, TitleStyle, TitlePosition, TitleColor } from './TitleTextInput';

interface CollapsibleThumbnailGeneratorProps {
  className?: string;
  initialPrompt?: string;
  onThumbnailGenerated?: (thumbnail: any) => void;
  isProfessionalMode?: boolean;
  onEnterProfessionalMode?: () => void;
  onExitProfessionalMode?: () => void;
}

const CollapsibleThumbnailGenerator: React.FC<CollapsibleThumbnailGeneratorProps> = ({
  className = '',
  initialPrompt = '',
  onThumbnailGenerated,
  isProfessionalMode: externalProfessionalMode,
  onEnterProfessionalMode,
  onExitProfessionalMode
}) => {
  const {
    generateThumbnail,
    thumbnails,
    loading,
    error,
    quotaUsed,
    maxQuota,
    canGenerate,
    clearError,
  } = usePublicThumbnailGenerator();

  // UI State
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViralShareOpen, setIsViralShareOpen] = useState(false);
  const [shareSelectedThumbnail, setShareSelectedThumbnail] = useState<any>(null);
  
  // Use external professional mode if provided, otherwise use internal state
  const isExpanded = externalProfessionalMode !== undefined ? externalProfessionalMode : internalExpanded;

  // Form State
  const [prompt, setPrompt] = useState(initialPrompt);
  
  // Enhanced options (with sensible defaults)
  const [selectedSize, setSelectedSize] = useState<'1024x1024' | '1536x1024' | '1024x1536' | 'auto'>('auto'); // Default to auto (API default)
  const [selectedQuality, setSelectedQuality] = useState<'medium' | 'high'>('high');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedVariations, setSelectedVariations] = useState(2);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
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

  // Example prompts for simple mode
  const examplePrompts = [
    "How to Build a Gaming PC in 2024",
    "React Tutorial for Beginners",
    "Best Travel Destinations 2024",
    "Healthy Meal Prep Ideas",
    "iPhone 15 Pro Max Review"
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    clearError();
    const result = await generateThumbnail(prompt, {
      size: selectedSize,
      quality: selectedQuality,
      style: selectedStyle.trim() || undefined,
      n: selectedVariations,
      referenceImage: referenceImage || undefined,
      title: title.trim() || undefined,
      titleStyle: title.trim() ? titleStyle : undefined,
      titlePosition: title.trim() ? titlePosition : undefined,
      titleColor: title.trim() ? titleColor : undefined
    });
    
    // Call callback if provided
    if (onThumbnailGenerated && thumbnails.length > 0) {
      onThumbnailGenerated(thumbnails[0]);
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const handleThumbnailClick = (thumbnail: any) => {
    setSelectedThumbnail(thumbnail);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedThumbnail(null);
  };

  // Viral sharing function
  const handleShare = (thumbnail: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareSelectedThumbnail(thumbnail);
    setIsViralShareOpen(true);
  };

  const toggleExpanded = () => {
    if (externalProfessionalMode !== undefined) {
      // External mode control - use callbacks
      if (isExpanded && onExitProfessionalMode) {
        onExitProfessionalMode();
      } else if (!isExpanded && onEnterProfessionalMode) {
        onEnterProfessionalMode();
      }
    } else {
      // Internal mode control
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Glow Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-3xl blur-2xl" />
      
      {/* Main Container */}
      <motion.div
        layout
        className="relative bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {isExpanded ? 'Professional Thumbnail Studio' : 'Try It Now'}
              </h3>
              <p className="text-gray-400">
                {isExpanded ? 'Advanced options for perfect thumbnails' : 'Generate your first thumbnail in seconds'}
              </p>
            </div>
            
            {/* Expand/Collapse Button */}
            <motion.button
              onClick={toggleExpanded}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-white transition-all duration-200"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-sm">Simple Mode</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">More Options</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Use div instead of form to avoid automatic submission when pressing Enter */}
          <div className="space-y-6">
            {/* Title Text Input (Expanded Mode - Above Prompt) */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
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
              </motion.div>
            )}

            {/* Prompt Input (Always Visible) */}
            <div className="relative">
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                AI Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the thumbnail you want... (e.g., 'Gaming tutorial with neon lights and controller')"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#fa7517]/50 focus:ring-2 focus:ring-[#fa7517]/20 resize-none transition-all duration-300"
                rows={isExpanded ? 4 : 2}
                maxLength={isExpanded ? 1000 : 500}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                {prompt.length}/{isExpanded ? 1000 : 500}
              </div>
            </div>

            {/* Example Prompts (Simple Mode Only) */}
            {!isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {examplePrompts.slice(0, 3).map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-300 hover:text-white transition-all duration-200"
                  >
                    {example}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Advanced Options (Expanded Mode Only) */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="space-y-6 border-t border-white/10 pt-6"
                >
                  {/* Size Format Selector */}
                  <SizeFormatSelector
                    selectedFormat={selectedSize}
                    onFormatChange={(format) => setSelectedSize(format as typeof selectedSize)}
                  />

                  {/* Quality & Style Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quality Selector */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">
                        Quality
                      </label>
                      <select
                        value={selectedQuality}
                        onChange={(e) => setSelectedQuality(e.target.value as 'medium' | 'high')}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fa7517]/50 focus:ring-2 focus:ring-[#fa7517]/20 transition-all duration-300"
                      >
                        <option value="medium">Medium (Faster)</option>
                        <option value="high">High (Better)</option>
                      </select>
                    </div>

                    {/* Variations Count */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">
                        Variations
                      </label>
                      <select
                        value={selectedVariations}
                        onChange={(e) => setSelectedVariations(parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fa7517]/50 focus:ring-2 focus:ring-[#fa7517]/20 transition-all duration-300"
                      >
                        <option value={1}>1 Thumbnail</option>
                        <option value={2}>2 Thumbnails</option>
                        <option value={3}>3 Thumbnails</option>
                        <option value={4}>4 Thumbnails</option>
                      </select>
                    </div>
                  </div>

                  {/* Style Preset */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Style Preset (Optional)
                    </label>
                    <input
                      type="text"
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      placeholder="e.g., 'MrBeast style', 'Minimalist', 'Retro Vaporwave'"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#fa7517]/50 focus:ring-2 focus:ring-[#fa7517]/20 transition-all duration-300"
                    />
                  </div>

                  {/* Reference Image Upload */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Reference Image (Optional)
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-400">
                              <span className="font-semibold">Click to upload</span> reference image
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, WebP (MAX. 10MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setReferenceImage(file);
                            }}
                          />
                        </label>
                      </div>
                      {referenceImage && (
                        <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#fa7517]/20 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-[#fa7517]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{referenceImage.name}</p>
                              <p className="text-gray-400 text-xs">{(referenceImage.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReferenceImage(null)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>


                </motion.div>
              )}
            </AnimatePresence>

            {/* Quota Display */}
            <div className="flex items-center justify-between text-sm bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#fa7517]" />
                <span className="text-gray-400">
                  Daily generations: {quotaUsed}/{maxQuota} used
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: maxQuota }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < quotaUsed ? 'bg-[#fa7517]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300"
              >
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}

            {/* Generate Button */}
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || loading || !prompt.trim()}
              className="w-full bg-gradient-to-r from-[#fa7517] to-orange-400 hover:from-[#fa7517]/90 hover:to-orange-400/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Magic...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <span>
                    {canGenerate ? 'Generate Thumbnail' : 'Daily Limit Reached'}
                  </span>
                  {isExpanded && title && (
                    <span className="text-sm opacity-75">+ Title</span>
                  )}
                </div>
              )}
            </Button>

            {/* Current Settings Summary (Expanded Mode) */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#fa7517]/10 border border-[#fa7517]/30 rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-[#fa7517]" />
                  <h4 className="text-white font-medium">Generation Settings</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Format:</span>
                    <span className="text-white ml-2">{selectedSize}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Quality:</span>
                    <span className="text-white ml-2">{selectedQuality}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Variations:</span>
                    <span className="text-white ml-2">{selectedVariations}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Style:</span>
                    <span className="text-white ml-2">
                      {selectedStyle ? `"${selectedStyle.substring(0, 15)}..."` : 'Default'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Reference:</span>
                    <span className="text-white ml-2">
                      {referenceImage ? referenceImage.name.substring(0, 15) + '...' : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Title:</span>
                    <span className="text-white ml-2">
                      {title ? `"${title.substring(0, 15)}..."` : 'None'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Generated Thumbnails Preview */}
          {thumbnails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Your Latest Thumbnails</h4>
                <p className="text-xs text-gray-400">Click to view & download</p>
              </div>
              <div className={`grid gap-4 ${isExpanded ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {thumbnails.slice(0, isExpanded ? 6 : 2).map((thumbnail) => (
                  <motion.div
                    key={thumbnail.id}
                    onClick={() => handleThumbnailClick(thumbnail)}
                    className="relative bg-white/5 rounded-xl border border-white/10 hover:border-[#fa7517]/50 transition-all duration-200 group cursor-pointer overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Large Thumbnail Image */}
                    <div className="relative w-full aspect-video bg-gradient-to-br from-[#fa7517]/20 to-orange-400/20 flex items-center justify-center overflow-hidden">
                      {thumbnail.imageUrl ? (
                        <img
                          src={thumbnail.imageUrl}
                          alt={thumbnail.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <Sparkles className="w-12 h-12 text-[#fa7517]" />
                      )}
                      
                      {/* View overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="text-white font-medium">View & Download</span>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        {/* Share button */}
                        <Button
                          onClick={(e) => handleShare(thumbnail, e)}
                          variant="ghost"
                          size="sm"
                          className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Share your creation"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      
                      {/* Regenerate button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateThumbnail(thumbnail.prompt, {
                            size: selectedSize,
                              quality: selectedQuality,
                              style: selectedStyle.trim() || undefined,
                              n: selectedVariations,
                              referenceImage: referenceImage || undefined,
                            title: title.trim() || undefined,
                            titleStyle: title.trim() ? titleStyle : undefined,
                            titlePosition: title.trim() ? titlePosition : undefined,
                            titleColor: title.trim() ? titleColor : undefined
                          });
                        }}
                        variant="ghost"
                        size="sm"
                          className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Regenerate with current settings"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      </div>
                    </div>
                    
                    {/* Thumbnail Info */}
                    <div className="p-4">
                      <p className="text-white text-sm font-medium group-hover:text-[#fa7517] transition-colors mb-2 line-clamp-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {thumbnail.prompt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{new Date(thumbnail.createdAt).toLocaleTimeString()}</span>
                        <span className="bg-[#fa7517]/20 text-[#fa7517] px-2 py-1 rounded-full">
                          Click to view
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {thumbnails.length > (isExpanded ? 6 : 2) && (
                <p className="text-center text-xs text-gray-500">
                  +{thumbnails.length - (isExpanded ? 6 : 2)} more thumbnails
                  {!isExpanded && externalProfessionalMode === undefined && (
                    <button
                      onClick={toggleExpanded}
                      className="text-[#fa7517] hover:text-orange-400 ml-2 underline"
                    >
                      Show all
                    </button>
                  )}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Thumbnail Detail Drawer */}
      <ThumbnailDetailDrawer
        thumbnail={selectedThumbnail}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />

      {/* Viral Share Popup */}
      <ViralSharePopup
        thumbnail={shareSelectedThumbnail}
        isOpen={isViralShareOpen}
        onClose={() => setIsViralShareOpen(false)}
      />
    </div>
  );
};

export default CollapsibleThumbnailGenerator; 
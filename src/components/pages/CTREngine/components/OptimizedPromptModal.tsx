// src/components/pages/CTREngine/components/OptimizedPromptModal.tsx
// Side drawer to display and use optimized prompts from audit results

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Sparkles, 
  ArrowUp, 
  CheckCircle, 
  Edit3, 
  Copy, 
  Check,
  Wand2,
  TrendingUp,
  Zap,
  AlertCircle,
  Minimize2,
  Maximize2,
  RefreshCw,
  ExternalLink,
  Image,
  Download
} from 'lucide-react';
import { OptimizedPrompt, GeneratedConcept } from '../../../../types/ctr';
import { ctrApi } from '../../../../api/ctr';

interface OptimizedPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  optimizedPrompt: OptimizedPrompt | null;
  isLoading?: boolean;
  error?: string | null;
  onGenerate?: (prompt: string) => void;
  onGenerationComplete?: (concepts: GeneratedConcept[]) => void;
  videoTitle?: string;  // Original video title for generation context
}

export const OptimizedPromptModal: React.FC<OptimizedPromptModalProps> = ({
  isOpen,
  onClose,
  optimizedPrompt,
  isLoading = false,
  error = null,
  onGenerate,
  onGenerationComplete,
  videoTitle,
}) => {
  const navigate = useNavigate();
  const [editedPrompt, setEditedPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [generatedConcepts, setGeneratedConcepts] = useState<GeneratedConcept[]>([]);

  // Sync prompt when modal opens
  React.useEffect(() => {
    if (optimizedPrompt?.prompt) {
      setEditedPrompt(optimizedPrompt.prompt);
      setIsEditing(false);
      setIsGenerating(false);
      setLocalError(null);
      setGenerationSuccess(false);
      setGeneratedConcepts([]);
    }
  }, [optimizedPrompt]);

  const handleCopy = async () => {
    const textToCopy = isEditing ? editedPrompt : optimizedPrompt?.prompt || '';
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Use CTR API for generation (same as Generate tab)
  const handleGenerate = useCallback(async () => {
    const promptToUse = isEditing ? editedPrompt : optimizedPrompt?.prompt || '';
    setLocalError(null);
    setGenerationSuccess(false);
    
    console.log('[OptimizedPromptModal] handleGenerate called');
    console.log('[OptimizedPromptModal] Prompt length:', promptToUse.length);
    
    if (onGenerate) {
      // If parent wants to handle generation
      onGenerate(promptToUse);
      onClose();
      return;
    }
    
    // Use CTR API directly (same endpoint as Generate tab)
    setIsGenerating(true);
    
    try {
      console.log('[OptimizedPromptModal] Calling ctrApi.generateThumbnails...');
      
      const result = await ctrApi.generateThumbnails({
        title: videoTitle || 'Optimized Thumbnail',
        description: promptToUse,  // Use the optimized prompt as description
        niche: 'auto',  // Let AI detect the niche
        concepts: 2,  // Generate 2 concepts
        quality: 'high',
        size: '1536x1024',  // 16:9 aspect ratio
      });
      
      console.log('[OptimizedPromptModal] Generation successful:', result);
      setGenerationSuccess(true);
      setGeneratedConcepts(result.concepts);
      setIsExpanded(true);  // Expand drawer to show thumbnails better
      
      // Notify parent of generated concepts
      if (onGenerationComplete) {
        onGenerationComplete(result.concepts);
      }
      
      // Don't auto-close - let user see the results
      
    } catch (err: any) {
      console.error('[OptimizedPromptModal] Generation error:', err);
      setLocalError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [isEditing, editedPrompt, optimizedPrompt?.prompt, onGenerate, videoTitle, onGenerationComplete]);

  const scoreImprovement = optimizedPrompt?.estimatedScoreImprovement || 0;
  const improvementColor = scoreImprovement >= 2 ? 'text-green-400' : scoreImprovement >= 1 ? 'text-yellow-400' : 'text-orange-400';
  const isButtonLoading = isGenerating;
  const displayError = localError;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ 
              x: 0,
              transition: {
                type: "spring",
                damping: 20,
                stiffness: 100,
                duration: 0.6
              }
            }}
            exit={{ 
              x: '100%',
              transition: {
                type: "spring",
                damping: 30,
                stiffness: 200,
                duration: 0.5,
                ease: "easeInOut"
              }
            }}
            className="fixed right-0 top-0 bottom-0 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Container with width animation */}
            <motion.div
              animate={{ 
                width: isExpanded ? 700 : 480,
                transition: {
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                  duration: 0.4
                }
              }}
              className="h-screen max-h-screen bg-gradient-to-br from-[#111114] to-[#0a0a0c] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Gradient Border */}
              <div className="absolute left-0 inset-y-0 w-[2px]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517]/40 via-[#fa7517]/20 to-[#fa7517]/40" />
              </div>

              {/* Content Container */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    delay: 0.15,
                    duration: 0.3,
                    ease: "easeOut"
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 20,
                  transition: {
                    duration: 0.2,
                    ease: "easeIn"
                  }
                }}
                className="h-full flex flex-col"
              >
                {/* Header */}
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center">
                        <Wand2 className="w-5 h-5 text-[#fa7517]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Optimized Prompt</h2>
                        <p className="text-sm text-gray-400">AI-generated prompt to improve your thumbnail</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title={isExpanded ? "Collapse panel" : "Expand panel"}
                      >
                        {isExpanded ? (
                          <Minimize2 className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Maximize2 className="w-5 h-5 text-gray-400" />
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
                  {/* Loading State - Prompt Generation */}
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-14 h-14 rounded-full border-2 border-[#fa7517]/30 border-t-[#fa7517] animate-spin mb-4" />
                      <p className="text-gray-400 font-medium">Generating optimized prompt...</p>
                      <p className="text-gray-500 text-sm mt-1">Analyzing audit results</p>
                    </div>
                  )}

                  {/* Error State - Prompt Generation */}
                  {error && !isLoading && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-medium">Failed to generate prompt</p>
                        <p className="text-red-400/70 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Generation Error State */}
                  {displayError && !isLoading && !error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-400 font-medium">Thumbnail generation failed</p>
                        <p className="text-red-400/70 text-sm mt-1">{displayError}</p>
                        <button
                          onClick={() => setLocalError(null)}
                          className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Success State - Show Generated Thumbnails */}
                  {generationSuccess && generatedConcepts.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-5"
                    >
                      {/* Success Header */}
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-green-400 font-semibold text-lg">Thumbnails Generated!</p>
                          <p className="text-gray-400 text-sm">{generatedConcepts.length} new thumbnails created</p>
                        </div>
                      </div>

                      {/* Generated Thumbnails Preview */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Image className="w-4 h-4 text-[#fa7517]" />
                          Your New Thumbnails
                        </h3>
                        <div className="grid gap-4">
                          {generatedConcepts.map((concept, index) => (
                            <motion.div
                              key={concept.id || index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                            >
                              {/* Thumbnail Image */}
                              <div className="aspect-video relative overflow-hidden bg-black/50">
                                <img
                                  src={concept.thumbnailUrl}
                                  alt={`Generated thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {/* CTR Score Badge */}
                                {concept.estimatedCTRScore !== undefined && (
                                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
                                    <span className="text-sm font-bold text-[#fa7517]">
                                      {concept.estimatedCTRScore.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-400">/10</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Concept Info */}
                              <div className="p-4">
                                <p className="text-white font-medium text-sm mb-2 line-clamp-2">
                                  {concept.conceptName || concept.conceptDescription}
                                </p>
                                {concept.prompt && (
                                  <p className="text-gray-400 text-xs line-clamp-2">
                                    {concept.prompt}
                                  </p>
                                )}
                                
                                {/* Download Button */}
                                <a
                                  href={concept.thumbnailUrl}
                                  download={`thumbnail-${index + 1}.png`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white text-sm font-medium transition-all"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </a>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Success Content */}
                  {optimizedPrompt && !isLoading && !error && (
                    <>
                      {/* Score Improvement Banner */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-gradient-to-r from-[#fa7517]/10 to-orange-500/10 border border-[#fa7517]/20 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                              scoreImprovement >= 2 ? 'from-green-500/20 to-emerald-500/20' : 'from-[#fa7517]/20 to-orange-500/20'
                            } flex items-center justify-center`}>
                              <TrendingUp className={`w-6 h-6 ${improvementColor}`} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Estimated Score Improvement</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-gray-500 line-through text-lg">{optimizedPrompt.originalScore.toFixed(1)}</span>
                                <ArrowUp className={`w-5 h-5 ${improvementColor}`} />
                                <span className="text-2xl font-bold text-white">{optimizedPrompt.estimatedNewScore.toFixed(1)}</span>
                                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                                  scoreImprovement >= 2 ? 'bg-green-500/20 text-green-400' : 'bg-[#fa7517]/20 text-[#fa7517]'
                                }`}>
                                  +{scoreImprovement.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-2">Score Range</p>
                            <div className="flex items-center gap-2">
                              <div className="w-28 h-3 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: `${optimizedPrompt.originalScore * 10}%` }}
                                  animate={{ width: `${optimizedPrompt.estimatedNewScore * 10}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-[#fa7517] to-orange-500 rounded-full"
                                />
                              </div>
                              <span className="text-sm text-gray-400 font-medium">/10</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Improvements List */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#fa7517]" />
                          Improvements Applied
                        </h3>
                        <div className="space-y-3">
                          {optimizedPrompt.improvements.map((improvement, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.08 }}
                              className="flex items-start gap-3 text-sm"
                            >
                              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                              </div>
                              <span className="text-gray-300">{improvement}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Prompt Display/Edit */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Zap className="w-4 h-4 text-[#fa7517]" />
                            Generated Prompt
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsEditing(!isEditing)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isEditing 
                                  ? 'bg-[#fa7517] text-white' 
                                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                              }`}
                            >
                              <Edit3 className="w-3 h-3" />
                              {isEditing ? 'Editing' : 'Edit'}
                            </button>
                            <button
                              onClick={handleCopy}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all"
                            >
                              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        
                        {isEditing ? (
                          <textarea
                            value={editedPrompt}
                            onChange={(e) => setEditedPrompt(e.target.value)}
                            className="w-full min-h-[120px] max-h-[200px] px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm
                                      placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fa7517]/50 
                                      focus:border-[#fa7517]/50 resize-y font-mono"
                          />
                        ) : (
                          <div className="p-4 bg-black/30 border border-white/10 rounded-xl min-h-[120px] max-h-[200px] overflow-y-auto">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                              {optimizedPrompt.prompt}
                            </pre>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Footer - Before Generation */}
                {optimizedPrompt && !isLoading && !error && !generationSuccess && (
                  <div className="flex-shrink-0 p-5 border-t border-white/10 bg-black/30">
                    {/* Generation Progress */}
                    {isButtonLoading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-[#fa7517]/10 border border-[#fa7517]/20 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#fa7517]/20 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-[#fa7517] animate-spin" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">Generating thumbnails...</p>
                            <p className="text-gray-400 text-xs mt-0.5">This may take 10-30 seconds</p>
                          </div>
                        </div>
                        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#fa7517] to-orange-500"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 25, ease: 'linear' }}
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={onClose}
                        disabled={isButtonLoading}
                        className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isButtonLoading ? 'Please wait...' : 'Cancel'}
                      </button>
                      <motion.button
                        onClick={handleGenerate}
                        disabled={isButtonLoading}
                        whileHover={{ scale: isButtonLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isButtonLoading ? 1 : 0.98 }}
                        className="flex-[2] py-3.5 px-4 bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 
                                   text-white font-semibold rounded-xl shadow-lg shadow-[#fa7517]/25 flex items-center justify-center gap-2 transition-all
                                   disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isButtonLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Generating...
                          </>
                        ) : displayError ? (
                          <>
                            <RefreshCw className="w-5 h-5" />
                            Try Again
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Generate Better Thumbnail
                          </>
                        )}
                      </motion.button>
                    </div>
                    {!isButtonLoading && (
                      <p className="text-center text-xs text-gray-500 mt-3">
                        This will generate 2 thumbnails using the optimized prompt
                      </p>
                    )}
                  </div>
                )}

                {/* Footer - After Successful Generation */}
                {generationSuccess && generatedConcepts.length > 0 && (
                  <div className="flex-shrink-0 p-5 border-t border-white/10 bg-black/30">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setGenerationSuccess(false);
                          setGeneratedConcepts([]);
                        }}
                        className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate More
                      </button>
                      <motion.button
                        onClick={() => {
                          navigate('/ai-thumbnails/gallery');
                          onClose();
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-[2] py-3.5 px-4 bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 
                                   text-white font-semibold rounded-xl shadow-lg shadow-[#fa7517]/25 flex items-center justify-center gap-2 transition-all"
                      >
                        <ExternalLink className="w-5 h-5" />
                        View All in Gallery
                      </motion.button>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-full mt-3 py-2.5 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OptimizedPromptModal;


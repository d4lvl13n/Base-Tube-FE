// src/components/pages/CTREngine/components/ThumbnailAuditResult.tsx
// Premium audit results display component

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Lightbulb, Clock, Wand2, BarChart3, ZoomIn, ExternalLink, TrendingUp, Eye } from 'lucide-react';
import { ThumbnailAudit, YouTubeVideoMetadata, OptimizedPrompt } from '../../../../types/ctr';
import { ScoreGauge } from './ScoreGauge';
import { PersonaVotesDisplay } from './PersonaVotesDisplay';
import { NicheBadge } from './NicheSelector';
import { OptimizedPromptModal } from './OptimizedPromptModal';
import { ctrApi } from '../../../../api/ctr';
import { cardStyles } from '../styles/cardTokens';

interface ThumbnailAuditResultProps {
  audit: ThumbnailAudit;
  thumbnailUrl?: string;
  youtubeMetadata?: YouTubeVideoMetadata | null;
  elapsedTime?: number;
  onClear: () => void;
  className?: string;
}

export const ThumbnailAuditResult: React.FC<ThumbnailAuditResultProps> = ({
  audit,
  thumbnailUrl,
  youtubeMetadata,
  elapsedTime,
  onClear,
  className = '',
}) => {
  // Optimize prompt modal state
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState<OptimizedPrompt | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const handleGenerateBetter = async () => {
    setIsOptimizeModalOpen(true);
    setIsOptimizing(true);
    setOptimizeError(null);
    setOptimizedPrompt(null);

    try {
      const result = await ctrApi.optimizePrompt({
        audit: {
          overallScore: audit.overallScore,
          heuristics: audit.heuristics,
          weaknesses: audit.weaknesses,
          suggestions: audit.suggestions,
          detectedNiche: audit.detectedNiche,
        },
        context: {
          title: youtubeMetadata?.title || 'Untitled Video',
          description: youtubeMetadata?.description,
        },
      });
      setOptimizedPrompt(result);
    } catch (error: any) {
      setOptimizeError(error.message || 'Failed to generate optimized prompt');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Get the image URL from props or YouTube metadata
  const imageUrl = thumbnailUrl || youtubeMetadata?.thumbnailUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Audit Results</h2>
          {elapsedTime && (
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5" />
              Analyzed in {(elapsedTime / 1000).toFixed(1)}s
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NicheBadge niche={audit.detectedNiche} />
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            audit.confidence === 'high' 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : audit.confidence === 'medium'
              ? 'bg-[#fa7517]/20 text-[#fa7517] border-[#fa7517]/30'
              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
          }`}>
            {audit.confidence.charAt(0).toUpperCase() + audit.confidence.slice(1)} confidence
          </span>
        </div>
      </div>

      {/* Thumbnail Display - Always visible when available */}
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group rounded-2xl overflow-hidden bg-black border border-gray-800/50"
        >
          <div className="aspect-video overflow-hidden">
            <img
              src={imageUrl}
              alt="Analyzed thumbnail"
              className="w-full h-full object-contain bg-black"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          
          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsImageExpanded(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#fa7517] rounded-xl text-white text-sm font-medium hover:bg-[#fa7517]/80 transition-all"
            >
              <ZoomIn className="w-4 h-4" />
              View Full Size
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm font-medium hover:bg-white/30 transition-all border border-white/20"
            >
              <ExternalLink className="w-4 h-4" />
              Open Original
            </a>
          </div>
        </motion.div>
      )}

      {/* CTR Score - Large Prominent Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${cardStyles.elevated} rounded-2xl p-8`}
      >
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Score Gauge - Center focus */}
          <div className="flex flex-col items-center">
            <ScoreGauge score={audit.overallScore} size="lg" />
            <h3 className="text-xl font-bold text-white mt-4">CTR Score</h3>
            <p className="text-sm text-gray-400">Overall effectiveness</p>
          </div>

          {/* AI-Estimated CTR Band & Summary */}
          <div className="flex-1 grid sm:grid-cols-2 gap-4 w-full">
            {audit.estimatedCTR && (
              <div className="p-5 bg-gradient-to-br from-[#fa7517]/10 to-orange-500/5 border border-[#fa7517]/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-[#fa7517]" />
                  <span className="text-sm font-medium text-gray-300">AI‑estimated CTR band</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#fa7517]">{audit.estimatedCTR.mid}%</span>
                  <span className="text-sm text-gray-500">
                    ({audit.estimatedCTR.low}% - {audit.estimatedCTR.high}%)
                  </span>
                </div>
              </div>
            )}

            <div className="p-5 bg-black/40 border border-gray-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-[#fa7517]" />
                <span className="text-sm font-medium text-gray-300">Quick Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{audit.strengths.length} strength{audit.strengths.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <AlertTriangle className="w-4 h-4 text-[#fa7517]" />
                  <span>{audit.weaknesses.length} to improve</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Lightbulb className="w-4 h-4 text-blue-400" />
                  <span>{audit.suggestions.length} tip{audit.suggestions.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Metrics - Prominent Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`${cardStyles.elevated} rounded-2xl p-6`}
      >
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#fa7517]/20 flex items-center justify-center border border-[#fa7517]/30">
            <BarChart3 className="w-4 h-4 text-[#fa7517]" />
          </div>
          Detailed Metrics
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Mobile Readability', value: audit.heuristics.mobileReadability, icon: '📱', desc: 'Text clarity on small screens' },
            { label: 'Color Contrast', value: audit.heuristics.colorContrast, icon: '🎨', desc: 'Visual distinction & pop' },
            { label: 'Composition', value: audit.heuristics.compositionScore, icon: '📐', desc: 'Layout & visual balance' },
            { label: 'Brightness', value: audit.heuristics.brightness, icon: '☀️', desc: 'Light level optimization' },
          ].map((item, index) => {
            const numValue = typeof item.value === 'number' ? item.value : 0;
            const percentage = numValue * 10;
            const isGood = numValue >= 7;
            const isMedium = numValue >= 5 && numValue < 7;
            
            return (
              <motion.div 
                key={item.label} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="p-4 bg-black/60 border border-gray-800/50 rounded-xl hover:border-[#fa7517]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-2xl">{item.icon}</span>
                    <h4 className="text-sm font-semibold text-white mt-1">{item.label}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className={`text-2xl font-bold ${
                    isGood ? 'text-[#fa7517]' : isMedium ? 'text-orange-400' : 'text-gray-400'
                  }`}>
                    {numValue.toFixed(1)}
                  </div>
                </div>
                <div className="h-3 bg-black/80 border border-gray-800/50 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isGood ? 'bg-gradient-to-r from-[#fa7517] to-orange-500' 
                      : isMedium ? 'bg-gradient-to-r from-orange-500/80 to-yellow-500/80' 
                      : 'bg-gradient-to-r from-gray-600 to-gray-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.6 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Analysis Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Strengths */}
        {audit.strengths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={`p-6 ${cardStyles.base} rounded-xl border-l-4 border-l-green-500`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Strengths</h3>
            </div>
            <ul className="space-y-2.5">
              {audit.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2.5">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Areas to Improve */}
        {audit.weaknesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-6 ${cardStyles.base} rounded-xl border-l-4 border-l-[#fa7517]`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#fa7517]/20 flex items-center justify-center border border-[#fa7517]/30">
                <AlertTriangle className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h3 className="text-lg font-semibold text-white">To Improve</h3>
            </div>
            <ul className="space-y-2.5">
              {audit.weaknesses.map((weakness, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2.5">
                  <span className="text-[#fa7517] mt-0.5 flex-shrink-0">!</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Recommendations */}
        {audit.suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`p-6 ${cardStyles.base} rounded-xl border-l-4 border-l-blue-500`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Lightbulb className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Tips</h3>
            </div>
            <ol className="space-y-2.5">
              {audit.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                    {i + 1}
                  </span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </div>

      {/* Persona Analysis */}
      {audit.personaVotes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PersonaVotesDisplay votes={audit.personaVotes} />
        </motion.div>
      )}

      {/* Primary CTA - Generate Better Thumbnail */}
      {audit.weaknesses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateBetter}
            className="w-full py-5 px-6 bg-gradient-to-r from-[#fa7517] to-orange-500 
                      hover:from-[#fa7517]/90 hover:to-orange-500/90 text-black rounded-xl font-bold text-lg
                      transition-all shadow-lg shadow-[#fa7517]/25 flex items-center justify-center gap-3"
          >
            <Wand2 className="w-6 h-6" />
            Generate Better Thumbnail
            <span className="px-3 py-1 bg-black/20 rounded-full text-sm font-semibold">
              +{Math.min(audit.weaknesses.length * 0.8, 3).toFixed(1)} potential score
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* Optimized Prompt Modal */}
      <OptimizedPromptModal
        isOpen={isOptimizeModalOpen}
        onClose={() => setIsOptimizeModalOpen(false)}
        optimizedPrompt={optimizedPrompt}
        isLoading={isOptimizing}
        error={optimizeError}
        videoTitle={youtubeMetadata?.title}
      />

      {/* Full Size Image Modal */}
      {isImageExpanded && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageExpanded(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt="Analyzed thumbnail - full size"
              className="w-full rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setIsImageExpanded(false)}
              className="absolute -top-4 -right-4 w-12 h-12 bg-[#fa7517] rounded-full flex items-center justify-center text-white text-xl font-bold hover:bg-[#fa7517]/80 transition-colors shadow-lg"
            >
              ×
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 bg-black/80 backdrop-blur-sm rounded-xl text-white text-sm font-medium hover:bg-black transition-all border border-white/20"
            >
              <ExternalLink className="w-4 h-4" />
              Open Original
            </a>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ThumbnailAuditResult;

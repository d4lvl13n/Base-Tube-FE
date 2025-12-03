// src/components/pages/CTREngine/components/ThumbnailAuditResult.tsx
// Premium audit results display component

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Lightbulb, RefreshCw, Sparkles, ArrowRight, TrendingUp, Clock, Eye, Wand2 } from 'lucide-react';
import { ThumbnailAudit, YouTubeVideoMetadata, OptimizedPrompt } from '../../../../types/ctr';
import { ScoreGauge } from './ScoreGauge';
import { HeuristicScores } from './HeuristicScores';
import { PersonaVotesDisplay } from './PersonaVotesDisplay';
import { NicheBadge } from './NicheSelector';
import { OptimizedPromptModal } from './OptimizedPromptModal';
import { ctrApi } from '../../../../api/ctr';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-8 ${className}`}
    >
      {/* Header */}
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 
                     border border-white/10 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          New Audit
        </motion.button>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Preview & Score */}
        <div className="space-y-6">
          {/* Thumbnail Preview */}
          {(thumbnailUrl || youtubeMetadata?.thumbnailUrl) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 group"
            >
              <img
                src={thumbnailUrl || youtubeMetadata?.thumbnailUrl}
                alt="Analyzed thumbnail"
                className="w-full aspect-video object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Niche badge */}
              <div className="absolute top-4 right-4">
                <NicheBadge niche={audit.detectedNiche} />
              </div>
              
              {/* Confidence badge */}
              <div className="absolute bottom-4 left-4">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm border ${
                  audit.confidence === 'high' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : audit.confidence === 'medium'
                    ? 'bg-[#fa7517]/20 text-[#fa7517] border-[#fa7517]/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {audit.confidence.charAt(0).toUpperCase() + audit.confidence.slice(1)} Confidence
                </span>
              </div>
            </motion.div>
          )}

          {/* YouTube Metadata */}
          {youtubeMetadata && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm"
            >
              <h3 className="font-semibold text-white line-clamp-2">{youtubeMetadata.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{youtubeMetadata.channelTitle}</p>
              {youtubeMetadata.viewCount && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {youtubeMetadata.viewCount.toLocaleString()} views
                </p>
              )}
            </motion.div>
          )}

          {/* Main Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">CTR Score</h3>
                <p className="text-sm text-gray-400">
                  Overall thumbnail effectiveness
                </p>
              </div>
              <ScoreGauge score={audit.overallScore} size="lg" />
            </div>

            {/* Estimated CTR Range */}
            {audit.estimatedCTR && (
              <div className="mt-6 pt-5 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#fa7517]" />
                  Estimated CTR Range
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Low', value: audit.estimatedCTR.low },
                    { label: 'Expected', value: audit.estimatedCTR.mid, highlight: true },
                    { label: 'High', value: audit.estimatedCTR.high },
                  ].map((item) => (
                    <div 
                      key={item.label}
                      className={`text-center p-3 rounded-lg ${
                        item.highlight 
                          ? 'bg-[#fa7517]/20 border border-[#fa7517]/30' 
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <p className={`text-lg font-bold ${item.highlight ? 'text-[#fa7517]' : 'text-white'}`}>
                        {item.value}%
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Analysis */}
        <div className="space-y-5">
          {/* Strengths */}
          {audit.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
            >
              <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                Strengths
              </h3>
              <ul className="space-y-2">
                {audit.strengths.map((strength, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="text-sm text-gray-300 flex items-start gap-2.5"
                  >
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    {strength}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Weaknesses */}
          {audit.weaknesses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                Areas to Improve
              </h3>
              <ul className="space-y-2">
                {audit.weaknesses.map((weakness, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    className="text-sm text-gray-300 flex items-start gap-2.5"
                  >
                    <span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>
                    {weakness}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Suggestions */}
          {audit.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 bg-[#fa7517]/10 border border-[#fa7517]/20 rounded-xl"
            >
              <h3 className="text-sm font-semibold text-[#fa7517] mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#fa7517]/20 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                Recommendations
              </h3>
              <ol className="space-y-2.5">
                {audit.suggestions.map((suggestion, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    className="text-sm text-gray-300 flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-[#fa7517]/20 text-[#fa7517] text-xs font-semibold">
                      {i + 1}
                    </span>
                    {suggestion}
                  </motion.li>
                ))}
              </ol>
            </motion.div>
          )}
        </div>
      </div>

      {/* Heuristic Scores */}
      <HeuristicScores heuristics={audit.heuristics} />

      {/* Persona Votes */}
      {audit.personaVotes && (
        <PersonaVotesDisplay votes={audit.personaVotes} />
      )}

      {/* Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4 pt-6 border-t border-white/10"
      >
        {/* Primary Action - Generate Better Thumbnail */}
        {audit.weaknesses.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateBetter}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#fa7517] to-orange-500 
                      hover:from-[#fa7517]/90 hover:to-orange-500/90 text-white rounded-xl font-semibold 
                      transition-all shadow-lg shadow-[#fa7517]/25 flex items-center justify-center gap-3"
          >
            <Wand2 className="w-5 h-5" />
            Generate Better Thumbnail
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              +{Math.min(audit.weaknesses.length * 0.8, 3).toFixed(1)} score
            </span>
          </motion.button>
        )}

        {/* Secondary Actions */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClear}
            className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl 
                      font-medium transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Audit Another
          </motion.button>
          <motion.a
            href="/ai-thumbnails/creative"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl 
                      font-medium transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Creative Studio
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>
      </motion.div>

      {/* Optimized Prompt Modal */}
      <OptimizedPromptModal
        isOpen={isOptimizeModalOpen}
        onClose={() => setIsOptimizeModalOpen(false)}
        optimizedPrompt={optimizedPrompt}
        isLoading={isOptimizing}
        error={optimizeError}
        videoTitle={youtubeMetadata?.title}
      />
    </motion.div>
  );
};

export default ThumbnailAuditResult;

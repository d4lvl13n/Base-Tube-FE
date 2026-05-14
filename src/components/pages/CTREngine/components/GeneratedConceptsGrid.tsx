// src/components/pages/CTREngine/components/GeneratedConceptsGrid.tsx
// Premium grid display for generated thumbnail concepts

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink, RefreshCw, Sparkles, BarChart2, Clock } from 'lucide-react';
import { GeneratedConcept } from '../../../../types/ctr';
import type { ThumbnailConversationState, ThumbnailOutputFormat } from '../../../../types/thumbnail';
import { thumbnailApi } from '../../../../api/thumbnail';
import { ScoreBadge } from './ScoreGauge';
import { NicheBadge } from './NicheSelector';

interface GeneratedConceptsGridProps {
  concepts: GeneratedConcept[];
  detectedNiche: string | null;
  generationTime: number | null;
  outputFormat?: ThumbnailOutputFormat;
  onClear: () => void;
  className?: string;
}

interface ConceptCardProps {
  concept: GeneratedConcept;
  index: number;
  outputFormat: ThumbnailOutputFormat;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, index, outputFormat }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState(concept.thumbnailUrl);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [conversation, setConversation] = useState<ThumbnailConversationState | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const imageAspectClass = outputFormat === 'short' ? 'aspect-[9/16]' : 'aspect-video';

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(currentThumbnailUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thumbnail-${concept.conceptName.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRefine = async () => {
    const instruction = refineInstruction.trim();
    if (!instruction) {
      setRefineError('Describe the change you want to make.');
      return;
    }

    setIsRefining(true);
    setRefineError(null);

    try {
      const result = await thumbnailApi.refineThumbnailConversationally({
        instruction,
        imageUrl: conversation ? undefined : currentThumbnailUrl,
        previousResponseId: conversation?.responseId,
        imageGenerationCallId: conversation?.imageGenerationCallId,
        size: outputFormat,
        quality: 'high',
      });

      if (!result.data?.thumbnailUrl || !result.data?.conversation) {
        throw new Error('The refinement response was missing thumbnail data.');
      }

      setCurrentThumbnailUrl(result.data.thumbnailUrl);
      setConversation(result.data.conversation);
      setRefineInstruction('');
    } catch (error: any) {
      setRefineError(error.response?.data?.error?.message ||
                     error.response?.data?.message ||
                     error.message ||
                     'Failed to refine thumbnail.');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#fa7517]/30 transition-all duration-300 backdrop-blur-sm"
    >
      {/* Thumbnail Image */}
      <div className={`relative ${imageAspectClass} bg-black/40 overflow-hidden`}>
        <img
          src={currentThumbnailUrl}
          alt={concept.conceptName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-3 bg-white text-black rounded-xl shadow-lg"
          >
            {isDownloading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Download className="w-5 h-5" />
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.open(currentThumbnailUrl, '_blank')}
            className="p-3 bg-white/20 text-white rounded-xl shadow-lg backdrop-blur-sm border border-white/20"
          >
            <ExternalLink className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Score Badge */}
        <div className="absolute top-3 right-3">
          <ScoreBadge score={concept.estimatedCTRScore} />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        <h3 className="font-semibold text-white text-lg mb-1">{concept.conceptName}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-4">
          {concept.conceptDescription}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#fa7517] to-orange-500 hover:from-[#fa7517]/90 hover:to-orange-500/90 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-[#fa7517]/25 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>
          
          <motion.a
            href={`/ai-thumbnails/audit?url=${encodeURIComponent(currentThumbnailUrl)}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <BarChart2 className="w-4 h-4" />
            Audit
          </motion.a>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fa7517]" />
              Refine
            </p>
            {conversation && (
              <span className="rounded-full border border-[#fa7517]/30 bg-[#fa7517]/10 px-2 py-0.5 text-[10px] text-[#ffb37a]">
                Follow-up
              </span>
            )}
          </div>
          <textarea
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            rows={2}
            placeholder="Make the face more surprised, keep everything else"
            className="w-full resize-none rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#fa7517]/50"
          />
          {refineError && (
            <p className="mt-2 text-xs text-red-300">{refineError}</p>
          )}
          <button
            type="button"
            onClick={handleRefine}
            disabled={isRefining || !refineInstruction.trim()}
            className={`mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              isRefining || !refineInstruction.trim()
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-white text-black hover:bg-[#fa7517]'
            }`}
          >
            {isRefining ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Refining
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Apply refinement
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const GeneratedConceptsGrid: React.FC<GeneratedConceptsGridProps> = ({
  concepts,
  detectedNiche,
  generationTime,
  outputFormat = 'landscape',
  onClear,
  className = '',
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Generated Concepts</h2>
          <div className="flex items-center gap-4 flex-wrap">
            {detectedNiche && <NicheBadge niche={detectedNiche} />}
            {generationTime && (
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Generated in {(generationTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Generate New
        </motion.button>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {concepts.map((concept, index) => (
          <ConceptCard key={concept.id} concept={concept} index={index} outputFormat={outputFormat} />
        ))}
      </div>

      {/* Bottom Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-10 flex justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClear}
          className="py-3 px-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-[#fa7517]" />
          Generate More Concepts
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default GeneratedConceptsGrid;

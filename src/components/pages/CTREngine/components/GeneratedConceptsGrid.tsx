import { thumbnailMediaUrl } from '../../../../utils/thumbnailMediaUrl';
import { ThumbnailConceptComparison } from '../../../common/ThumbnailConceptComparison';
import { AuditContext } from '../../../../types/ctr';
import { PreciseThumbnailEditor } from '../../../common/PreciseThumbnailEditor';
// src/components/pages/CTREngine/components/GeneratedConceptsGrid.tsx
// Premium grid display for generated thumbnail concepts

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink, RefreshCw, Sparkles, BarChart2, Clock, Type } from 'lucide-react';
import { GeneratedConcept } from '../../../../types/ctr';
import type { ThumbnailOutputFormat } from '../../../../types/thumbnail';
import { thumbnailApi } from '../../../../api/thumbnail';
import { NicheBadge } from './NicheSelector';

interface GeneratedConceptsGridProps {
  concepts: GeneratedConcept[];
  detectedNiche: string | null;
  generationTime: number | null;
  outputFormat?: ThumbnailOutputFormat;
  onClear: () => void;
  className?: string;
  auditContext?: AuditContext;
  onComparisonComplete?: () => void | Promise<void>;
}

interface ConceptCardProps {
  concept: GeneratedConcept;
  index: number;
  onImageChange: (id: string, imageUrl: string) => void;
  outputFormat: ThumbnailOutputFormat;
}

/**
 * Condense a full strategy label ("Neo-minimal — one focal point") into a short
 * badge label ("Neo-minimal"). Falls back to the full label if there is no dash.
 */
const shortStrategyLabel = (label: string): string => {
  const [head] = label.split(/\s*[—–-]\s*/);
  return (head || label).trim();
};

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, index, outputFormat, onImageChange }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState(concept.thumbnailUrl);
  const [editRoot] = useState(concept.thumbnailUrl);
  const [, setIsRefining] = useState(false);
  const imageAspectClass = outputFormat === 'short' ? 'aspect-[9/16]' : 'aspect-video';

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(thumbnailMediaUrl(currentThumbnailUrl));
      if (!response.ok) throw new Error('Thumbnail download failed.');
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


  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      className="ai-concept-card group bg-[#111113] rounded-2xl overflow-hidden border border-white/[0.09] hover:border-[#fa7517]/30 transition-colors duration-300"
    >
      {/* Thumbnail Image */}
      <div className={`relative ${imageAspectClass} bg-black/40 overflow-hidden`}>
        <img
          src={thumbnailMediaUrl(currentThumbnailUrl)}
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

      </div>

      {/* Card Content */}
      <div className="p-5">
        {concept.strategy && (
          <span
            title={concept.strategy.label}
            className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full bg-[#fa7517]/10 border border-[#fa7517]/30 text-[#fa7517] text-[11px] font-semibold uppercase tracking-wide"
          >
            <Sparkles className="w-3 h-3" />
            {shortStrategyLabel(concept.strategy.label)}
          </span>
        )}
        <h3 className="font-semibold text-white text-lg mb-1">{concept.conceptName}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-4">
          {concept.conceptDescription}
        </p>

        {concept.adjustmentError && <p role="alert" className="text-xs text-amber-300">{concept.adjustmentError}</p>}
        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-4 bg-[#f97316] hover:bg-[#fb923c] text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
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

        <PreciseThumbnailEditor key={editRoot} initial={{ imageUrl: editRoot, id: concept.id, editing: concept.editing }}
          onRefine={async (version, instruction) => {
            setIsRefining(true);
            try {
              const result = await thumbnailApi.refineThumbnailConversationally({ instruction, thumbnailId: version.editing ? version.id : undefined, imageUrl: version.editing ? undefined : version.imageUrl, size: outputFormat, quality: 'high' });
              return { id: result.data.id, imageUrl: result.data.thumbnailUrl, shareUrl: result.data.shareUrl, conversation: result.data.conversation };
            } finally { setIsRefining(false); }
          }}
          onChange={version => { setCurrentThumbnailUrl(version.imageUrl); onImageChange(concept.id, version.imageUrl); }} />

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
  auditContext,
  onComparisonComplete,
}) => {
  const [editedUrls, setEditedUrls] = useState<Record<string, string>>({});
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`ai-generated-concepts ${className}`}
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

      {concepts.length > 1 && <ThumbnailConceptComparison
        concepts={concepts.map(concept => ({ id: concept.id, imageUrl: editedUrls[concept.id] || concept.thumbnailUrl, name: concept.conceptName }))}
        context={{ ...auditContext, niche: detectedNiche || auditContext?.niche }} onComplete={onComparisonComplete} />}

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {concepts.map((concept, index) => (
          <ConceptCard key={concept.id} concept={concept} index={index} outputFormat={outputFormat} onImageChange={(id, imageUrl) => setEditedUrls(previous => ({ ...previous, [id]: imageUrl }))} />
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

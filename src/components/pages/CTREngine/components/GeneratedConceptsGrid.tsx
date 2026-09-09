import { SaveThumbnailStyle } from '../../../common/ThumbnailPackaging';
import { thumbnailMediaUrl } from '../../../../utils/thumbnailMediaUrl';
import { ThumbnailConceptComparison } from '../../../common/ThumbnailConceptComparison';
import { AuditContext } from '../../../../types/ctr';
import { PreciseThumbnailEditor } from '../../../common/PreciseThumbnailEditor';
// src/components/pages/CTREngine/components/GeneratedConceptsGrid.tsx
// Premium grid display for generated thumbnail concepts

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Sparkles, Clock } from 'lucide-react';
import { GeneratedConcept } from '../../../../types/ctr';
import type { ThumbnailOutputFormat } from '../../../../types/thumbnail';
import { thumbnailApi } from '../../../../api/thumbnail';
import { ViralSharePopup } from './ViralSharePopup';
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
  editCreditCost?: number;
  hasLogo?: boolean;
  onEditingChange?: (busy: boolean) => void;
  onRefiningChange?: (active: boolean) => void;
  choosing?: boolean;
}

interface ConceptCardProps {
  concept: GeneratedConcept;
  index: number;
  active: boolean;
  onSelect: () => void;
  editCreditCost?: number;
  hasLogo?: boolean;
  onBusyChange: (busy: boolean) => void;
  onEdited?: () => void | Promise<void>;
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

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, index, outputFormat, onImageChange, active, onSelect, editCreditCost, hasLogo, onEdited, onBusyChange }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState(concept.thumbnailUrl);
  const [editRoot] = useState(concept.thumbnailUrl);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState(concept.shareUrl);
  const [currentId, setCurrentId] = useState<string | number>(concept.id);
  const [createdAt] = useState(() => new Date().toISOString());
  const [downloadError, setDownloadError] = useState('');
  const imageAspectClass = outputFormat === 'short' ? 'aspect-[9/16]' : 'aspect-video';

  const handleDownload = async () => {
    setIsDownloading(true); setDownloadError('');
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
      setDownloadError('Could not download this image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      className={`ai-concept-card group bg-[#111113] rounded-2xl overflow-hidden border border-white/[0.09] ${active ? "thumbnail-refine-card" : ""}`}
    >
      {/* Thumbnail Image */}
      <div className={`relative ${imageAspectClass} bg-black/40 overflow-hidden ${active ? "thumbnail-refine-image" : ""}`}>
        <img
          src={thumbnailMediaUrl(currentThumbnailUrl)}
          alt={concept.conceptName}
          className="w-full h-full object-contain"
        />
        

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
        {downloadError && <p role="alert" className="mb-2 text-sm text-red-300">{downloadError}</p>}
        {!active && <button type="button" onClick={onSelect} className="mb-3 w-full rounded-xl bg-[#fa7517] px-4 py-3 text-sm font-semibold text-white hover:bg-orange-500">Refine this</button>}
        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>
          
          <button type="button" onClick={() => setShareOpen(true)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white">Share</button>
        </div>

        <SaveThumbnailStyle key={`style:${currentThumbnailUrl}`} imageUrl={currentThumbnailUrl} hasLogo={hasLogo} />

        <div hidden={!active}><PreciseThumbnailEditor editCreditCost={editCreditCost} key={editRoot} initial={{ imageUrl: editRoot, id: concept.id, editing: concept.editing }}
          onRefine={async (version, instruction) => {
            onBusyChange(true);
            try {
              const result = await thumbnailApi.refineThumbnailConversationally({ instruction, thumbnailId: version.editing ? version.id : undefined, imageUrl: version.editing ? undefined : version.imageUrl, size: outputFormat, quality: 'high' });
              void Promise.resolve(onEdited?.()).catch(() => undefined);
              return { id: result.data.id, imageUrl: result.data.thumbnailUrl, shareUrl: result.data.shareUrl, conversation: result.data.conversation };
            } finally { onBusyChange(false); }
          }}
          onChange={version => { setCurrentThumbnailUrl(version.imageUrl); setShareUrl(version.shareUrl); setCurrentId(version.id ?? concept.id); onImageChange(concept.id, version.imageUrl); }} /></div>
        <ViralSharePopup thumbnail={{ id: currentId, createdAt, imageUrl: currentThumbnailUrl, thumbnailUrl: currentThumbnailUrl, prompt: concept.prompt, shareUrl }} isOpen={shareOpen} onClose={() => setShareOpen(false)} />

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
  onComparisonComplete, editCreditCost, hasLogo, onRefiningChange, onEditingChange, choosing,
}) => {
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => { if (choosing) setActiveId(null); }, [choosing]);
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
          <h2 tabIndex={-1} className="text-2xl font-bold text-white mb-2">{activeId ? 'Make it yours' : 'Which direction works best?'}</h2>
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
          disabled={editing}
          onClick={() => { if (activeId) { setActiveId(null); onRefiningChange?.(false); } else onClear(); }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          {activeId ? 'Back to concepts' : 'Edit brief'}
        </motion.button>
      </div>

      {/* Grid */}
      <div className={`grid gap-5 ${activeId ? "grid-cols-1" : "md:grid-cols-2"}`}>
        {concepts.map((concept, index) => (
          <div key={concept.id} hidden={Boolean(activeId && activeId !== concept.id)}><ConceptCard onBusyChange={busy => { setEditing(busy); onEditingChange?.(busy); }} active={activeId === concept.id} onSelect={() => { setActiveId(concept.id); onRefiningChange?.(true); }} editCreditCost={editCreditCost} hasLogo={hasLogo} onEdited={onComparisonComplete} concept={concept} index={index} outputFormat={outputFormat} onImageChange={(id, imageUrl) => setEditedUrls(previous => ({ ...previous, [id]: imageUrl }))} /></div>
        ))}
      </div>

      <div hidden={Boolean(activeId)} className="mt-8">
        <details className="thumbnail-disclosure"><summary>Help me choose <span className="text-zinc-500">Optional audience assessment</span></summary>
      {concepts.length > 1 && <ThumbnailConceptComparison
        concepts={concepts.map(concept => ({ id: concept.id, imageUrl: editedUrls[concept.id] || concept.thumbnailUrl, name: concept.conceptName }))}
        context={{ ...auditContext, niche: detectedNiche || auditContext?.niche }} onComplete={onComparisonComplete} />}

        </details>
      </div>
    </motion.div>
  );
};

export default GeneratedConceptsGrid;

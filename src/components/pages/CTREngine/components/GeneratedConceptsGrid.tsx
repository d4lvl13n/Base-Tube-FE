import { SaveThumbnailStyle } from '../../../common/ThumbnailPackaging';
import { studioDownloadErrorMessage, studioExportChoiceLabel, studioSuggestedExport } from '../../../../api/studioErrors';
import type { StudioExportChoice } from '../../../../api/studioErrors';
import { thumbnailMediaUrl } from '../../../../utils/thumbnailMediaUrl';
import { ThumbnailConceptComparison } from '../../../common/ThumbnailConceptComparison';
import { AuditContext, CTRUsageAccess } from '../../../../types/ctr';
// src/components/pages/CTREngine/components/GeneratedConceptsGrid.tsx
// Premium grid display for generated thumbnail concepts

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Sparkles, Clock, Check, Wand2 } from 'lucide-react';
import { GeneratedConcept } from '../../../../types/ctr';
import type { ThumbnailOutputFormat } from '../../../../types/thumbnail';
import { ViralSharePopup } from './ViralSharePopup';
import { NicheBadge } from './NicheSelector';

/**
 * A Studio project's saved versions (step 2, Choose): compact cards with
 * "Refine" (opens step 3 on that version), a free download and "Keep". The
 * edits themselves live on the Refine step (StudioRefineView).
 */
export interface ControlledConceptsGrid {
  selectedId?: string | null;
  /** Opens this version in the Refine step. */
  onRefine: (concept: GeneratedConcept) => void;
  onSelect: (concept: GeneratedConcept) => void;
  /** `choice`: the export the server suggested after EXPORT_TOO_LARGE, instead of the page's settings. */
  onDownload: (concept: GeneratedConcept, choice?: StudioExportChoice) => void | Promise<void>;
  renderVersionInfo?: (concept: GeneratedConcept) => React.ReactNode;
  renderActions?: (concept: GeneratedConcept) => React.ReactNode;
  comparison?: React.ReactNode;
  getOutputFormat?: (concept: GeneratedConcept) => ThumbnailOutputFormat;
}
/**
 * Without `controlled`, cards offer download, share, style saving
 * and an optional comparison only: AI edits in the AI Thumbnails area go through a
 * Studio project (spec §17.4), never the Creator Hub quota refine.
 */
interface GeneratedConceptsGridProps {
  controlled?: ControlledConceptsGrid;
  usageAccess?: CTRUsageAccess | null;
  concepts: GeneratedConcept[];
  detectedNiche: string | null;
  generationTime: number | null;
  outputFormat?: ThumbnailOutputFormat;
  onClear: () => void;
  className?: string;
  auditContext?: AuditContext;
  onComparisonComplete?: () => void | Promise<void>;
  hasLogo?: boolean;
}

interface ConceptCardProps {
  controlled?: ControlledConceptsGrid;
  concept: GeneratedConcept;
  index: number;
  hasLogo?: boolean;
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

const compactButton = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60';

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, index, outputFormat, hasLogo, controlled }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [createdAt] = useState(() => new Date().toISOString());
  const [downloadError, setDownloadError] = useState('');
  // EXPORT_TOO_LARGE names a format and size that fit: offered as one click.
  const [suggestedExport, setSuggestedExport] = useState<StudioExportChoice | null>(null);
  const imageUrl = concept.thumbnailUrl;
  const imageAspectClass = outputFormat === 'short' ? 'aspect-[9/16]' : 'aspect-video';

  const handleDownload = async (choice?: StudioExportChoice) => {
    setIsDownloading(true); setDownloadError(''); setSuggestedExport(null);
    try {
      if (controlled) { await (choice ? controlled.onDownload(concept, choice) : controlled.onDownload(concept)); return; }
      const response = await fetch(thumbnailMediaUrl(imageUrl));
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
      setDownloadError(controlled ? studioDownloadErrorMessage(error) : 'Could not download this image. Please try again.');
      if (controlled) setSuggestedExport(studioSuggestedExport(error));
    } finally {
      setIsDownloading(false);
    }
  };

  const image = (
    <div className={`relative ${imageAspectClass} bg-black/40 overflow-hidden`}>
      {controlled && !imageUrl ? <p className="p-5 text-sm text-gray-400">Preview unavailable. You can still choose or download this saved version.</p> : <img
        src={thumbnailMediaUrl(imageUrl)}
        alt={concept.conceptName}
        className="w-full h-full object-contain"
      />}
    </div>
  );
  const downloadProblems = <>
    {downloadError && <p role="alert" className="text-sm text-red-300">{downloadError}</p>}
    {suggestedExport && <button type="button" disabled={isDownloading} onClick={() => void handleDownload(suggestedExport)} className="w-full rounded-xl border border-orange-500/40 px-4 py-2.5 text-sm text-white hover:bg-orange-500/10">Download as {studioExportChoiceLabel(suggestedExport)} instead</button>}
  </>;

  if (controlled) {
    const selected = controlled.selectedId === concept.id;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`ai-concept-card flex h-full flex-col overflow-hidden rounded-2xl border bg-[#111113] ${selected ? 'border-orange-500/40' : 'border-white/[0.09]'}`}
      >
        {image}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">{concept.conceptName}</h3>
            {concept.prompt && <p className="truncate text-xs text-zinc-500" title={concept.prompt}>{concept.prompt}</p>}
          </div>
          {controlled.renderVersionInfo?.(concept)}
          {concept.adjustmentError && <p role="alert" className="text-xs text-amber-300">{concept.adjustmentError}</p>}
          {downloadProblems}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <button type="button" onClick={() => controlled.onRefine(concept)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#fa7517] px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-500">
              <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />Refine
            </button>
            <button type="button" onClick={() => void handleDownload()} disabled={isDownloading} className={compactButton}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />Download
            </button>
            <button
              type="button"
              aria-label={selected ? 'Selected version' : 'Keep this version'}
              disabled={selected}
              onClick={() => controlled.onSelect(concept)}
              className={`${compactButton} ${selected ? 'border-emerald-500/30 text-emerald-300' : ''}`}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />{selected ? 'Selected' : 'Keep'}
            </button>
          </div>
          {controlled.renderActions?.(concept)}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      className="ai-concept-card group bg-[#111113] rounded-2xl overflow-hidden border border-white/[0.09]"
    >
      {image}

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
        <div className="mb-2 space-y-2">{downloadProblems}</div>
        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void handleDownload()}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>

          <button type="button" onClick={() => setShareOpen(true)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white">Share</button>
        </div>

        <SaveThumbnailStyle key={`style:${imageUrl}`} imageUrl={imageUrl} hasLogo={hasLogo} />
        <ViralSharePopup thumbnail={{ id: concept.id, createdAt, imageUrl, thumbnailUrl: imageUrl, prompt: concept.prompt, shareUrl: concept.shareUrl }} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
      </div>
    </motion.div>
  );
};

export const GeneratedConceptsGrid: React.FC<GeneratedConceptsGridProps> = ({
  concepts,
  usageAccess,
  detectedNiche,
  generationTime,
  outputFormat = 'landscape',
  onClear,
  className = '',
  auditContext,
  onComparisonComplete, hasLogo, controlled,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`ai-generated-concepts ${className}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between gap-3 ${controlled ? 'mb-4' : 'mb-8'}`}>
        <div>
          <h2 tabIndex={-1} className={`${controlled ? 'text-xl' : 'text-2xl mb-2'} font-bold text-white`}>Which direction works best?</h2>
          {(detectedNiche || generationTime) && <div className="flex items-center gap-4 flex-wrap">
            {detectedNiche && <NicheBadge niche={detectedNiche} />}
            {generationTime && (
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Generated in {(generationTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClear}
          className="flex shrink-0 items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Edit brief
        </motion.button>
      </div>

      {/* Studio grid: large cards, two or three per row as the page allows, one on phones */}
      <div className={`grid gap-5 ${controlled ? 'grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),1fr))]' : 'md:grid-cols-2'}`}>
        {concepts.map((concept, index) => (
          <ConceptCard key={concept.id} controlled={controlled} hasLogo={hasLogo} concept={concept} index={index} outputFormat={controlled?.getOutputFormat?.(concept) || outputFormat} />
        ))}
      </div>

      {controlled ? controlled.comparison && <div className="mt-8">{controlled.comparison}</div> : concepts.length > 1 && <div className="mt-8">
        <details className="thumbnail-disclosure"><summary>Help me choose <span className="text-zinc-500">Optional audience assessment</span></summary>
      <ThumbnailConceptComparison usageAccess={usageAccess}
        concepts={concepts.map(concept => ({ id: concept.id, imageUrl: concept.thumbnailUrl, name: concept.conceptName }))}
        context={{ ...auditContext, niche: detectedNiche || auditContext?.niche }} onComplete={onComparisonComplete} />

        </details>
      </div>}
    </motion.div>
  );
};

export default GeneratedConceptsGrid;

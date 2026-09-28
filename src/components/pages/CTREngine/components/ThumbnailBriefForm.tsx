import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ThumbnailOutputFormat } from '../../../../types/thumbnail';
import { ThumbnailFormatSelector } from './ThumbnailFormatSelector';

export const thumbnailBriefField = 'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40';
export interface ThumbnailBriefValues {
  videoTitle: string; creatorHook: string; description: string; direction: string; headline: string; format: ThumbnailOutputFormat;
}
/**
 * The original creation form, shared by the visitor create page and saved
 * projects. On wide screens the fields sit on the left and `aside` (sources,
 * channel preferences) with "Your look" on the right.
 */
export function ThumbnailBriefForm({ value, onChange, disabled = false, onBlur, onDiscard, options, extras, look, aside, headlineControl, limits = {}, optionsSummary }: {
  value: ThumbnailBriefValues;
  onChange: (patch: Partial<ThumbnailBriefValues>) => void;
  disabled?: boolean;
  onBlur?: () => void;
  onDiscard?: () => void;
  options?: React.ReactNode;
  extras?: React.ReactNode;
  look?: React.ReactNode;
  /** Shown in the right column above "Your look". */
  aside?: React.ReactNode;
  headlineControl?: React.ReactNode;
  limits?: { title?: number; description?: number; direction?: number; headline?: number };
  optionsSummary?: string;
}) {
  const [lookOpen, setLookOpen] = useState(() => window.matchMedia?.('(min-width: 1024px)')?.matches ?? false);
  return <div className="thumbnail-brief-grid" onBlur={onBlur}>
    <fieldset disabled={disabled} className="min-w-0 space-y-6 border-0 p-0">
      <div><h1 tabIndex={-1} className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">What’s your video about?</h1><p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">Start with the idea. We’ll turn it into distinct visual directions for you to choose from.</p></div>
      <label className="block text-sm font-medium text-zinc-200">Video title or idea <span className="text-orange-400">*</span>
        <textarea required aria-label="Video title or idea" value={value.videoTitle} onChange={e => onChange({ videoTitle: e.target.value })} maxLength={limits.title || 150} rows={2} placeholder="e.g. Why AI might change the future of work" className={`${thumbnailBriefField} text-base`} />
      </label>
      <label className="block text-sm font-medium text-zinc-200">What’s the most interesting thing viewers will discover?
        <textarea aria-label="Creator hook" value={value.creatorHook} onChange={e => onChange({ creatorHook: e.target.value })} maxLength={1000} rows={2} placeholder="The surprising result, feeling or takeaway. Optional, but helpful." className={thumbnailBriefField} />
      </label>
      <details className="thumbnail-disclosure"><summary>Add description <span className="text-zinc-500">Optional</span></summary><textarea aria-label="Video description" value={value.description} onChange={e => onChange({ description: e.target.value })} maxLength={limits.description || 500} rows={3} placeholder="Add context that the title doesn't cover." className={thumbnailBriefField} /></details>
      <details className="thumbnail-disclosure"><summary>Have a visual in mind? <span className="text-zinc-500">Optional</span></summary><textarea aria-label="Visual direction" value={value.direction} onChange={e => onChange({ direction: e.target.value })} maxLength={limits.direction || 2000} rows={3} placeholder="e.g. A lone person facing a huge wall of glowing AI screens. Cinematic, restrained colors." className={thumbnailBriefField} />
        {headlineControl === undefined ? <label className="mt-4 block text-sm text-zinc-300">Exact thumbnail text<input aria-label="Initial headline" value={value.headline} onChange={e => onChange({ headline: e.target.value })} maxLength={limits.headline || 50} placeholder="Leave blank for a suggestion" className={thumbnailBriefField} /></label> : headlineControl}
      </details>
      {onDiscard && <button type="button" onClick={onDiscard} className="text-xs text-zinc-400 underline">Discard draft</button>}
      <details className="thumbnail-disclosure"><summary>More options <span className="text-zinc-500">{optionsSummary || (value.format === 'short' ? '9:16' : '16:9')}</span></summary>
        <div className="mt-4 space-y-5"><ThumbnailFormatSelector selectedFormat={value.format} onFormatChange={format => onChange({ format })} disabled={disabled} />{options}</div>
      </details>
      {extras}
    </fieldset>
    {(look || aside) && <div className="min-w-0 space-y-4">
      {aside}
      {look && <details className="thumbnail-look" open={lookOpen} onToggle={e => setLookOpen(e.currentTarget.open)}>
        <summary><span>Your look</span><span className="text-xs font-normal text-zinc-400">Optional <ChevronDown className="ml-1 inline h-4 w-4" /></span></summary>
        <fieldset disabled={disabled} className="thumbnail-look-content min-w-0 border-0">{look}</fieldset>
      </details>}
    </div>}
  </div>;
}

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ThumbnailOutputFormat } from '../../../../types/thumbnail';
import { ThumbnailFormatSelector } from './ThumbnailFormatSelector';
import { StudioTemplateButton, type StudioTemplate } from './studio/StudioTemplateDrawer';

/** After a template: the words on the thumbnail are still to write (see TemplateGuidedText). */
const TemplateTextGuide = createContext<{ exampleText: string; done: () => void } | null>(null);
/**
 * The page's "Text on the thumbnail" controls. After a template they stay empty and highlighted,
 * with a hint, until the creator writes words or picks another option: the example's words are
 * never put there.
 */
export function TemplateGuidedText({ filled, children }: {
  /** Words written, or another option than "Use my exact words" chosen: the guide ends. */
  filled: boolean;
  children: React.ReactNode;
}) {
  const guide = useContext(TemplateTextGuide);
  const done = guide?.done;
  useEffect(() => { if (filled) done?.(); }, [filled, done]);
  if (!guide || filled) return <>{children}</>;
  return <div data-template-guide-wrap="">
    {children}
    <span className="mt-1.5 block text-xs text-orange-300">
      Write the words for your thumbnail (1 to 4 words), or choose “Suggest a short headline”.{guide.exampleText ? ` The example said “${guide.exampleText}”: don’t reuse it.` : ''}
    </span>
  </div>;
}

export const thumbnailBriefField = 'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40';
export interface ThumbnailBriefValues {
  videoTitle: string; creatorHook: string; description: string; direction: string; headline: string; format: ThumbnailOutputFormat;
}
/**
 * The original creation form, shared by the visitor create page and saved
 * projects. On wide screens the fields sit on the left and `aside` (sources,
 * channel preferences) with "Your look" on the right.
 */
export function ThumbnailBriefForm({ value, onChange, disabled = false, onBlur, onDiscard, options, extras, look, aside, headlineControl, limits = {}, optionsSummary, onUseTemplate }: {
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
  /**
   * Shows "Start from a template" (the template library). The page fills its brief from the chosen
   * template: the visual direction and the exact words on the image.
   */
  onUseTemplate?: (template: StudioTemplate) => void;
}) {
  const [lookOpen, setLookOpen] = useState(() => window.matchMedia?.('(min-width: 1024px)')?.matches ?? false);
  const visual = useRef<HTMLDetailsElement>(null);
  const title = useRef<HTMLTextAreaElement>(null);
  // After a template: what the creator still has to make their own. Each field stays highlighted
  // with its hint until the creator edits it, so nobody generates the example's video by mistake.
  const [guide, setGuide] = useState<{ caption: string; title: boolean; direction: boolean; text: boolean; exampleText: string } | null>(null);
  const applyTemplate = (template: StudioTemplate) => {
    onUseTemplate?.(template);
    const needsTitle = !value.videoTitle.trim();
    setGuide({ caption: template.caption, title: needsTitle, direction: true, text: true, exampleText: template.headline });
    if (visual.current) visual.current.open = true;
    const first = needsTitle ? title.current : visual.current;
    first?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    if (needsTitle) title.current?.focus({ preventScroll: true });
  };
  const change = (patch: Partial<ThumbnailBriefValues>) => {
    if (guide && (patch.videoTitle !== undefined || patch.direction !== undefined)) {
      const next = { ...guide, title: guide.title && patch.videoTitle === undefined, direction: guide.direction && patch.direction === undefined };
      setGuide(next.title || next.direction || next.text ? next : null);
    }
    onChange(patch);
  };
  // Styled by aiStudio.css (the Studio's field styles override utility classes); inline where that sheet is absent.
  const textDone = useRef(() => setGuide(current => current && (current.title || current.direction) ? { ...current, text: false } : null)).current;
  const textGuide = React.useMemo(() => guide?.text ? { exampleText: guide.exampleText, done: textDone } : null, [guide?.text, guide?.exampleText, textDone]);
  const highlight = (on: boolean | undefined) => on ? { 'data-template-guide': '', style: { borderColor: '#fa7517', boxShadow: '0 0 0 3px rgba(250, 117, 23, 0.28)' } } : {};
  const hint = (text: string) => <span className="mt-1.5 block text-xs font-normal text-orange-300">{text}</span>;
  return <div className="thumbnail-brief-grid" onBlur={onBlur}>
    <fieldset disabled={disabled} className="min-w-0 space-y-6 border-0 p-0">
      <div><h1 tabIndex={-1} className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">What’s your video about?</h1><p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">Start with the idea. We’ll turn it into distinct visual directions for you to choose from.</p></div>
      <label className="block text-sm font-medium text-zinc-200">Video title or idea <span className="text-orange-400">*</span>
        <textarea ref={title} required aria-label="Video title or idea" value={value.videoTitle} onChange={e => change({ videoTitle: e.target.value })} maxLength={limits.title || 150} rows={2} placeholder="e.g. Why AI might change the future of work" className={`${thumbnailBriefField} text-base`} {...highlight(guide?.title)} />
        {guide?.title && hint('Write your video’s title. The template only gives the look.')}
      </label>
      <label className="block text-sm font-medium text-zinc-200">What’s the most interesting thing viewers will discover?
        <textarea aria-label="Creator hook" value={value.creatorHook} onChange={e => change({ creatorHook: e.target.value })} maxLength={1000} rows={2} placeholder="The surprising result, feeling or takeaway. Optional, but helpful." className={thumbnailBriefField} />
      </label>
      {onUseTemplate && <div className="space-y-2">
        <StudioTemplateButton onUse={applyTemplate} disabled={disabled} />
        {guide && <p role="status" className="text-xs text-emerald-300">Look copied from “{guide.caption}”. Fill in the highlighted fields for your video.</p>}
      </div>}
      <details className="thumbnail-disclosure"><summary>Add description <span className="text-zinc-500">Optional</span></summary><textarea aria-label="Video description" value={value.description} onChange={e => change({ description: e.target.value })} maxLength={limits.description || 500} rows={3} placeholder="Add context that the title doesn't cover." className={thumbnailBriefField} /></details>
      <details ref={visual} className="thumbnail-disclosure"><summary>Have a visual in mind? <span className="text-zinc-500">Optional</span></summary><textarea aria-label="Visual direction" value={value.direction} onChange={e => change({ direction: e.target.value })} maxLength={limits.direction || 2000} rows={guide?.direction ? 5 : 3} placeholder="e.g. A lone person facing a huge wall of glowing AI screens. Cinematic, restrained colors." className={thumbnailBriefField} {...highlight(guide?.direction)} />
        {guide?.direction && hint('This describes the example’s video. Replace the subject, the people and the scene with yours; keep the layout and colours you like.')}
        <TemplateTextGuide.Provider value={textGuide}>
        {headlineControl === undefined ? <label className="mt-4 block text-sm text-zinc-300">Exact thumbnail text<input aria-label="Initial headline" value={value.headline} onChange={e => change({ headline: e.target.value })} maxLength={limits.headline || 50} placeholder="Leave blank for a suggestion" className={thumbnailBriefField} /></label> : headlineControl}
        </TemplateTextGuide.Provider>
      </details>
      {onDiscard && <button type="button" onClick={onDiscard} className="text-xs text-zinc-400 underline">Discard draft</button>}
      <details className="thumbnail-disclosure"><summary>More options <span className="text-zinc-500">{optionsSummary || (value.format === 'short' ? '9:16' : '16:9')}</span></summary>
        <div className="mt-4 space-y-5"><ThumbnailFormatSelector selectedFormat={value.format} onFormatChange={format => change({ format })} disabled={disabled} />{options}</div>
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

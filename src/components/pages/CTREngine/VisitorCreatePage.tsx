import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import { ThumbnailBriefForm } from './components/ThumbnailBriefForm';
import { StudioLayoutPicker } from './components/studio/BriefReview';
import { studioField } from './components/studio/StudioControls';
import { StudioSelect } from './components/studio/StudioSelect';
import { useWelcomeOffer, visitorWelcomeLine } from '../../../hooks/useWelcomeOffer';
import { catalogTrial, useSubscriptionPlans } from '../../../hooks/useSubscription';
import type { CTRUsageAccess } from '../../../types/ctr';
import type { ThumbnailOutputFormat } from '../../../types/thumbnail';
import type { StudioBriefInputV1 } from '../../../types/thumbnailStudio';
import { clearStudioDraft, createStudioDraftId, loadStudioDraft, saveStudioDraft, SAVE_STUDIO_DRAFT_EVENT, StudioDraft } from '../../../utils/studioDraft';
import { openEmailGate } from '../../../utils/studioFunnel';

type TextMode = 'exact' | 'suggest' | 'none';

/**
 * `/ai-thumbnails/generate` for a visitor without an account (owner decision,
 * 28 September 2026: no anonymous image generation). The same brief form as the
 * signed-in create page, without the account-only pickers; its one button opens
 * the account gate (the AI Thumbnails sign-up in place). The brief is kept in
 * this tab (utils/studioDraft) and fills the signed-in create page after the
 * sign-up, where "Generate N concepts · X credits" starts nothing until clicked.
 */
export default function VisitorCreatePage({ usageAccess, isLoadingQuota }: {
  usageAccess: CTRUsageAccess | null;
  isLoadingQuota: boolean;
}) {
  const flow = useRef<HTMLDivElement>(null);
  const [barBounds, setBarBounds] = useState<{ left: number; width: number }>();
  useLayoutEffect(() => {
    const element = flow.current;
    if (!element) return;
    const measure = () => {
      const { left, width } = element.getBoundingClientRect();
      setBarBounds({ left, width });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const workspace = element.closest('.ai-studio-workspace');
    if (workspace) observer.observe(workspace);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  const [params] = useSearchParams();
  const offer = useWelcomeOffer();
  // Without the welcome gift, the line says what follows the sign-up: the free trial.
  const plans = useSubscriptionPlans(offer.credits === null);

  const [restored] = useState(() => loadStudioDraft(params.get('draft')));
  const draftId = useRef(restored?.id || createStudioDraftId());
  const [videoTitle, setVideoTitle] = useState(restored?.draft.videoTitle || params.get('prompt') || '');
  const [creatorHook, setCreatorHook] = useState(restored?.draft.creatorHook || '');
  const [description, setDescription] = useState(restored?.draft.description || '');
  const [direction, setDirection] = useState(restored?.draft.direction || '');
  const [headline, setHeadline] = useState(restored?.draft.headline || '');
  const [textMode, setTextMode] = useState<TextMode>(restored?.draft.textMode || (restored?.draft.headline ? 'exact' : 'suggest'));
  const [layout, setLayout] = useState<StudioBriefInputV1['layout']>(restored?.draft.layout || 'auto');
  const [format, setFormat] = useState<ThumbnailOutputFormat>(restored?.draft.format || 'landscape');
  const [count, setCount] = useState<number>(restored?.draft.count || 2);
  // A restored draft stays stored under its id until this page saves it again (an
  // edit, the gate, a sign-in link, pagehide): a sign-in without a reload finds it.
  const draftSnapshot = useRef<StudioDraft>();
  draftSnapshot.current = {
    videoTitle, creatorHook, description, direction, headline, format, quality: 'high', count,
    niche: null, includeFace: false, savedStyleHasLogo: false, localFiles: [], textMode, layout,
  };
  const persistDraft = useCallback(() => {
    const draft = draftSnapshot.current;
    if (draft && (draft.videoTitle || draft.creatorHook || draft.description || draft.direction || draft.headline || draft.format !== 'landscape' || draft.count !== 2 || draft.layout !== 'auto' || draft.textMode !== 'suggest')) saveStudioDraft(draftId.current, draft);
    else clearStudioDraft(draftId.current);
  }, []);
  const firstDraftRender = useRef(true);
  useEffect(() => {
    if (firstDraftRender.current) { firstDraftRender.current = false; return; }
    persistDraft();
  }, [videoTitle, creatorHook, description, direction, headline, format, count, layout, textMode, persistDraft]);
  useEffect(() => {
    const save = () => persistDraft();
    window.addEventListener(SAVE_STUDIO_DRAFT_EVENT, save);
    window.addEventListener('pagehide', save);
    return () => { window.removeEventListener(SAVE_STUDIO_DRAFT_EVENT, save); window.removeEventListener('pagehide', save); };
  }, [persistDraft]);
  const discardDraft = () => {
    clearStudioDraft(draftId.current); draftId.current = createStudioDraftId();
    setVideoTitle(''); setCreatorHook(''); setDescription(''); setDirection(''); setHeadline('');
    setTextMode('suggest'); setLayout('auto'); setFormat('landscape'); setCount(2);
  };
  // Generating needs an account: the brief is kept, the gate opens in place.
  const createAccount = (event?: React.FormEvent) => {
    event?.preventDefault();
    persistDraft();
    openEmailGate('generate');
  };

  return <AIThumbnailsLayout usageAccess={usageAccess} isLoadingQuota={isLoadingQuota}>
    <div ref={flow} className="thumbnail-flow studio-wide mx-auto w-full pb-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fa7517]">AI Thumbnail Studio</p><p className="mt-1 text-sm text-zinc-400">Your next video, made unmissable.</p></div>
        <nav aria-label="Thumbnail creation progress" className="flex items-center gap-4 text-sm"><span aria-current="step" className="text-orange-400">1. Brief</span><ArrowRight className="h-3 w-3 text-zinc-600" /><span className="text-zinc-500">2. Choose</span><ArrowRight className="h-3 w-3 text-zinc-600" /><span className="text-zinc-500">3. Refine</span></nav>
      </header>
      <form onSubmit={createAccount} aria-label="Thumbnail brief" noValidate>
        <ThumbnailBriefForm value={{ videoTitle, creatorHook, description, direction, headline, format }} onDiscard={discardDraft}
          onChange={patch => { if (patch.videoTitle !== undefined) setVideoTitle(patch.videoTitle); if (patch.creatorHook !== undefined) setCreatorHook(patch.creatorHook); if (patch.description !== undefined) setDescription(patch.description); if (patch.direction !== undefined) setDirection(patch.direction); if (patch.format !== undefined) setFormat(patch.format); }}
          limits={{ title: 500, description: 3000, direction: 3000, headline: 90 }}
          headlineControl={<div className="mt-4 space-y-3">
            <label className="block text-sm text-zinc-200">Text on the thumbnail<StudioSelect aria-label="Text on the thumbnail" className={studioField} value={textMode} onChange={event => setTextMode(event.target.value as TextMode)}><option value="suggest">Suggest a short headline</option><option value="exact">Use my exact words</option><option value="none">No added text</option></StudioSelect></label>
            {textMode === 'exact' && <label className="block text-sm text-zinc-200">Exact words<input aria-label="Initial headline" className={studioField} maxLength={90} value={headline} onChange={event => setHeadline(event.target.value)} /></label>}
          </div>}
          options={<>
            <StudioLayoutPicker value={layout} onChange={setLayout} />
            <p className="text-xs text-zinc-400">Logos, faces, styles and channel profiles come with your account.</p>
          </>}
        />
        <div className="thumbnail-generate-bar" style={barBounds}>
          <label className="flex items-center gap-2 text-sm text-zinc-300">Concepts<StudioSelect aria-label="Number of concepts" value={count} onChange={event => setCount(Number(event.target.value))} className="rounded-lg border border-white/10 px-3 py-2 text-white">{[1, 2, 3].map(number => <option key={number} value={number}>{number}</option>)}</StudioSelect></label>
          <button type="submit" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#fa7517] px-6 py-3 text-sm font-semibold text-white hover:bg-orange-500"><Sparkles className="h-4 w-4" />Create a free account to generate</button>
          <p className="basis-full text-xs text-zinc-400">{visitorWelcomeLine(offer, catalogTrial(plans.data))}</p>
        </div>
      </form>
    </div>
  </AIThumbnailsLayout>;
}

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronDown, Sparkles } from 'lucide-react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import useCTREngine from '../../../hooks/useCTREngine';
import { usePublicThumbnailGenerator } from '../../../hooks/usePublicThumbnailGenerator';
import { ThumbnailLogoPicker } from '../../common/ThumbnailLogoPicker';
import { ThumbnailSubjectPicker } from '../../common/ThumbnailSubjectPicker';
import { ThumbnailStylePicker } from '../../common/ThumbnailPackaging';
import { ThumbnailFormatSelector } from './components/ThumbnailFormatSelector';
import { NicheSelector } from './components/NicheSelector';
import { GeneratedConceptsGrid } from './components/GeneratedConceptsGrid';
import { ThumbnailDetailDrawer } from './components/ThumbnailDetailDrawer';
import { BuyCreditsModal } from './components/BuyCreditsModal';
import { thumbnailMediaUrl } from '../../../utils/thumbnailMediaUrl';
import type { AuditContext, GeneratedConcept } from '../../../types/ctr';
import type { ThumbnailOutputFormat } from '../../../types/thumbnail';

const emptyConcepts: GeneratedConcept[] = [];
const fieldClass = 'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40';

const GeneratePage: React.FC = () => {
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
  const location = useLocation();
  const ctr = useCTREngine();
  const creative = usePublicThumbnailGenerator();
  const navigation = location.state as { generatedConcepts?: GeneratedConcept[]; detectedNiche?: string; generationTime?: number; outputFormat?: ThumbnailOutputFormat } | null;
  const [videoTitle, setVideoTitle] = useState(params.get('prompt') || '');
  const [creatorHook, setCreatorHook] = useState('');
  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState('');
  const [headline, setHeadline] = useState('');
  const [savedStyleId, setSavedStyleId] = useState<number>();
  const [savedStyleHasLogo, setSavedStyleHasLogo] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoChecking, setLogoChecking] = useState(false);
  const [subjects, setSubjects] = useState<File[]>([]);
  const [format, setFormat] = useState<ThumbnailOutputFormat>(navigation?.outputFormat || 'landscape');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [count, setCount] = useState(2);
  const [niche, setNiche] = useState<string | null>(null);
  const [includeFace, setIncludeFace] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stage, setStage] = useState<'brief' | 'choose' | 'refine'>(navigation?.generatedConcepts?.length ? 'choose' : 'brief');
  useEffect(() => {
    const heading = flow.current?.querySelector<HTMLElement>(stage === 'brief' ? 'h1' : '.ai-generated-concepts h2');
    heading?.focus({ preventScroll: true });
    flow.current?.scrollIntoView?.({ block: 'start' });
  }, [stage]);
  const [buyCredits, setBuyCredits] = useState(false);
  const [publicSelection, setPublicSelection] = useState<any>(null);
  const [publicDrawerOpen, setPublicDrawerOpen] = useState(false);
  const [resultContext, setResultContext] = useState<AuditContext>({ title: videoTitle });
  const [resultFormat, setResultFormat] = useState<ThumbnailOutputFormat>(format);
  const [resultHasLogo, setResultHasLogo] = useState(false);
  const pendingBrief = useRef({ context: resultContext, format, hasLogo: false });
  const inFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [lookOpen, setLookOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const resultConcepts = ctr.generatedConcepts.length ? ctr.generatedConcepts : navigation?.generatedConcepts || emptyConcepts;
  const publicResults = creative.latestThumbnails?.length ? creative.latestThumbnails : creative.thumbnails;
  const resultKey = ctr.isAuthenticated ? resultConcepts.map(c => c.thumbnailUrl).join('|') : publicResults.map(c => c.imageUrl).join('|');
  useEffect(() => {
    if (!resultKey) return;
    setResultContext(pendingBrief.current.context);
    setResultFormat(pendingBrief.current.format);
    setResultHasLogo(pendingBrief.current.hasLogo);
    setStage('choose');
  }, [resultKey]);
  const busy = editing || submitting || creative.loading || ctr.generationProgress.status === 'generating';
  const access = ctr.usageAccess;
  const creditMode = ctr.isAuthenticated ? access?.mode === 'credits' : creative.usageMode === 'credits';
  const pricing = ctr.isAuthenticated ? access?.pricing : creative.pricing;
  const cost = pricing ? (ctr.isAuthenticated ? pricing.ctr.generatePerConcept : pricing.thumbnail.generatePerImage) * count : undefined;
  const available = ctr.isAuthenticated ? (access?.mode === 'credits' ? access.creditInfo.available : undefined) : creative.creditInfo?.available;
  const quotaRemaining = ctr.isAuthenticated ? (access?.mode === 'quota' ? access.quota.generate.remaining : undefined) : creative.quotaInfo?.remaining;
  const usageReady = (ctr.isAuthenticated ? Boolean(access) && !ctr.isLoadingQuota : Boolean(creative.usageMode)) && (!creditMode || cost !== undefined);
  const enough = creditMode ? cost !== undefined && available !== undefined && available >= cost : quotaRemaining !== 0;
  const canGenerate = usageReady && enough && videoTitle.trim().length > 0 && !busy && !logoChecking;
  const error = creative.error || ctr.error;
  const refreshAccess = async () => { await ctr.refreshQuota(); await creative.refreshQuota(); };

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !canGenerate) return;
    inFlight.current = true; setSubmitting(true);
    creative.clearError(); ctr.clearError();
    pendingBrief.current = { context: { title: videoTitle.trim(), description: [description, creatorHook].filter(Boolean).join('\n') }, format, hasLogo: Boolean(logo || savedStyleHasLogo) };
    try {
      if (ctr.isAuthenticated) {
        await ctr.generateThumbnails({
          title: videoTitle.trim(), description: description.trim() || undefined,
          creatorBrief: { title: videoTitle.trim(), description: [description, direction.trim() && `Visual direction (creative preferences, not additional video facts): ${direction.trim()}`].filter(Boolean).join('\n\n'), creatorHook },
          prompt: direction.trim() || undefined, textOverlay: headline.trim() || undefined,
          savedStyleId, subjectReferences: subjects, logo: logo || undefined,
          niche: niche || undefined, includeFace: includeFace && Boolean(ctr.faceReference?.hasFaceReference),
          concepts: count, quality, size: format,
        });
      } else {
        const prompt = [videoTitle.trim(), description && `Video context: ${description}`, creatorHook && `Viewer discovery: ${creatorHook}`, direction && `Visual direction: ${direction}`].filter(Boolean).join('\n');
        await creative.generateThumbnail(prompt, { size: format, quality, n: count, title: headline || undefined });
      }
    } finally { inFlight.current = false; setSubmitting(false); }
  };

  return <AIThumbnailsLayout usageAccess={access} isLoadingQuota={ctr.isLoadingQuota}>
    <div ref={flow} className="thumbnail-flow mx-auto w-full max-w-6xl pb-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fa7517]">AI Thumbnail Studio</p><p className="mt-1 text-sm text-zinc-400">Your next video, made unmissable.</p></div>
        <nav aria-label="Thumbnail creation progress" className="flex items-center gap-4 text-sm">
          <button type="button" disabled={busy} onClick={() => setStage('brief')} aria-current={stage === 'brief' ? 'step' : undefined} className={stage === 'brief' ? 'text-orange-400' : 'text-zinc-400'}>1. Brief</button><ArrowRight className="h-3 w-3 text-zinc-600" />
          <button type="button" disabled={!resultKey || busy} onClick={() => setStage('choose')} aria-current={stage === 'choose' ? 'step' : undefined} className={stage === 'choose' ? 'text-orange-400' : 'text-zinc-400 disabled:opacity-40'}>2. Choose</button><ArrowRight className="h-3 w-3 text-zinc-600" />
          <span aria-current={stage === 'refine' ? 'step' : undefined} className={stage === 'refine' ? 'text-orange-400' : 'text-zinc-500'}>3. Refine</span>
        </nav>
      </header>
      {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200"><AlertCircle className="h-5 w-5 shrink-0" /><div>{error}{(creative.insufficientCredits || ctr.errorCode === 'INSUFFICIENT_CREDITS') && <button type="button" className="ml-3 underline" onClick={() => setBuyCredits(true)}>Buy credits</button>}</div></div>}
      <form onSubmit={generate} hidden={stage !== 'brief'} aria-label="Thumbnail brief">
        <div className="thumbnail-brief-grid">
          <fieldset disabled={busy} className="min-w-0 space-y-6 border-0 p-0">
            <div><h1 tabIndex={-1} className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">What’s your video about?</h1><p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">Start with the idea. We’ll turn it into distinct visual directions for you to choose from.</p></div>
            <label className="block text-sm font-medium text-zinc-200">Video title or idea <span className="text-orange-400">*</span>
              <textarea required aria-label="Video title or idea" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} maxLength={150} rows={2} placeholder="e.g. Why AI might change the future of work" className={`${fieldClass} text-base`} />
            </label>
            <label className="block text-sm font-medium text-zinc-200">What’s the most interesting thing viewers will discover?
              <textarea aria-label="Creator hook" value={creatorHook} onChange={e => setCreatorHook(e.target.value)} maxLength={1000} rows={2} placeholder="The surprising result, feeling or takeaway. Optional, but helpful." className={fieldClass} />
            </label>
            <details className="thumbnail-disclosure"><summary>Add description <span className="text-zinc-500">Optional</span></summary><textarea aria-label="Video description" value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={3} placeholder="Add context that the title doesn't cover." className={fieldClass} /></details>
            <details className="thumbnail-disclosure"><summary>Have a visual in mind? <span className="text-zinc-500">Optional</span></summary><textarea aria-label="Visual direction" value={direction} onChange={e => setDirection(e.target.value)} maxLength={2000} rows={3} placeholder="e.g. A lone person facing a huge wall of glowing AI screens. Cinematic, restrained colors." className={fieldClass} /><label className="mt-4 block text-sm text-zinc-300">Exact thumbnail text<input aria-label="Initial headline" value={headline} onChange={e => setHeadline(e.target.value)} maxLength={50} placeholder="Leave blank for a suggestion" className={fieldClass} /></label></details>
            <details className="thumbnail-disclosure"><summary>More options <span className="text-zinc-500">{format === 'short' ? '9:16' : '16:9'} · {quality} quality</span></summary>
              <div className="mt-4 space-y-5"><ThumbnailFormatSelector selectedFormat={format} onFormatChange={setFormat} disabled={busy} />
                <label className="block text-sm text-zinc-300">Quality<select aria-label="Quality" value={quality} onChange={e => setQuality(e.target.value as typeof quality)} className={fieldClass}><option value="low">Draft</option><option value="medium">Standard</option><option value="high">High</option></select></label>
                {ctr.isAuthenticated && <><NicheSelector niches={ctr.niches} selectedNiche={niche} onSelect={setNiche} isLoading={ctr.isLoadingNiches || busy} variant="pills" />{ctr.faceReference?.hasFaceReference && <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={includeFace} onChange={e => setIncludeFace(e.target.checked)} />Include my saved face reference</label>}</>}
              </div>
            </details>
          </fieldset>
          {ctr.isAuthenticated && <details className="thumbnail-look" open={lookOpen} onToggle={e => setLookOpen(e.currentTarget.open)}>
            <summary><span>Your look</span><span className="text-xs font-normal text-zinc-400">Optional <ChevronDown className="ml-1 inline h-4 w-4" /></span></summary>
            <div className="thumbnail-look-content">
              <ThumbnailStylePicker visual value={savedStyleId} onChange={(id, hasLogo) => { setSavedStyleId(id); setSavedStyleHasLogo(Boolean(hasLogo)); }} disabled={busy} />
              <ThumbnailLogoPicker value={logo} onChange={setLogo} savedLogo={savedStyleHasLogo} onCheckingChange={setLogoChecking} disabled={busy} />
              <ThumbnailSubjectPicker multiple value={subjects} onChange={setSubjects} disabled={busy} />
              {(savedStyleId || logo || subjects.length > 0) && <p className="flex items-center gap-2 text-xs text-emerald-300"><Check className="h-4 w-4" />{savedStyleId ? 'Saved style' : 'Fresh style'}{logo || savedStyleHasLogo ? ' · Logo included' : ''}{subjects.length ? ` · ${subjects.length} subject photo${subjects.length > 1 ? 's' : ''}` : ''}</p>}
            </div>
          </details>}
        </div>
        <div className="thumbnail-generate-bar" style={barBounds}>
          <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm text-zinc-300">Concepts<select aria-label="Number of concepts" value={count} disabled={busy} onChange={e => setCount(Number(e.target.value))} className="rounded-lg border border-white/10 px-3 py-2 text-white">{[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}</select></label><span className="text-xs text-zinc-400">{creditMode && available !== undefined ? `${available} credits available` : usageReady ? 'Your generation allowance applies' : 'Checking allowance…'}</span></div>
          <button type="submit" disabled={!canGenerate} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#fa7517] px-6 py-3 text-sm font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-400"><Sparkles className="h-4 w-4" />{busy ? 'Creating your concepts…' : logoChecking ? 'Checking your logo…' : `Generate ${count} concept${count > 1 ? 's' : ''}${creditMode && cost !== undefined ? ` · ${cost} credits` : ''}`}</button>
          {usageReady && !enough && <p className="basis-full text-sm text-amber-300">{creditMode ? 'Not enough credits for this run.' : 'Your generation allowance is used up.'}{creditMode && <button type="button" onClick={() => setBuyCredits(true)} className="ml-2 underline">Buy credits</button>}</p>}
          {busy && <p role="status" className="basis-full text-sm text-zinc-300">Creating distinct directions from your brief. This can take a couple of minutes.</p>}
        </div>
      </form>
      <section hidden={stage === 'brief'} aria-label="Thumbnail concepts">
        {ctr.isAuthenticated ? <GeneratedConceptsGrid key={resultKey} concepts={resultConcepts} detectedNiche={ctr.detectedNiche || navigation?.detectedNiche || null} generationTime={ctr.generationTime || navigation?.generationTime || null} outputFormat={resultFormat} onClear={() => setStage('brief')} auditContext={resultContext} onComparisonComplete={refreshAccess} editCreditCost={creditMode ? pricing?.thumbnail.editPerImage : undefined} hasLogo={resultHasLogo} onEditingChange={setEditing} onRefiningChange={active => setStage(active ? 'refine' : 'choose')} choosing={stage === 'choose'} /> : <>
          <button type="button" onClick={() => setStage('brief')} className="mb-6 flex items-center gap-2 text-sm text-zinc-400"><ArrowLeft className="h-4 w-4" />Edit brief</button><h2 className="mb-6 text-2xl font-semibold text-white">Which direction works best?</h2>
          <div className="grid gap-5 sm:grid-cols-2">{publicResults.map((thumbnail, index) => <article key={thumbnail.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111113]"><img src={thumbnailMediaUrl(thumbnail.imageUrl)} alt={thumbnail.conceptName || `Concept ${index + 1}`} className="aspect-video w-full object-contain" /><div className="p-5"><h3 className="font-medium text-white">{thumbnail.conceptName || `Concept ${index + 1}`}</h3><button type="button" onClick={() => { setPublicSelection(thumbnail); setPublicDrawerOpen(true); }} className="mt-3 rounded-xl bg-[#fa7517] px-4 py-3 text-sm font-semibold text-white">Open & download</button></div></article>)}</div>
        </>}
      </section>
      <ThumbnailDetailDrawer thumbnail={publicSelection} isOpen={publicDrawerOpen} onClose={() => setPublicDrawerOpen(false)} />
      <BuyCreditsModal isOpen={buyCredits} onClose={() => setBuyCredits(false)} />
    </div>
  </AIThumbnailsLayout>;
};
export default GeneratePage;

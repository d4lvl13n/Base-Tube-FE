import { StudioSelect } from "./components/studio/StudioSelect";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AIThumbnailsLayout from "./AIThumbnailsLayout";
import type useCTREngine from "../../../hooks/useCTREngine";
import { useStudioAccount } from "../../../hooks/useStudioAccount";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateStudioProjectLists } from "../../../hooks/useStudioProject";
import { thumbnailStudioApi, studioError } from "../../../api/thumbnailStudio";
import { emptyStudioBrief, StudioProfile } from "../../../types/thumbnailStudio";
import { BriefReview } from "./components/studio/BriefReview";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  clearStudioCreateDraft,
  clearStudioDraft,
  isEmptyStudioCreateDraft,
  loadStudioCreateDraft,
  loadStudioDraft,
  saveStudioCreateDraft,
  StudioCreateDraft,
} from "../../../utils/studioDraft";
import { studioBriefFromDraft, StudioEntrySource, studioVideoId } from "../../../utils/studioEntry";
import { useStudioCapabilities, useStudioStartAvailability } from "../../../hooks/useStudioCapabilities";
import { studioItemCredits } from "../../../utils/studioPricing";
import { StudioCreditsScope, StudioPaidAction } from "./components/studio/StudioPaidAction";
import { StudioErrorText } from "./components/studio/StudioErrorDetail";
import type { StudioErrorInfo } from "../../../api/studioErrors";
import {
  studioButton,
  studioField,
  studioSecondary,
} from "./components/studio/StudioControls";

export default function StudioCreatePage({
  access,
}: {
  access: ReturnType<typeof useCTREngine>;
}) {
  const account = useStudioAccount();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  // The brief written before creating an account (VisitorCreatePage, or "Create a
  // new thumbnail for this video" on a visitor's audit) fills this form. It becomes
  // this account's create draft; nothing is saved as a project or started until
  // the creator clicks Generate.
  const [visitorDraft] = useState(() => loadStudioDraft(params.get("draft")));
  // The video of a review ("Create a new thumbnail for this video"), offered as the source to read.
  const reviewedVideo = studioVideoId(params.get("video"));
  const [kept] = useState<StudioCreateDraft | null>(() => visitorDraft
    ? { brief: studioBriefFromDraft(visitorDraft.draft), count: visitorDraft.draft.count, quality: visitorDraft.draft.quality === "high" ? "high" : "standard" }
    : loadStudioCreateDraft(account));
  const [brief, setBrief] = useState(() => kept?.brief || emptyStudioBrief());
  const [count, setCount] = useState(kept?.count || 2);
  const [quality, setQuality] = useState<"standard" | "high">(kept?.quality || "high");
  // An unsaved brief survives a reload in this tab until its project is created.
  useEffect(() => {
    const draft = { brief, count, quality };
    if (isEmptyStudioCreateDraft(draft)) clearStudioCreateDraft(account);
    else saveStudioCreateDraft(account, draft);
  }, [account, brief, count, quality]);
  useEffect(() => {
    if (visitorDraft) clearStudioDraft(visitorDraft.id);
  }, [visitorDraft]);
  const discardDraft = () => {
    clearStudioCreateDraft(account);
    setBrief(emptyStudioBrief());
    setCount(2);
    setQuality("high");
  };
  const [referencesBusy, setReferencesBusy] = useState(false);
  const [profiles, setProfiles] = useState<StudioProfile[]>([]);
  const [profileError, setProfileError] = useState<StudioErrorInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const creating = useRef(false);
  const flow = useRef<HTMLDivElement>(null);
  const [barBounds, setBarBounds] = useState<{ left: number; width: number }>();
  useLayoutEffect(() => {
    const element = flow.current; if (!element) return;
    const measure = () => { const { left, width } = element.getBoundingClientRect(); setBarBounds({ left, width }); };
    measure(); const observer = new ResizeObserver(measure); observer.observe(element);
    const workspace = element.closest('.ai-studio-workspace'); if (workspace) observer.observe(workspace);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    void thumbnailStudioApi.profiles().then(result => { if (active) setProfiles(result.items); })
      .catch(failure => { if (active) setProfileError(studioError(failure)); })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StudioErrorInfo | null>(null);
  const create = async (source: StudioEntrySource = "idea") => {
    if (creating.current || busy || referencesBusy || (source === "idea" && !brief.videoTitle.trim())) return;
    // Generate is refused before the click when it could not start (the button says why).
    if (source === "idea" && (generateBlocked || startAvailability.message)) return;
    creating.current = true; setBusy(true); setError(null);
    try {
      const project = await thumbnailStudioApi.createProject({ name: brief.videoTitle.trim().slice(0, 200) || "Untitled video", briefInput: brief });
      invalidateStudioProjectLists(client, account);
      clearStudioCreateDraft(account);
      // Generate: the project opens on step 2 and starts this generation at the price shown
      // (one click). A source opens its panel on the brief instead.
      navigate(`/ai-thumbnails/projects/${project.id}${source === "idea" ? "" : `?source=${source}${source === "youtube" && reviewedVideo ? `&video=${reviewedVideo}` : ""}`}`, {
        state: { studioEntry: { conceptCount: count, quality, startGeneration: source === "idea", ...(source === "idea" ? { generationCredits } : {}) } },
      });
    } catch (failure) { setError(studioError(failure)); }
    finally { creating.current = false; setBusy(false); }
  };
  // The price on the Generate button: the catalog from capabilities, else the balance read.
  const usage = access.usageAccess;
  const pricing = useStudioCapabilities().data?.pricing ?? (usage?.mode === "credits" ? usage.pricing : null);
  const unit = studioItemCredits(pricing, "generate");
  const generationCredits = unit === null ? null : unit * count;
  const startAvailability = useStudioStartAvailability();
  const available = usage?.mode === "credits" ? usage.creditInfo.available : undefined;
  const generateBlocked = generationCredits !== null && available !== undefined && available < generationCredits;
  const selectedProfile = profiles.find(profile => profile.id === brief.profile?.id) || null;
  const blocked = busy || referencesBusy || !brief.videoTitle.trim();
  return <AIThumbnailsLayout usageAccess={access.usageAccess} isLoadingQuota={access.isLoadingQuota}>
    <div ref={flow} className="thumbnail-flow studio-wide mx-auto w-full pb-8 text-white">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fa7517]">AI Thumbnail Studio</p><p className="mt-1 text-sm text-zinc-400">Your next video, made unmissable.</p></div>
        <nav aria-label="Thumbnail creation progress" className="flex items-center gap-4 text-sm"><span aria-current="step" className="text-orange-400">1. Brief</span><ArrowRight className="h-3 w-3 text-zinc-600" /><span className="text-zinc-500">2. Choose</span><ArrowRight className="h-3 w-3 text-zinc-600" /><span className="text-zinc-500">3. Refine</span></nav>
      </header>
      <form aria-label="Thumbnail brief" onSubmit={event => { event.preventDefault(); void create(); }}>
        <BriefReview value={brief} profile={selectedProfile} onChange={setBrief} onBlur={() => undefined} disabled={busy} onBusyChange={setReferencesBusy} onDiscard={discardDraft}
          options={<><label className="block text-sm text-zinc-300">Quality<StudioSelect aria-label="Quality" className={studioField} value={quality} onChange={event => setQuality(event.target.value as typeof quality)}><option value="standard">Standard</option><option value="high">High</option></StudioSelect></label>
            <label className="block text-sm text-zinc-300">Channel profile<StudioSelect aria-label="Channel profile" className={studioField} value={brief.profile?.id || ""} disabled={profileLoading} onChange={event => { const profile = profiles.find(item => item.id === event.target.value); setBrief(current => ({ ...current, profile: profile ? { id: profile.id, version: profile.version } : null })); }}><option value="">No channel profile</option>{profiles.map(profile => <option key={profile.id} value={profile.id} disabled={profile.readOnly}>{profile.name}{profile.isDefault ? " (default)" : ""}{profile.readOnly ? " (read-only)" : ""}</option>)}</StudioSelect><span className="text-xs text-zinc-400">Reuse this profile’s language, rules and references. Changes for this video stay in this video.</span></label>
            {profileError && <p role="alert" className="text-sm text-amber-200">Profiles could not be loaded: <StudioErrorText error={profileError} /></p>}
          </>}
          aside={<details className="thumbnail-disclosure" open={Boolean(reviewedVideo)}><summary>Add a video, script or existing image <span className="text-zinc-500">Optional</span></summary>{reviewedVideo && <p className="mt-3 text-sm text-zinc-300">The video you reviewed is ready: “Use the reviewed video” reads its public information and current thumbnail. You review the proposal before it changes your brief.</p>}<div className="mt-3 flex flex-wrap gap-2">{([{ source: "youtube", label: reviewedVideo ? "Use the reviewed video" : "Add a YouTube link" }, { source: "script", label: "Add a script" }, { source: "image", label: "Use an existing image" }] as const).map(option => <button key={option.source} type="button" className={studioSecondary} disabled={busy || referencesBusy} onClick={() => void create(option.source)}>{option.label}</button>)}</div></details>}
        />
        {error && <p role="alert" className="mt-5 text-sm text-red-300"><StudioErrorText error={error} /> Your instructions are still here.</p>}
        <div className="thumbnail-generate-bar" style={barBounds}>
         <StudioCreditsScope availableCredits={available} noticeClassName="basis-full">
          <div className="flex items-center gap-2 text-sm text-zinc-300"><span>Concepts</span><div className="w-20"><StudioSelect aria-label="Number of concepts" value={count} disabled={busy} onChange={event => setCount(Number(event.target.value))}>{[1, 2, 3].map(number => <option key={number} value={number}>{number}</option>)}</StudioSelect></div></div>
          <StudioPaidAction
            type="submit"
            className="contents"
            buttonClassName={`${studioButton} inline-flex min-h-[48px] items-center gap-2 px-6 py-3`}
            icon={<Sparkles className="h-4 w-4" />}
            label={`Generate ${count} concept${count === 1 ? "" : "s"}`}
            credits={generationCredits}
            onRun={() => void create()}
            disabled={blocked}
            working={busy || referencesBusy}
            workingLabel={busy ? "Saving your brief…" : "Preparing your references…"}
            availableCredits={available}
            unavailable={startAvailability.message}
          />
          <p className="basis-full text-xs text-zinc-400">One click saves your brief as a project and starts the generation there.</p>
         </StudioCreditsScope>
        </div>
      </form>
      <Link to="/ai-thumbnails/projects" className={`${studioSecondary} mt-6 inline-block`}>Open saved projects</Link>
    </div>
  </AIThumbnailsLayout>;
}

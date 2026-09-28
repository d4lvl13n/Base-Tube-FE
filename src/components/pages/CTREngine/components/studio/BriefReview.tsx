import { StudioSelect } from "./StudioSelect";
import { useStudioAssets } from "../../../../../hooks/useStudioAssets";
import { studioLanguages } from "../../../../../utils/studioLabels";
import React, { useEffect, useRef, useState } from "react";
import type {
  StudioBriefInputV1,
  StudioRevision,
  StudioStyle,
  StudioProfile,
  StudioAsset,
} from "../../../../../types/thumbnailStudio";
import { AssetInput, studioField, studioSecondary } from "./StudioControls";
import { defaultStudioSettings } from "../../../../../types/thumbnailStudio";
import { thumbnailStudioApi, studioError } from "../../../../../api/thumbnailStudio";
import type { StudioErrorInfo } from "../../../../../api/studioErrors";
import { StudioErrorText } from "./StudioErrorDetail";
import { thumbnailMediaUrl } from "../../../../../utils/thumbnailMediaUrl";
import { ThumbnailBriefForm } from "../ThumbnailBriefForm";
import { ThumbnailStylePicker } from "../../../../common/ThumbnailPackaging";
import { ThumbnailLogoPicker } from "../../../../common/ThumbnailLogoPicker";
import { ThumbnailSubjectPicker } from "../../../../common/ThumbnailSubjectPicker";
import { Check, ImagePlus } from "lucide-react";
function ReferenceThumbnail({ url, alt }: { url?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
    {url && !failed ? <img src={thumbnailMediaUrl(url)} alt={alt} className="h-full w-full object-contain" onError={() => setFailed(true)} /> : <ImagePlus size={23} className="text-zinc-500" aria-hidden="true" />}
  </div>;
}
const layouts: Array<{
  id: StudioBriefInputV1["layout"];
  label: string;
  description: string;
}> = [
  {
    id: "auto",
    label: "Let AI suggest",
    description: "Explore different arrangements from your brief.",
  },
  {
    id: "comparison",
    label: "Compare two things",
    description: "Give both options room so viewers understand the choice.",
  },
  {
    id: "subject_closeup",
    label: "Subject close-up",
    description: "Make one face or subject easy to recognize.",
  },
  {
    id: "object_hero",
    label: "Product spotlight",
    description: "Put the object at the center of attention.",
  },
  {
    id: "before_after",
    label: "Before and after",
    description: "Show a change that your video actually demonstrates.",
  },
  {
    id: "scene",
    label: "Tell a story",
    description: "Use a scene to show what is happening.",
  },
  {
    id: "minimal",
    label: "Keep it simple",
    description: "A clear subject with room around it.",
  },
];
/** Composition choice, shared by saved projects and the visitor create page. */
export function StudioLayoutPicker({ value, onChange }: {
  value: StudioBriefInputV1["layout"];
  onChange: (layout: StudioBriefInputV1["layout"]) => void;
}) {
  return <div><p className="mb-2 text-sm text-zinc-200">Composition</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{layouts.map((layout, index) => <button type="button" key={layout.id} aria-pressed={value === layout.id} onClick={() => onChange(layout.id)} className={`rounded-xl border p-3 text-left ${value === layout.id ? "border-orange-500 bg-orange-500/10" : "border-white/10"}`}>
    <svg aria-hidden viewBox="0 0 100 48" className="mb-2 h-10 w-full rounded bg-white/5"><rect x={index === 1 || index === 4 ? 5 : 12} y="8" width={index === 1 || index === 4 ? 36 : 52} height="30" rx="6" fill="#fa7517" opacity=".65" />{[1, 4].includes(index) ? <rect x="56" y="8" width="36" height="30" rx="6" fill="#aaa" opacity=".7" /> : <path d={index === 6 ? "M76 20h12" : "M72 12h18 M72 21h18 M72 30h14"} stroke="#aaa" strokeWidth="3" />}</svg>
    <strong className="block text-xs text-white">{layout.label}</strong><span className="mt-1 block text-[11px] leading-relaxed text-zinc-400">{layout.description}</span>
  </button>)}</div></div>;
}
export function LanguageSelect({
  value,
  onChange,
  inherit,
}: {
  value: string;
  onChange: (value: string) => void;
  inherit?: string;
}) {
  return (
    <StudioSelect
      className={studioField}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {inherit && <option value="">Use profile ({inherit})</option>}
      {value && !studioLanguages.some(([code]) => code === value) && (
        <option value={value}>{value}</option>
      )}
      {studioLanguages.map(([code, name]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </StudioSelect>
  );
}
export function RuleListInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (rules: string[]) => void;
  placeholder?: string;
}) {
  const serialized = value.join("\n");
  const [text, setText] = useState(serialized);
  useEffect(() => setText(serialized), [serialized]);
  return (
    <textarea
      className={studioField}
      rows={3}
      value={text}
      placeholder={placeholder}
      onChange={(event) => setText(event.target.value)}
      onBlur={() =>
        onChange(
          text
            .split("\n")
            .map((line) => line.trim().slice(0, 200))
            .filter(Boolean)
            .slice(0, 10),
        )
      }
    />
  );
}
export function StyleFields({
  value,
  onChange,
}: {
  value: StudioStyle;
  onChange: (value: StudioStyle) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {(["primaryColor", "secondaryColor", "accentColor"] as const).map(
        (key, index) => (
          <label key={key} className="text-xs text-zinc-300">
            {["Primary colour", "Secondary colour", "Accent colour"][index]}
            <input
              className="ml-2 h-8 w-12"
              type="color"
              value={value[key]}
              onChange={(event) =>
                onChange({ ...value, [key]: event.target.value })
              }
            />
          </label>
        ),
      )}
      <label className="text-xs text-zinc-300">
        Font
        <StudioSelect
          className={studioField}
          value={value.font}
          onChange={(event) =>
            onChange({
              ...value,
              font: event.target.value as StudioStyle["font"],
            })
          }
        >
          {["DejaVu Sans", "DejaVu Serif", "DejaVu Sans Mono"].map((font) => (
            <option key={font}>{font}</option>
          ))}
        </StudioSelect>
      </label>
      <label className="text-xs text-zinc-300">
        Text position
        <StudioSelect
          className={studioField}
          value={value.textPosition}
          onChange={(event) =>
            onChange({
              ...value,
              textPosition: event.target.value as StudioStyle["textPosition"],
            })
          }
        >
          {["left", "right", "top", "bottom", "center"].map((position) => (
            <option key={position}>{position}</option>
          ))}
        </StudioSelect>
      </label>
      <label className="text-xs text-zinc-300">
        <input
          type="checkbox"
          checked={value.stroke}
          onChange={(event) =>
            onChange({ ...value, stroke: event.target.checked })
          }
        />{" "}
        Text outline
      </label>
    </div>
  );
}
export function BriefReview({ value, revision, profile, onChange, onBlur, disabled = false, options, extras, aside, onBusyChange, onDiscard }: {
  value: StudioBriefInputV1;
  revision?: StudioRevision;
  profile?: StudioProfile | null;
  onChange: (value: StudioBriefInputV1) => void;
  onBlur: () => void;
  disabled?: boolean;
  options?: React.ReactNode;
  extras?: React.ReactNode;
  /** Beside the form on wide screens, above "Your look" (sources, channel preferences). */
  aside?: React.ReactNode;
  onBusyChange?: (busy: boolean) => void;
  onDiscard?: () => void;
}) {
  const inherited = profile?.settings || revision?.profileSnapshot?.settings || defaultStudioSettings();
  const text = value.overrides.text || { mode: inherited.textMode, value: "" };
  const latest = useRef(value); latest.current = value;
  const [uploading, setUploading] = useState(false);
  const [checkingLogo, setCheckingLogo] = useState(false);
  const [styleUploading, setStyleUploading] = useState(false);
  const [faceUploading, setFaceUploading] = useState(false);
  const [pendingLogoName, setPendingLogoName] = useState("");
  const [pendingSubjectCount, setPendingSubjectCount] = useState(0);
  const [error, setError] = useState<StudioErrorInfo | null>(null);
  const [styleId, setStyleId] = useState<number>();
  const inheritedAsset = (key: "faceAssetId" | "logoAssetId" | "styleAssetId") => value.overrides[key] === undefined ? inherited[key] : value.overrides[key];
  const logoId = inheritedAsset("logoAssetId"); const styleAssetId = inheritedAsset("styleAssetId"); const faceId = inheritedAsset("faceAssetId");
  const wanted = Array.from(new Set([...value.subjectAssetIds, logoId, styleAssetId, faceId].filter((id): id is string => Boolean(id))));
  // Shared, refreshing asset reads: signed preview URLs are renewed before they expire.
  const { queries: assetReads, remember: rememberAsset } = useStudioAssets(wanted);
  const assets: Record<string, StudioAsset> = Object.fromEntries(assetReads.flatMap((read, index) => read.data ? [[wanted[index], read.data]] : []));
  const loadingAssets = assetReads.some(read => read.isPending);
  const previewError = assetReads.some(read => read.error) ? "One reference preview could not be loaded. Your other references are still available." : "";
  const busy = uploading || checkingLogo || loadingAssets || styleUploading || faceUploading;
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  const updateReference = (key: "logoAssetId" | "styleAssetId", id: string | null) => onChange({ ...latest.current, overrides: { ...latest.current.overrides, [key]: id } });
  const run = async (work: () => Promise<void>) => {
    if (uploading || disabled) return;
    setUploading(true); setError(null);
    try { await work(); } catch (failure) { setError(studioError(failure)); }
    finally { setUploading(false); }
  };
  const applyProfileReference = (key: "faceAssetId" | "logoAssetId" | "styleAssetId") => {
    const overrides = { ...value.overrides }; delete overrides[key]; onChange({ ...value, overrides });
  };
  const rule = (key: "faces" | "logos" | "prices", setting: string) => {
    const rules = { ...value.overrides.rules };
    if (setting === "inherit") delete rules[key]; else rules[key] = setting as "allow" | "forbid";
    onChange({ ...value, overrides: { ...value.overrides, rules } });
  };
  const resolvedStyle = { ...inherited.style, ...value.styleOverrides };
  const profileName = profile?.name || revision?.profileSnapshot?.name;
  const usingProfileStyle = Boolean(inherited.styleAssetId) && value.overrides.styleAssetId === undefined;
  return <ThumbnailBriefForm
    value={{ videoTitle: value.videoTitle, creatorHook: value.creatorHook, description: value.summary, direction: value.visualDirection, headline: text.value, format: value.outputFormat === "portrait" ? "short" : "landscape" }}
    onChange={patch => onChange({ ...value,
      ...(patch.videoTitle !== undefined ? { videoTitle: patch.videoTitle } : {}),
      ...(patch.creatorHook !== undefined ? { creatorHook: patch.creatorHook } : {}),
      ...(patch.description !== undefined ? { summary: patch.description } : {}),
      ...(patch.direction !== undefined ? { visualDirection: patch.direction } : {}),
      ...(patch.format !== undefined ? { outputFormat: patch.format === "short" ? "portrait" as const : "landscape" as const } : {}),
    })}
    disabled={disabled || uploading || styleUploading || faceUploading} onBlur={onBlur} onDiscard={onDiscard} limits={{ title: 500, description: 3000, direction: 3000, headline: 90 }}
    headlineControl={<div className="mt-4 space-y-3">
      <label className="block text-sm text-zinc-200">Text on the thumbnail<StudioSelect className={studioField} value={value.overrides.text?.mode || "inherit"} onChange={event => {
        const overrides = { ...value.overrides };
        if (event.target.value === "inherit") delete overrides.text;
        else overrides.text = { mode: event.target.value as "exact" | "suggest" | "none", value: event.target.value === "exact" ? text.value : "" };
        onChange({ ...value, overrides });
      }}><option value="inherit">Use profile / default ({inherited.textMode})</option><option value="suggest">Suggest a short headline</option><option value="exact">Use my exact words</option><option value="none">No added text</option></StudioSelect></label>
      {text.mode === "exact" && <label className="block text-sm text-zinc-200">Exact words<input aria-label="Initial headline" className={studioField} maxLength={90} value={text.value} onChange={event => onChange({ ...value, overrides: { ...value.overrides, text: { mode: "exact", value: event.target.value } } })} /></label>}
    </div>}
    options={<>
      {options}
      <label className="block text-sm text-zinc-200">Language<LanguageSelect value={value.overrides.language || ""} inherit={inherited.language} onChange={language => { const overrides = { ...value.overrides }; if (language) overrides.language = language; else delete overrides.language; onChange({ ...value, overrides }); }} /></label>
      <StudioLayoutPicker value={value.layout} onChange={layout => onChange({ ...value, layout })} />
      <details className="thumbnail-disclosure"><summary>Rules for this video</summary><div className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">{(["faces", "logos", "prices"] as const).map(key => <label key={key} className="text-sm capitalize text-zinc-200">{key}<StudioSelect className={studioField} value={value.overrides.rules?.[key] || "inherit"} onChange={event => rule(key, event.target.value)}><option value="inherit">Profile ({inherited.rules[key]})</option><option value="allow">Allow</option><option value="forbid">Do not include</option></StudioSelect></label>)}</div>
        <label className="block text-sm text-zinc-200">Other rules, one per line<RuleListInput value={value.overrides.rules?.additional || []} placeholder={inherited.rules.additional.join("\n")} onChange={additional => onChange({ ...value, overrides: { ...value.overrides, rules: { ...value.overrides.rules, additional } } })} /></label>
        <button type="button" className={studioSecondary} onClick={() => { const overrides = { ...value.overrides }; delete overrides.rules; onChange({ ...value, overrides }); }}>Use profile rules again</button>
      </div></details>
    </>}
    extras={extras}
    look={<>
      <ThumbnailStylePicker visual value={styleId} disabled={disabled || busy} copySavedLogo={false}
        selectedReference={styleAssetId && assets[styleAssetId] ? { url: assets[styleAssetId].url, name: assets[styleAssetId].originalName || "Saved style reference" } : undefined}
        onChange={id => { if (!id) { setStyleId(undefined); updateReference("styleAssetId", null); return; } void run(async () => { const asset = await thumbnailStudioApi.assetFromThumbnail(id); rememberAsset(asset); setStyleId(id); updateReference("styleAssetId", asset.id); }); }} />
      <details className="thumbnail-disclosure"><summary>Use another style image {value.overrides.styleAssetId && <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-300">Added</span>}</summary><AssetInput label="Style reference" purpose="style" onBusyChange={setStyleUploading} value={styleAssetId} disabled={disabled || busy} onChange={asset => { if (asset) rememberAsset(asset); setStyleId(undefined); updateReference("styleAssetId", asset?.id || null); }} /></details>
      {styleAssetId && <div role="status" className="flex items-center gap-3 rounded-xl border border-orange-500/25 bg-orange-500/[.055] p-2"><ReferenceThumbnail url={assets[styleAssetId]?.url} alt="Selected style reference" /><div className="min-w-0"><p className="flex items-center gap-1.5 text-xs font-medium text-orange-300"><Check size={14} aria-hidden="true" />Style image selected</p><p className="mt-1 truncate text-xs text-zinc-200">{assets[styleAssetId]?.originalName || (loadingAssets ? "Loading preview…" : "Saved style reference")}</p><p className="mt-1 text-[11px] text-zinc-400">{usingProfileStyle ? `From ${profileName || "channel profile"}` : "For this thumbnail"}</p></div></div>}
      {inherited.styleAssetId ? <button type="button" className={`${studioSecondary} inline-flex items-center justify-center border-white/15 bg-white/[.035] text-xs text-zinc-200 transition-colors hover:border-orange-500/40 hover:bg-orange-500/10 disabled:opacity-50`} disabled={disabled || busy || usingProfileStyle} onClick={() => { setStyleId(undefined); applyProfileReference("styleAssetId"); }}>{usingProfileStyle ? "Using profile style reference" : "Use profile style reference"}</button> : <p className="text-xs leading-5 text-zinc-400">{profileName ? `No style image is saved in ${profileName}. Add one above or save one in that profile.` : "No channel profile is selected. Choose one under More options, or add a style image above."}</p>}
      <ThumbnailLogoPicker value={null} savedLogo={Boolean(logoId)} savedAsset={logoId && assets[logoId] ? { url: thumbnailMediaUrl(assets[logoId].url), name: assets[logoId].originalName || "Logo for this thumbnail" } : undefined} previewLoading={logoId ? loadingAssets && !assets[logoId] : false} uploading={uploading && Boolean(pendingLogoName)} pendingName={pendingLogoName} disabled={disabled || uploading || loadingAssets} onCheckingChange={setCheckingLogo}
        onChange={file => { if (file) { setPendingLogoName(file.name); void run(async () => { try { const asset = await thumbnailStudioApi.upload(file, "logo"); rememberAsset(asset); updateReference("logoAssetId", asset.id); } finally { setPendingLogoName(""); } }); } }} onRemoveSaved={() => updateReference("logoAssetId", null)} />
      {inherited.logoAssetId && <button type="button" className={`${studioSecondary} inline-flex items-center justify-center border-white/15 bg-white/[.035] text-xs text-zinc-200 transition-colors hover:border-orange-500/40 hover:bg-orange-500/10 disabled:opacity-40`} disabled={disabled || busy || value.overrides.logoAssetId === undefined} onClick={() => applyProfileReference("logoAssetId")}>{value.overrides.logoAssetId === undefined ? "Using profile logo" : "Use profile logo"}</button>}
      <ThumbnailSubjectPicker multiple value={[]} disabled={disabled || busy} savedReferences={value.subjectAssetIds.map(id => ({ id, url: assets[id] ? thumbnailMediaUrl(assets[id].url) : "", name: assets[id]?.originalName || "Saved subject" }))} onRemoveSaved={id => onChange({ ...value, subjectAssetIds: value.subjectAssetIds.filter(existing => existing !== id) })}
        onChange={files => { if (files.length) { setPendingSubjectCount(files.length); void run(async () => { try { const uploaded: StudioAsset[] = []; for (const file of files) uploaded.push(await thumbnailStudioApi.upload(file, "subject")); uploaded.forEach(rememberAsset); onChange({ ...latest.current, subjectAssetIds: [...latest.current.subjectAssetIds, ...uploaded.map(asset => asset.id)].slice(0, 4) }); } finally { setPendingSubjectCount(0); } }); } }} />
      {uploading && pendingSubjectCount > 0 && <p role="status" className="text-xs text-orange-300">Uploading {pendingSubjectCount} subject {pendingSubjectCount === 1 ? "photo" : "photos"}…</p>}
      <details className="thumbnail-disclosure"><summary>Your face reference {faceId && <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-300">Added</span>}</summary><div className="mt-3 space-y-2"><AssetInput label="Your face" purpose="face" onBusyChange={setFaceUploading} value={faceId} disabled={disabled || busy} onChange={asset => { if (asset) rememberAsset(asset); onChange({ ...value, overrides: { ...value.overrides, faceAssetId: asset?.id || null } }); }} />{inherited.faceAssetId && <button type="button" className={`${studioSecondary} inline-flex items-center justify-center border-white/15 bg-white/[.035] text-xs text-zinc-200 transition-colors hover:border-orange-500/40 hover:bg-orange-500/10 disabled:opacity-40`} disabled={disabled || busy || value.overrides.faceAssetId === undefined} onClick={() => applyProfileReference("faceAssetId")}>{value.overrides.faceAssetId === undefined ? "Using profile face reference" : "Use profile face reference"}</button>}</div></details>
      <details className="thumbnail-disclosure"><summary>Colours and text style</summary><div className="mt-4 space-y-3"><StyleFields value={resolvedStyle} onChange={style => {
        const changed = Object.fromEntries(Object.entries(style).filter(([key, setting]) => resolvedStyle[key as keyof StudioStyle] !== setting));
        onChange({ ...value, styleOverrides: { ...value.styleOverrides, ...changed } });
      }} /><button type="button" className={studioSecondary} onClick={() => onChange({ ...value, styleOverrides: {} })}>Use profile style again</button></div></details>
      {busy && <p role="status" className="text-xs text-zinc-400">Preparing your references…</p>}
      {(error || previewError) && <p role="alert" className="text-sm text-red-300">{error ? <StudioErrorText error={error} /> : previewError}</p>}
    </>}
    aside={aside}
  />;
}

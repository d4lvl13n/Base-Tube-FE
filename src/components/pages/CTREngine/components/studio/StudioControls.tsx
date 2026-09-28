import { useStudioAccount } from "../../../../../hooks/useStudioAccount";
import React, { useEffect, useId, useState } from "react";
import { Check, ImagePlus, FileText, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  thumbnailStudioApi,
  studioError,
} from "../../../../../api/thumbnailStudio";
import type {
  StudioAsset,
  StudioAssetPurpose,
  StudioVersion,
  StudioAudit,
} from "../../../../../types/thumbnailStudio";
import { thumbnailMediaUrl } from "../../../../../utils/thumbnailMediaUrl";
import {
  STUDIO_VALIDATION_CHECK_CODES,
  type StudioValidationCheckCode,
} from "@basetube/api";
import { StudioValidationFeedbackControls } from "./StudioValidationFeedback";
import { StudioErrorText } from "./StudioErrorDetail";
import { studioAssetRefreshDelay } from "../../../../../hooks/useStudioAssets";
import { studioCreditsLabel } from "../../../../../utils/studioPricing";
export const studioField =
  "w-full rounded-xl border border-white/15 bg-[#18181b] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500";
export const studioButton =
  "rounded-xl bg-[#fa7517] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40";
export const studioSecondary =
  "rounded-xl border border-white/20 px-3 py-2 text-sm text-white disabled:opacity-40";
const SCRIPT_BYTES = 1024 * 1024;
/**
 * A script refused for its size. Over 1 MiB (checked here, and by the server while
 * the file streams); at or under it, the server's only other size refusal for a
 * script is its 100,000-character limit.
 */
export function studioScriptTooLargeMessage(fileBytes: number): string {
  return fileBytes > SCRIPT_BYTES
    ? "This script is over 1 MB. Paste an excerpt instead."
    : "This script is over 100,000 characters. Paste an excerpt instead.";
}
export function AssetInput({
  label,
  purpose,
  value,
  onChange,
  disabled = false,
  onBusyChange,
}: {
  label: string;
  purpose: StudioAssetPurpose;
  value?: string | null;
  onChange: (asset: StudioAsset | null) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string; status?: number } | null>(null);
  const [uploaded, setUploaded] = useState<{ id: string; url: string; name: string; local: boolean } | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  useEffect(() => () => {
    if (uploaded?.local) URL.revokeObjectURL(uploaded.url);
  }, [uploaded]);
  const account = useStudioAccount();
  const asset = useQuery({
    queryKey: ["thumbnail-studio", account, "asset", value],
    queryFn: () => thumbnailStudioApi.asset(value!),
    enabled: Boolean(value),
    staleTime: 60_000,
    refetchInterval: (query) => studioAssetRefreshDelay(query.state.data),
    retry: false,
  });
  const currentUpload = uploaded?.id === value ? uploaded : null;
  const selected = Boolean(value);
  const imageUrl = purpose === "script" ? null : currentUpload?.url || (asset.data && asset.data.id === value ? thumbnailMediaUrl(asset.data.url) : null);
  const selectedName = currentUpload?.name || (asset.data && asset.data.id === value ? asset.data.originalName : null) || "Saved reference";
  useEffect(() => setPreviewFailed(false), [imageUrl]);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <label className={`group flex min-h-24 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/20 bg-white/[.025] px-4 py-3 transition-colors hover:border-orange-500/60 hover:bg-orange-500/[.035] focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/25 ${disabled || busy ? "cursor-not-allowed opacity-50" : ""}`}>
        <input
          className="sr-only"
          type="file"
          aria-label={label}
          accept={
            purpose === "script"
              ? ".txt,.srt,.vtt"
              : "image/png,image/jpeg,image/webp"
          }
          disabled={disabled || busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const limit = purpose === "script" ? SCRIPT_BYTES : 10 * 1024 * 1024;
            if (file.size > limit) {
              setError({
                message: purpose === "script"
                  ? studioScriptTooLargeMessage(file.size)
                  : "Choose an image under 10 MB.",
              });
              return;
            }
            setBusy(true);
            onBusyChange?.(true);
            setError(null);
            try {
              const saved = await thumbnailStudioApi.upload(file, purpose);
              let previewUrl = saved.url;
              let local = false;
              if (purpose !== "script" && typeof URL.createObjectURL === "function") {
                try { previewUrl = URL.createObjectURL(file); local = true; } catch { /* The signed asset URL remains available. */ }
              }
              setUploaded({ id: saved.id, url: previewUrl, name: file.name, local });
              onChange(saved);
            } catch (failure) {
              const status = (failure as { response?: { status?: number } })?.response?.status;
              setError(
                purpose === "script" && status === 413
                  ? { message: studioScriptTooLargeMessage(file.size), status }
                  : studioError(failure),
              );
            } finally {
              setBusy(false);
              onBusyChange?.(false);
            }
          }}
        />
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-orange-400" aria-hidden="true">
          {purpose === "script" ? <FileText size={21} strokeWidth={1.7} /> : <ImagePlus size={21} strokeWidth={1.7} />}
        </span>
        <span className="min-w-0 text-sm">
          <span className="block font-medium text-white">{busy ? "Uploading…" : value ? "Replace reference" : purpose === "script" ? "Choose a script" : "Choose an image"}</span>
          <span className="mt-1 block text-xs text-zinc-400">{purpose === "script" ? "TXT, SRT or VTT · up to 1 MB" : "PNG, JPG or WebP · up to 10 MB"}</span>
        </span>
      </label>
      {busy && (
        <p role="status" className="text-xs text-zinc-400">
          Uploading and checking the file…
        </p>
      )}
      {selected && (
        <div className="flex items-center gap-3 rounded-xl border border-orange-500/25 bg-orange-500/[.055] p-2">
          <div className={`flex h-20 ${purpose === "face" ? "w-20" : "w-32"} shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40`}>
            {imageUrl && !previewFailed ? <img src={imageUrl} alt={`${label} preview`} className="h-full w-full object-contain" onError={() => setPreviewFailed(true)} /> : purpose === "script" ? <FileText size={24} className="text-orange-400" aria-hidden="true" /> : <ImagePlus size={24} className="text-zinc-500" aria-hidden="true" />}
          </div>
          <span className="min-w-0 flex-1 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-orange-300"><Check size={14} aria-hidden="true" />Added to this thumbnail</span>
            <span className="mt-1 block truncate text-zinc-200">{selectedName}</span>
            {previewFailed && <span className="mt-1 block text-zinc-400">Preview unavailable; the file is still selected.</span>}
            {!imageUrl && !previewFailed && purpose !== "script" && <span className="mt-1 block text-zinc-400">Loading preview…</span>}
          </span>
          <button
            type="button"
            disabled={disabled || busy}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
            onClick={() => { setUploaded(null); onChange(null); }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      {(error || (asset.error && !currentUpload)) && (
        <p role="alert" className="text-xs text-red-300">
          <StudioErrorText error={error || studioError(asset.error)} />
        </p>
      )}
    </div>
  );
}
/**
 * What the automatic check found on a version: only the checks that did not
 * pass, each with "Is this issue present?". Nothing when the check is turned
 * off (`checking` false: capabilities.validation), did not run, or passed; a
 * short note when it ran but could not check.
 */
export function OutputWarnings({ version, checking = true }: { version: StudioVersion; checking?: boolean }) {
  const validation = version.validation;
  const warningId = useId();
  const checks =
    validation?.checks.filter((check) => check.status !== "pass") || [];
  if (!checking || !validation) return null;
  if (validation.status === "unavailable")
    return <p className="text-xs text-zinc-400">Automatic check unavailable for this image.</p>;
  if (!checks.length) return null;
  return (
    <div className="space-y-1 text-xs">
      {checks.map((check, index) => (
          <div
            key={`${check.code}:${index}`}
            className="rounded-lg border border-white/10 p-2 text-amber-200"
          >
            <p id={`${warningId}-${index}`}>
              {check.status === "unknown" ? "Check manually: " : "Review: "}
              {check.explanation}
            </p>
            {check.status === "warning" &&
              (STUDIO_VALIDATION_CHECK_CODES as readonly string[]).includes(
                check.code,
              ) && (
                <StudioValidationFeedbackControls
                  key={`${version.id}:${check.code}`}
                  version={version}
                  checkCode={check.code as StudioValidationCheckCode}
                  descriptionId={`${warningId}-${index}`}
                />
              )}
          </div>
        ))}
    </div>
  );
}
export function ThumbnailPreview({
  version,
  title,
  width = 320,
  light = false,
  exportSize = "original",
}: {
  version: StudioVersion;
  title: string;
  width?: 160 | 320;
  light?: boolean;
  exportSize?: "original" | "youtube";
}) {
  const account = useStudioAccount();
  const asset = useQuery({
    queryKey: ["thumbnail-studio", account, "asset", version.assetId],
    queryFn: () => thumbnailStudioApi.asset(version.assetId),
    initialData: version.asset || undefined,
    staleTime: 60_000,
    refetchInterval: (query) => studioAssetRefreshDelay(query.state.data),
    refetchOnWindowFocus: true,
    retry: false,
  });
  const portrait = version.outputFormat
    ? version.outputFormat === "portrait"
    : Boolean(
        asset.data?.width &&
          asset.data?.height &&
          asset.data.height > asset.data.width,
      );
  return (
    <ThumbnailPreviewFigure
      image={asset.data || null}
      unavailable={Boolean(asset.error)}
      portrait={portrait}
      title={title}
      width={width}
      light={light}
      exportSize={exportSize}
    />
  );
}
/** A thumbnail at YouTube feed size with the video title under it. Runs no request. */
export function ThumbnailPreviewFigure({
  image,
  unavailable = false,
  portrait,
  title,
  width = 320,
  light = false,
  exportSize = "original",
}: {
  image: { url: string; width: number | null; height: number | null } | null;
  unavailable?: boolean;
  portrait: boolean;
  title: string;
  width?: 160 | 320;
  light?: boolean;
  exportSize?: "original" | "youtube";
}) {
  return (
    <figure
      style={{ width, maxWidth: "100%" }}
      className={`${light ? "bg-white text-zinc-900" : "bg-[#111111] text-white"} rounded-lg p-2`}
    >
      {image ? (
        <img
          src={thumbnailMediaUrl(image.url)}
          alt={`Thumbnail for ${title || "this video"}`}
          style={
            exportSize === "youtube"
              ? {
                  aspectRatio: portrait ? "9 / 16" : "16 / 9",
                  objectFit: "contain",
                  background: "#111111",
                }
              : undefined
          }
          className="w-full rounded"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-zinc-800 text-xs text-white">
          {unavailable ? "Image unavailable" : "Loading image…"}
        </div>
      )}
      <figcaption
        className={`${width === 160 ? "text-[11px]" : "text-sm"} mt-2 font-medium leading-snug`}
      >
        {title || "Your video title"}
      </figcaption>
      {image && (
        <p className="mt-1 text-[10px] opacity-60">
          {image.width} × {image.height}
          {exportSize === "youtube" ? " · Fit with borders if needed" : ""}
        </p>
      )}
    </figure>
  );
}
export function AuditCorrectionPicker({
  audit,
  revisionId,
  versionId,
  onApply,
  disabled,
  editCredits,
  renderAction,
}: {
  audit: StudioAudit;
  revisionId: string;
  versionId: string;
  /** Starts the correction edit; a promise resolving truthy clears the selection. */
  onApply: (instruction: string, findingIds: string[]) => void | Promise<unknown>;
  disabled?: boolean;
  /** The price of one edit, on the plain button. */
  editCredits?: number | null;
  /** The one-click priced button, with what it changes above it (Studio, spec §8). */
  renderAction?: (action: StudioCorrectionAction) => React.ReactNode;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const stale =
    audit.revisionId !== revisionId || audit.versionId !== versionId;
  const findings = audit.result.findings.filter((finding) =>
    selected.includes(finding.id),
  );
  const instruction = findings
    .map(
      (finding) =>
        `${finding.proposedChange}${finding.preserve.length ? ` Preserve: ${finding.preserve.join("; ")}.` : ""}`,
    )
    .join("\n");
  const correction: StudioCorrectionAction = {
    label: findings.length
      ? `Apply ${findings.length} correction${findings.length === 1 ? "" : "s"}`
      : "Apply corrections",
    instruction,
    findingIds: selected,
    disabled: Boolean(disabled) || stale || !findings.length,
    run: () => {
      const started = onApply(instruction, selected);
      if (started && typeof (started as Promise<unknown>).then === "function")
        void (started as Promise<unknown>).then((value) => {
          if (value) setSelected([]);
        });
    },
  };
  return (
    <section className="space-y-3 rounded-2xl border border-white/10 p-4">
      <h3 className="font-semibold text-white">What to fix or review</h3>
      {stale && (
        <p role="alert" className="text-sm text-amber-200">
          This audit uses a different image or older instructions. Run a new
          audit or write a manual edit.
        </p>
      )}
      {(showAll
        ? audit.result.findings
        : audit.result.findings.slice(0, 5)
      ).map((finding) => (
        <label
          key={finding.id}
          className="flex items-start gap-3 rounded-xl bg-white/5 p-3 text-sm"
        >
          <input
            type="checkbox"
            disabled={disabled || stale || !finding.editable}
            checked={selected.includes(finding.id)}
            onChange={(event) =>
              setSelected((previous) =>
                event.target.checked
                  ? [...previous, finding.id]
                  : previous.filter((id) => id !== finding.id),
              )
            }
          />
          <span>
            <span className="mb-1 block text-xs text-orange-200">
              {finding.severity === "must_fix" ? "Fix first" : "Consider"}
            </span>
            <strong className="block text-white">{finding.observation}</strong>
            <span className="mt-1 block text-zinc-300">
              {finding.creatorImpact}
            </span>
            <span className="mt-1 block text-zinc-400">
              Suggested change: {finding.proposedChange}
            </span>
            {finding.evidence === "hypothesis" && (
              <em className="mt-1 block text-amber-200">
                Hypothesis to consider, not an observed fact.
              </em>
            )}
            {!finding.editable && (
              <em className="block text-zinc-400">
                Requires your manual decision.
              </em>
            )}
          </span>
        </label>
      ))}
      {audit.result.findings.length > 5 && (
        <button
          className={studioSecondary}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll
            ? "Show first five"
            : `Show all ${audit.result.findings.length} findings`}
        </button>
      )}
      {audit.result.strengths.map((text, index) => (
        <p key={index} className="text-sm text-emerald-200">
          Keep: {text}
        </p>
      ))}
      {audit.result.limitations.map((text, index) => (
        <p key={index} className="text-xs text-zinc-400">
          {text}
        </p>
      ))}
      {audit.result.personaOpinion && (
        <details>
          <summary className="text-sm text-zinc-300">
            AI persona opinions — not measured CTR
          </summary>
          {audit.result.personaOpinion.votes.map((vote, index) => (
            <p key={index} className="mt-2 text-xs text-zinc-400">
              {vote.personaName}: {vote.reasoning}
            </p>
          ))}
        </details>
      )}
      {instruction && !renderAction && (
        <div>
          <p className="text-xs text-zinc-400">What changes</p>
          <pre className="my-2 whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs text-zinc-200">
            {instruction}
          </pre>
        </div>
      )}
      {renderAction ? (
        renderAction(correction)
      ) : (
        <button
          type="button"
          className={studioButton}
          disabled={correction.disabled}
          onClick={correction.run}
        >
          {editCredits != null
            ? `${correction.label} · ${studioCreditsLabel(editCredits)}`
            : correction.label}
        </button>
      )}
    </section>
  );
}
/** The selected audit corrections, sent as one edit in one click. */
export interface StudioCorrectionAction {
  /** "Apply 2 corrections". */
  label: string;
  /** The edit instruction built from the selected findings (what changes). */
  instruction: string;
  findingIds: string[];
  /** Nothing selected, the audit is stale, or the page is busy. */
  disabled: boolean;
  run: () => void;
}

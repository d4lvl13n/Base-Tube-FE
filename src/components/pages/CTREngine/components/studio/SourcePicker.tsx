import { studioSourceLabels } from "../../../../../utils/studioLabels";
import React, { useState } from "react";
import type {
  StudioProject,
  StudioAsset,
  StudioArtifact,
} from "../../../../../types/thumbnailStudio";
import {
  thumbnailStudioApi,
  studioError,
} from "../../../../../api/thumbnailStudio";
import { AssetInput, studioButton, studioField } from "./StudioControls";
import type { StudioErrorInfo } from "../../../../../api/studioErrors";
import { StudioErrorText } from "./StudioErrorDetail";
import type { StudioEntrySource } from "../../../../../utils/studioEntry";
export function SourcePicker({
  project,
  onSave,
  onImage,
  onScript,
  onProposal,
  disabled,
  initialSource = "idea",
}: {
  project: StudioProject;
  onSave: () => Promise<StudioProject>;
  onImage: (asset: StudioAsset) => Promise<void>;
  onScript: (asset: StudioAsset) => Promise<void>;
  onProposal: (artifact: StudioArtifact, operationId: string) => void;
  disabled?: boolean;
  initialSource?: StudioEntrySource;
}) {
  const [source, setSource] = useState<"idea" | "youtube" | "script" | "image">(
    initialSource,
  );
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StudioErrorInfo | null>(null);
  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (failure) {
      setError(studioError(failure));
    } finally {
      setBusy(false);
    }
  };
  const context = project.currentRevision.sourceContext;
  return (
    <section className="space-y-3 rounded-2xl border border-white/10 p-4">
      <h2 className="font-semibold text-white">Start from your material</h2>
      <div className="flex flex-wrap gap-2">
        {(["idea", "youtube", "script", "image"] as const).map((value) => (
          <label key={value} className={`relative cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-orange-500 ${source === value ? "border-orange-500/70 bg-orange-500/10 text-white" : "border-white/15 bg-white/[.03] text-zinc-300 hover:border-white/30 hover:text-white"}`}>
            <input
              className="absolute opacity-0"
              type="radio"
              name="studio-source"
              checked={source === value}
              onChange={() => setSource(value)}
            />
            {value === "youtube"
              ? "YouTube link"
              : value === "script"
                ? "Script / subtitles"
                : value === "image"
                  ? "Existing image"
                  : "An idea"}
          </label>
        ))}
      </div>
      {source === "idea" && (
        <p className="text-sm text-zinc-400">
          Describe the video below. You can add references whenever you need
          them.
        </p>
      )}
      {source === "youtube" && (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const current = await onSave();
              const proposal = await thumbnailStudioApi.youtubeSource(
                current.id,
                current.lockVersion,
                url,
              );
              onProposal(proposal.artifact, proposal.id);
            });
          }}
        >
          <label className="block text-sm text-zinc-200">
            Video link
            <input
              required
              type="url"
              className={studioField}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </label>
          <button className={studioButton} disabled={disabled || busy}>
            Read available video information
          </button>
          <p className="text-xs text-zinc-400">
            We can read public video information. If a transcript is
            unavailable, upload your script; we do not assume we watched the
            video.
          </p>
        </form>
      )}
      {source === "script" && (
        <>
          <AssetInput
            label="Upload your script or subtitles"
            purpose="script"
            disabled={disabled || busy}
            onChange={(asset) => {
              if (asset) void run(() => onScript(asset));
            }}
          />
          <p className="text-xs text-zinc-400">
            TXT, SRT or VTT · UTF-8 · up to 1 MB / 100,000 characters. You will
            review the summary before it changes your brief.
          </p>
        </>
      )}
      {source === "image" && (
        <>
          <AssetInput
            label="Upload an existing thumbnail"
            purpose="source_image"
            disabled={disabled || busy}
            onChange={(asset) => {
              if (asset) void run(() => onImage(asset));
            }}
          />
          <p className="text-xs text-zinc-400">
            PNG, JPEG or WebP · up to 10 MB. Import is free; editing and
            auditing show their price on their button.
          </p>
        </>
      )}
      <div className="rounded-xl bg-white/5 p-3 text-xs text-zinc-400">
        <p>Current source: {context.type.replace("_", " ")}.</p>
        <p>
          Information available:{" "}
          {context.contentsRead.length
            ? studioSourceLabels(context.contentsRead)
            : "Your own instructions only"}
          .
        </p>
        <p>
          {context.transcriptStatus === "provided"
            ? "A script was supplied."
            : "No transcript was supplied."}
        </p>
      </div>
      {busy && (
        <p role="status" className="text-xs text-zinc-300">
          Preparing your material…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          <StudioErrorText error={error} />
        </p>
      )}
    </section>
  );
}

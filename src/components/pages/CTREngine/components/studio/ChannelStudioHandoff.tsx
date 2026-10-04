import { StudioSelect } from "./StudioSelect";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateStudioProjectLists } from "../../../../../hooks/useStudioProject";
import type {
  ChannelPackagingAuditV2,
  ChannelAuditV2Experiment,
} from "../../../../../types/ctr";
import { useStudioAccount } from "../../../../../hooks/useStudioAccount";
import { studioStartKey } from "../../../../../hooks/useStudioOperation";
import {
  thumbnailStudioApi,
  studioError,
} from "../../../../../api/thumbnailStudio";
import { studioButton, studioField, studioSecondary } from "./StudioControls";
import type { StudioErrorInfo } from "../../../../../api/studioErrors";
import { StudioErrorText } from "./StudioErrorDetail";
/** The only way from an experiment to images: prepare it in a project (spec §11.2). */
export function StudioExperimentAction({
  experiment,
  auditId,
}: {
  experiment: ChannelAuditV2Experiment;
  auditId?: number;
}) {
  const account = useStudioAccount();
  if (account === "anonymous" || !auditId) return null;
  return (
    <button
      className={studioSecondary}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("studio:choose-experiment", {
            detail: experiment.id,
          }),
        );
        document
          .getElementById("studio-channel-actions")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      Use this suggestion in AI Thumbnail
    </button>
  );
}
export function ChannelStudioHandoff({
  audit,
}: {
  audit: ChannelPackagingAuditV2;
}) {
  const account = useStudioAccount();
  const client = useQueryClient();
  const enabled = Boolean(account !== "anonymous" && audit.id);
  const context = useQuery({
    queryKey: ["thumbnail-studio", account, "channel-context", audit.id],
    queryFn: () => thumbnailStudioApi.channelContext(audit.id!),
    enabled,
    retry: false,
  });
  const profiles = useQuery({
    queryKey: ["thumbnail-studio", account, "profiles"],
    queryFn: () => thumbnailStudioApi.profiles(),
    enabled,
    retry: false,
  });
  const [filter, setFilter] = useState("all");
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StudioErrorInfo | null>(null);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof thumbnailStudioApi.channelProjects>
  > | null>(null);
  useEffect(() => {
    const choose = (event: Event) => {
      const experimentId = (event as CustomEvent).detail;
      const videoId = context.data?.eligibleExperiments.find(
        (row) => row.experimentId === experimentId,
      )?.videoIds[0];
      if (videoId) {
        setSelection({ [videoId]: experimentId });
        setFilter("all");
      }
    };
    window.addEventListener("studio:choose-experiment", choose);
    return () => window.removeEventListener("studio:choose-experiment", choose);
  }, [context.data]);
  if (!enabled || !audit.experiments.length) return null;
  const experiments = [...audit.experiments].sort(
    (a, b) => a.priority - b.priority,
  );
  const eligible = context.data?.eligibleExperiments || [];
  const formats = new Map(
    context.data?.videos.map((video) => [video.videoId, video.format]),
  );
  const selectable = experiments.filter((experiment) =>
    eligible.some((row) => row.experimentId === experiment.id),
  );
  const choices = selectable
    .flatMap((experiment) =>
      eligible
        .find((row) => row.experimentId === experiment.id)!
        .videoIds.map((videoId) => ({
          experiment,
          video: audit.perVideo.find((video) => video.videoId === videoId)!,
        })),
    )
    .filter(
      (row) =>
        row.video &&
        (filter === "all" || formats.get(row.video.videoId) === filter),
    );
  const choose = (videoId: string, experimentId: string, checked: boolean) =>
    setSelection((previous) => {
      const next = { ...previous };
      if (checked) next[videoId] = experimentId;
      else delete next[videoId];
      return next;
    });
  return (
    <section
      id="studio-channel-actions"
      className="mb-8 scroll-mt-20 space-y-4 rounded-2xl border border-orange-500/25 bg-orange-500/[0.04] p-5"
    >
      <h2 className="text-xl font-semibold text-white">
        Build a suggested variant in AI Thumbnail
      </h2>
      <p className="text-sm text-zinc-400">
        These follow the report's priority order. They are ideas to test, not a
        promise of more clicks.
      </p>
      {!audit.publicReview && <ol className="space-y-2">
        {experiments.slice(0, 3).map((experiment, index) => (
          <li key={experiment.id} className="text-sm text-zinc-200">
            <strong>
              {index + 1}. {experiment.title}
            </strong>
            <p className="mt-1 text-xs text-zinc-400">
              {experiment.hypothesis}
            </p>
          </li>
        ))}
      </ol>}
      <label className="block text-sm text-zinc-300">
        Videos to prepare
        <StudioSelect
          className={studioField}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All formats</option>
          <option value="long">Long videos</option>
          <option value="short">Shorts</option>
          <option value="unknown">Format unknown</option>
        </StudioSelect>
      </label>
      <p className="text-xs text-zinc-400">
        This filter changes this list only. Duration alone does not identify a
        Short, so unverified formats stay unknown.
      </p>
      {context.isPending && (
        <p role="status" className="text-sm text-zinc-400">
          Checking available videos…
        </p>
      )}
      {choices.map(({ video, experiment }) => (
        <label
          key={`${video.videoId}:${experiment.id}`}
          className="flex items-start gap-3 rounded-xl border border-white/10 p-3 text-sm text-zinc-200"
        >
          <input
            className="mt-1"
            type="checkbox"
            checked={selection[video.videoId] === experiment.id}
            disabled={
              busy ||
              (!selection[video.videoId] && Object.keys(selection).length >= 3)
            }
            onChange={(event) =>
              choose(video.videoId, experiment.id, event.target.checked)
            }
          />
          <span>
            {video.title}
            <span className="mt-1 block text-xs text-zinc-400">
              Experiment: {experiment.title} ·{" "}
              {formats.get(video.videoId) || "unknown"}
            </span>
          </span>
        </label>
      ))}
      {context.data && !choices.length && (
        <p className="text-sm text-zinc-400">
          No eligible videos in this format.
        </p>
      )}
      <label className="block text-sm text-zinc-300">
        Channel preferences
        <StudioSelect
          className={studioField}
          value={profile}
          onChange={(event) => setProfile(event.target.value)}
        >
          <option value="">No profile</option>
          {profiles.data?.items.map((value) => (
            // A read-only profile (over the plan's limit) cannot be used for new work.
            <option key={value.id} value={value.id} disabled={value.readOnly}>
              {value.name}
              {value.readOnly ? " (read-only)" : ""}
            </option>
          ))}
        </StudioSelect>
      </label>
      <button
        className={studioButton}
        disabled={busy || !Object.keys(selection).length}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const body = {
              selections: Object.entries(selection)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([videoId, experimentId]) => ({ videoId, experimentId })),
              ...(profile ? { profileId: profile } : {}),
            };
            const key = studioStartKey(
              `handoff:${account}:${audit.id}:${JSON.stringify(body)}`,
            );
            setResult(
              await thumbnailStudioApi.channelProjects(audit.id!, body, key),
            );
            invalidateStudioProjectLists(client, account);
          } catch (failure) {
            setError(studioError(failure));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Preparing projects…"
          : `Prepare ${Object.keys(selection).length || ""} project${Object.keys(selection).length === 1 ? "" : "s"} · free`}
      </button>
      <p className="text-xs text-zinc-400">
        Choose up to three videos. Each project needs your review before
        creating images. Private analytics recommendations are not sent to the
        image tools.
      </p>
      {(error || context.error) && (
        <p role="alert" className="text-sm text-red-300">
          <StudioErrorText error={error || studioError(context.error)} />
        </p>
      )}
      {result && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <h3 className="font-semibold text-white">Projects ready to review</h3>
          {result.projects.map((project) => (
            <div key={project.id} className="space-y-2 text-sm text-zinc-300">
              <Link
                className="font-medium text-orange-300 underline"
                to={`/ai-thumbnails/projects/${project.id}`}
              >
                {project.name}
              </Link>
              {result.review
                .find((review) => review.projectId === project.id)
                ?.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-amber-200">
                    {warning}
                  </p>
                ))}
              {result.review.find((review) => review.projectId === project.id)
                ?.suggestedTitle && (
                <p className="text-xs">
                  Suggested title to consider:{" "}
                  {
                    result.review.find(
                      (review) => review.projectId === project.id,
                    )?.suggestedTitle
                  }
                </p>
              )}
            </div>
          ))}
          {result.projects.length > 1 && (
            <Link
              className={`${studioSecondary} inline-block`}
              to={`/ai-thumbnails/projects/batch?projects=${result.projects.map((project) => project.id).join(",")}`}
            >
              Review these videos together
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

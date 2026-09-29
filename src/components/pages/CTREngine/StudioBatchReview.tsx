import { StudioSelect } from "./components/studio/StudioSelect";
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  useInfiniteQuery,
  useQueries,
  useQueryClient,
} from "@tanstack/react-query";
import AIThumbnailsLayout from "./AIThumbnailsLayout";
import AIThumbnailsSignInOptions from "./components/AIThumbnailsSignInOptions";
import { StudioAuthGate } from "./components/studio/StudioAuthGate";
import useCTREngine from "../../../hooks/useCTREngine";
import { useStudioAccount } from "../../../hooks/useStudioAccount";
import {
  useStudioCapabilities,
  useStudioPricing,
  useStudioStartAvailability,
} from "../../../hooks/useStudioCapabilities";
import { useStudioOperation } from "../../../hooks/useStudioOperation";
import { studioItemCredits } from "../../../utils/studioPricing";
import { StudioCreditsScope, StudioPaidAction } from "./components/studio/StudioPaidAction";
import { StudioErrorText } from "./components/studio/StudioErrorDetail";
import type { StudioErrorInfo } from "../../../api/studioErrors";
import { useStudioAvailableCredits } from "../../../hooks/useStudioBalance";
import { invalidateStudioProjectLists, studioProjectKey } from "../../../hooks/useStudioProject";
import {
  thumbnailStudioApi,
  studioError,
  downloadStudioBlob,
} from "../../../api/thumbnailStudio";
import type {
  StudioOperationItem,
  StudioProject,
} from "../../../types/thumbnailStudio";
import { buildStudioBatchQuote } from "../../../utils/studioBatch";
import { StudioOperationPanel } from "./components/studio/StudioOperationPanel";
import {
  OutputWarnings,
  ThumbnailPreview,
  studioField,
  studioSecondary,
} from "./components/studio/StudioControls";
import { studioExportChoiceLabel, studioSuggestedExport } from "../../../api/studioErrors";
import type { StudioExportChoice } from "../../../api/studioErrors";
export default function StudioBatchReview() {
  const access = useCTREngine();
  const account = useStudioAccount();
  return (
    <AIThumbnailsLayout
      usageAccess={access.usageAccess}
      isLoadingQuota={access.isLoadingQuota}
    >
      <StudioAuthGate access={access} signedOut={<AIThumbnailsSignInOptions />}>
        <Batch key={account} />
      </StudioAuthGate>
    </AIThumbnailsLayout>
  );
}
function Batch() {
  const account = useStudioAccount();
  const client = useQueryClient();
  const start = useStudioStartAvailability();
  const availableCredits = useStudioAvailableCredits();
  const pricing = useStudioPricing();
  const checking = useStudioCapabilities().data?.validation !== false;
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<string[]>(() =>
    Array.from(
      new Set(
        (params.get("projects") || "")
          .split(",")
          .filter((id) => /^[0-9a-f-]{36}$/i.test(id)),
      ),
    ).slice(0, 3),
  );
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [quality, setQuality] = useState<"standard" | "high">("high");
  const [error, setError] = useState<StudioErrorInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [size, setSize] = useState<"original" | "youtube">("original");
  // EXPORT_TOO_LARGE names a format and size that fit: offered as one click.
  const [suggestedExport, setSuggestedExport] = useState<StudioExportChoice | null>(null);
  const list = useInfiniteQuery({
    queryKey: ["thumbnail-studio", account, "batch-projects"],
    queryFn: ({ pageParam }) =>
      thumbnailStudioApi.projects({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
    retry: false,
  });
  const queries = useQueries({
    queries: selected.map((id) => ({
      queryKey: studioProjectKey(id, account),
      queryFn: () => thumbnailStudioApi.project(id),
      retry: false,
    })),
  });
  const projects = queries.flatMap((query) => (query.data ? [query.data] : []));
  const scope = `batch:${selected.slice().sort().join(",")}`;
  const operation = useStudioOperation(
    scope,
    projects.flatMap((project) =>
      project.activeOperations.map((item) => item.id),
    ),
    () => {
      invalidateStudioProjectLists(client, account);
      for (const id of selected)
        void client.invalidateQueries({
          queryKey: studioProjectKey(id, account),
        });
    },
  );
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(studioError(failure));
    } finally {
      setBusy(false);
    }
  };
  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((value) => value !== id)
      : [...selected, id].slice(0, 3);
    setSelected(next);
    setParams({ projects: next.join(",") }, { replace: true });
  };
  // The briefs read now must be the briefs on screen: a batch never starts on
  // instructions the creator has not seen.
  const fresh = async (shown: StudioProject[]) => {
    const current = await Promise.all(
      selected.map((id) => thumbnailStudioApi.project(id)),
    );
    const changed = current.some(
      (project) =>
        shown.find((old) => old.id === project.id)?.currentRevisionId !==
        project.currentRevisionId,
    );
    for (const project of current)
      client.setQueryData(studioProjectKey(project.id, account), project);
    if (changed)
      throw new Error(
        "Instructions changed in another tab. Review the updated briefs, then generate again.",
      );
    return current;
  };
  const conceptCount = (project: StudioProject) => counts[project.id] || 2;
  const unit = studioItemCredits(pricing, "generate");
  const projectCredits = (project: StudioProject) =>
    unit === null ? null : unit * conceptCount(project);
  const totalCredits =
    unit === null
      ? null
      : projects.reduce((sum, project) => sum + unit * conceptCount(project), 0);
  const batchKey = `batch:${projects
    .map((project) => `${project.id}:${conceptCount(project)}`)
    .join(",")}:${quality}`;
  const generateAll = () => {
    const shown = projects;
    return operation.run({
      key: batchKey,
      credits: totalCredits,
      request: async () => buildStudioBatchQuote(await fresh(shown), counts, quality),
    });
  };
  const retryCredits = (item: StudioOperationItem) =>
    item.retryMode === "new_preparation"
      ? unit === null
        ? null
        : unit * (item.input.conceptCount || 1)
      : studioItemCredits(pricing, item.action, item.input);
  const retry = (item: StudioOperationItem) =>
    operation.run({
      key: `retry:${item.id}`,
      credits: retryCredits(item),
      retryOf: item.retryMode === "new_preparation" ? item.id : undefined,
      request: async () => {
        const current = await thumbnailStudioApi.project(item.projectId);
        client.setQueryData(studioProjectKey(current.id, account), current);
        if (current.currentRevisionId !== item.revisionId)
          throw new Error("This video changed. Review it, then generate again.");
        if (item.retryMode === "new_preparation")
          return buildStudioBatchQuote(
            [current],
            { [current.id]: item.input.conceptCount || 1 },
            item.input.quality || "high",
          );
        return {
          items: [
            {
              projectId: item.projectId,
              revisionId: item.revisionId,
              action: item.action,
              input: item.input,
            },
          ],
          retryOfItemId: item.id,
        };
      },
    });
  /** A priced one-click button wired to this page's action state. */
  const paid = (
    key: string,
    props: Omit<React.ComponentProps<typeof StudioPaidAction>, "availableCredits" | "unavailable" | "state" | "working" | "onConfirm" | "actionKey">,
  ) => (
    <StudioPaidAction
      {...props}
      actionKey={key}
      availableCredits={availableCredits}
      unavailable={start.message}
      state={operation.actions[key]}
      working={operation.working === key}
      onConfirm={() => void operation.confirm(key)}
    />
  );
  const selectedVersions = projects.flatMap((project) =>
    project.selectedVersionId ? [project.selectedVersionId] : [],
  );
  const exportZip = (choice: StudioExportChoice) =>
    run(async () => {
      setSuggestedExport(null);
      try {
        await downloadStudioBlob(
          await thumbnailStudioApi.exportSelection(selectedVersions, choice.format, choice.size),
          "thumbnail-choices.zip",
        );
      } catch (failure) {
        setSuggestedExport(studioSuggestedExport(failure));
        throw failure;
      }
    });
  return (
    <div className="space-y-6 text-white">
      <header>
        <Link
          to="/ai-thumbnails/projects"
          className="text-sm text-zinc-400 underline"
        >
          All projects
        </Link>
        <h1 className="mt-3 text-3xl font-semibold">Prepare several videos</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Up to three videos from the same channel, with one or two concepts
          each. Review every brief, then generate them all in one click.
        </p>
      </header>
      <section className="space-y-3 rounded-2xl border border-white/10 p-4">
        <h2 className="font-semibold">Choose up to three projects</h2>
        {list.isPending && <p role="status">Loading projects…</p>}
        {list.data?.pages
          .flatMap((page) => page.items)
          .map((project) => (
            <label
              key={project.id}
              className="flex items-center gap-3 text-sm text-zinc-300"
            >
              <input
                type="checkbox"
                checked={selected.includes(project.id)}
                disabled={
                  busy ||
                  operation.busy ||
                  (!selected.includes(project.id) && selected.length >= 3)
                }
                onChange={() => toggle(project.id)}
              />
              {project.name}
              {!project.youtubeChannelId && (
                <span className="text-xs text-amber-200">
                  Add a YouTube source to use with other videos
                </span>
              )}
            </label>
          ))}
        {list.hasNextPage && (
          <button
            className={studioSecondary}
            onClick={() => list.fetchNextPage()}
          >
            Load more projects
          </button>
        )}
      </section>
      {(error || list.error) && (
        <p role="alert" className="text-red-300">
          <StudioErrorText error={error || studioError(list.error)} />
        </p>
      )}
      {queries
        .filter((query) => query.error)
        .map((query, index) => (
          <p role="alert" key={index} className="text-red-300">
            <StudioErrorText error={studioError(query.error)} />
          </p>
        ))}
      <StudioCreditsScope availableCredits={availableCredits}>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {projects.map((project) => (
          <section
            key={project.id}
            className="space-y-3 rounded-2xl border border-white/10 p-4"
          >
            <h2 className="font-semibold">{project.name}</h2>
            <BriefSummary project={project} />
            <Link
              className={`${studioSecondary} inline-block`}
              to={`/ai-thumbnails/projects/${project.id}`}
            >
              Review or edit this brief
            </Link>
            <label className="block text-sm text-zinc-300">
              Concepts
              <StudioSelect
                className={studioField}
                value={counts[project.id] || 2}
                onChange={(event) =>
                  setCounts({
                    ...counts,
                    [project.id]: Number(event.target.value),
                  })
                }
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
              </StudioSelect>
            </label>
            {projectCredits(project) !== null && (
              <p className="text-xs text-zinc-400">
                {conceptCount(project)} concept{conceptCount(project) === 1 ? "" : "s"} ·{" "}
                {projectCredits(project)} credits
              </p>
            )}
            <h3 className="pt-3 text-sm font-medium">
              Choose this video's final image
            </h3>
            {Array.from(
              new Map(
                [
                  ...project.versions,
                  ...(project.selectedVersion ? [project.selectedVersion] : []),
                ].map((version) => [version.id, version]),
              ).values(),
            ).map((version) => (
              <div
                key={version.id}
                className="space-y-2 border-t border-white/10 pt-3"
              >
                <ThumbnailPreview
                  version={version}
                  title={project.currentRevision.brief.videoTitle}
                />
                <OutputWarnings version={version} checking={checking} />
                <button
                  className={studioSecondary}
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const current = await thumbnailStudioApi.project(
                        project.id,
                      );
                      await thumbnailStudioApi.patchProject(
                        project.id,
                        current.lockVersion,
                        { selectedVersionId: version.id },
                      );
                      invalidateStudioProjectLists(client, account);
                      await client.invalidateQueries({
                        queryKey: studioProjectKey(project.id, account),
                      });
                    })
                  }
                >
                  {project.selectedVersionId === version.id
                    ? "Selected"
                    : "Keep this version"}
                </button>
              </div>
            ))}
            {project.versionsNextCursor && (
              <Link
                className="text-sm underline"
                to={`/ai-thumbnails/projects/${project.id}`}
              >
                Open project for older versions
              </Link>
            )}
          </section>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-zinc-300">
            Quality
            <StudioSelect
              className={studioField}
              value={quality}
              onChange={(event) =>
                setQuality(event.target.value as typeof quality)
              }
            >
              <option value="high">High</option>
              <option value="standard">Standard</option>
            </StudioSelect>
          </label>
          {paid(batchKey, {
            label: "Generate all",
            credits: totalCredits,
            disabled: busy || operation.busy || projects.length !== selected.length,
            onRun: () => void generateAll(),
          })}
        </div>
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {operation.announcement}
      </p>
      {operation.operations
        .slice()
        .reverse()
        .map((op) => (
          <StudioOperationPanel
            key={op.id}
            operation={op}
            projectNames={Object.fromEntries(
              projects.map((project) => [project.id, project.name]),
            )}
            busy={busy || operation.busy}
            renderRetry={(item) =>
              paid(`retry:${item.id}`, {
                label: item.retryMode === "new_preparation" ? "Prepare concepts again" : "Retry",
                credits: retryCredits(item),
                secondary: true,
                disabled: busy || operation.busy,
                onRun: () => void retry(item),
              })
            }
            onDismiss={(finished) => operation.forget(finished.id)}
          />
        ))}
      </StudioCreditsScope>
      {projects.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-white/10 p-4">
          <h2 className="font-semibold">Download your choices</h2>
          <p className="text-sm text-zinc-400">
            One selected image per video. The ZIP also includes a summary of
            each title, project and selected version. Exporting does not select
            images for you.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              File format
              <StudioSelect
                className={studioField}
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as typeof format)
                }
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
              </StudioSelect>
            </label>
            <label className="text-sm">
              Size
              <StudioSelect
                className={studioField}
                value={size}
                onChange={(event) => setSize(event.target.value as typeof size)}
              >
                <option value="original">Original</option>
                <option value="youtube">YouTube (fit)</option>
              </StudioSelect>
            </label>
            <button
              className={studioSecondary}
              disabled={
                busy ||
                selectedVersions.length !== projects.length ||
                projects.length !== selected.length
              }
              onClick={() => void exportZip({ format, size })}
            >
              Download selected images · free
            </button>
            {suggestedExport && (
              <button
                type="button"
                className={studioSecondary}
                disabled={busy}
                onClick={() => {
                  setFormat(suggestedExport.format);
                  setSize(suggestedExport.size);
                  void exportZip(suggestedExport);
                }}
              >
                Download as {studioExportChoiceLabel(suggestedExport)} instead
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
function BriefSummary({ project }: { project: StudioProject }) {
  const { brief, profileSnapshot } = project.currentRevision;
  return (
    <div className="space-y-2 text-sm text-zinc-300">
      <p>
        <strong>Title:</strong> {brief.videoTitle || "Missing title"}
      </p>
      <p>{brief.summary}</p>
      <p>{brief.creatorHook}</p>
      <p>{brief.visualDirection}</p>
      <p className="text-xs text-zinc-400">
        {brief.outputFormat} · {brief.language} ·{" "}
        {profileSnapshot
          ? `${profileSnapshot.name} (saved version ${profileSnapshot.version})`
          : "No profile"}
      </p>
      <p className="text-xs text-zinc-400">
        Thumbnail text:{" "}
        {brief.text.mode === "exact"
          ? brief.text.value
          : brief.text.mode === "none"
            ? "No added text"
            : "Suggest text"}{" "}
        · Faces {brief.rules.faces} · Logos {brief.rules.logos} · Prices{" "}
        {brief.rules.prices}
      </p>
      {brief.rules.additional.map((rule, index) => (
        <p className="text-xs" key={index}>
          {rule}
        </p>
      ))}
    </div>
  );
}

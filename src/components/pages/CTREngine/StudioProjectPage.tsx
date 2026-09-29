import { StudioSelect } from "./components/studio/StudioSelect";
import { studioSourceLabels } from "../../../utils/studioLabels";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, Pencil } from "lucide-react";
import { GeneratedConceptsGrid } from "./components/GeneratedConceptsGrid";
import type { GeneratedConcept } from "../../../types/ctr";
import type { StudioErrorInfo, StudioExportChoice } from "../../../api/studioErrors";
import { PreciseThumbnailEditor } from "../../common/PreciseThumbnailEditor";
import type { ControlledThumbnailEditor, ThumbnailEditAction, ThumbnailEditTarget } from "../../common/PreciseThumbnailEditor";
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
import { useStudioProject } from "../../../hooks/useStudioProject";
import { useStudioAssets } from "../../../hooks/useStudioAssets";
import {
  isStudioTerminal,
  useStudioOperation,
} from "../../../hooks/useStudioOperation";
import { useStudioAvailableCredits } from "../../../hooks/useStudioBalance";
import { studioItemCredits } from "../../../utils/studioPricing";
import { StudioCreditsScope, StudioPaidAction } from "./components/studio/StudioPaidAction";
import {
  thumbnailStudioApi,
  downloadStudioBlob,
  studioError,
} from "../../../api/thumbnailStudio";
import type {
  StudioArtifact,
  StudioItemInput,
  StudioOperation,
  StudioOperationItem,
  StudioQuoteItem,
  StudioVersion,
  StudioAudit,
  StudioProfileSettings,
} from "../../../types/thumbnailStudio";
import { BriefReview, StyleFields } from "./components/studio/BriefReview";
import { ChannelProfilePanel } from "./components/studio/ChannelProfilePanel";
import { SourcePicker } from "./components/studio/SourcePicker";
import {
  studioEntrySource,
  StudioEntryState,
} from "../../../utils/studioEntry";
import { StudioOperationPanel } from "./components/studio/StudioOperationPanel";
import {
  loadStudioEditReviews,
  saveStudioEditReviews,
  StudioEditRequest,
  StudioEditReview,
  StudioEditSummary,
  studioEditRequestFromItem,
} from "./components/studio/StudioEditSummary";
import {
  AuditCorrectionPicker,
  OutputWarnings,
  ThumbnailPreview,
  studioButton,
  studioField,
  studioSecondary,
} from "./components/studio/StudioControls";
import { StudioRefineView } from "./components/studio/StudioRefineView";
import { StudioDownloadButton, studioCompactButton } from "./components/studio/StudioDownloadButton";
import { StudioErrorText } from "./components/studio/StudioErrorDetail";
const instructionsChanged =
  "Your instructions changed. Create new concepts or run the action again with the current brief.";
export default function StudioProjectPage() {
  const { projectId = "" } = useParams();
  const account = useStudioAccount();
  const access = useCTREngine();
  const navigate = useNavigate();
  return (
    <AIThumbnailsLayout
      usageAccess={access.usageAccess}
      isLoadingQuota={access.isLoadingQuota}
    >
      <StudioAuthGate
        access={access}
        signedOut={
          <div className="space-y-4 text-white">
            <h1 className="text-2xl font-semibold">Your thumbnail project</h1>
            <p>Sign in to open this private project.</p>
            <AIThumbnailsSignInOptions />
            <button
              className={studioSecondary}
              onClick={() => navigate("/ai-thumbnails/generate")}
            >
              Back to Create
            </button>
          </div>
        }
      >
        <Workspace key={`${account}:${projectId}`} projectId={projectId} />
      </StudioAuthGate>
    </AIThumbnailsLayout>
  );
}
function Workspace({ projectId }: { projectId: string }) {
  const account = useStudioAccount();
  const start = useStudioStartAvailability();
  const availableCredits = useStudioAvailableCredits();
  const pricing = useStudioPricing();
  // The automatic check can be turned off: then versions carry no note about it.
  const checking = useStudioCapabilities().data?.validation !== false;
  const project = useStudioProject(projectId);
  const navigate = useNavigate();
  const location = useLocation();
  const entry = (location.state as { studioEntry?: StudioEntryState } | null)
    ?.studioEntry;
  const [error, setError] = useState<StudioErrorInfo | null>(null);
  const [count, setCount] = useState(
    entry?.conceptCount && [1, 2, 3].includes(entry.conceptCount)
      ? entry.conceptCount
      : 2,
  );
  const [quality, setQuality] = useState<"standard" | "high">(
    entry?.quality === "standard" ? "standard" : "high",
  );
  const [versionId, setVersionId] = useState<string | null>(null);
  const [chosenStage, setStage] = useState<"brief" | "choose" | "refine" | null>(null);
  // Decided once: consuming the entry state below must not send the creator back.
  // A generation started from /generate lands on step 2 with its running work.
  const [entryStage] = useState<"brief" | "choose" | null>(() =>
    entry?.startGeneration
      ? "choose"
      : entry || location.search
        ? "brief"
        : null,
  );
  const [renaming, setRenaming] = useState(false);
  // What each started edit asked for, kept with its operation (it survives a
  // reload): its progress shows next to the image being edited.
  const [editReviews, setEditReviews] = useState<Record<string, StudioEditReview>>(() =>
    loadStudioEditReviews(account, projectId),
  );
  useEffect(() => {
    saveStudioEditReviews(account, projectId, editReviews);
  }, [account, projectId, editReviews]);
  // After "Open Version N", focus the edit's panel where it now appears.
  const [focusOperation, setFocusOperation] = useState<string | null>(null);
  useEffect(() => {
    if (!focusOperation) return;
    setFocusOperation(null);
    const panel = document.getElementById(`studio-operation-${focusOperation}`);
    panel?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    panel?.querySelector<HTMLElement>("[data-studio-focus]")?.focus({ preventScroll: true });
  }, [focusOperation]);
  const [referencesBusy, setReferencesBusy] = useState(false);
  const consumedEntry = useRef(false);
  const seenVersions = useRef<Set<string> | null>(null);
  const [includePersonas, setPersonas] = useState(false);
  const [light, setLight] = useState(false);
  const [width, setWidth] = useState<160 | 320>(320);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [exportSize, setExportSize] = useState<"original" | "youtube">(
    "original",
  );
  const [extraAudits, setExtraAudits] = useState<StudioAudit[]>([]);
  const [auditCursor, setAuditCursor] = useState<string | null>(null);
  useEffect(() => {
    setAuditCursor(project.data?.auditsNextCursor || null);
  }, [project.data?.auditsNextCursor]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [extraVersions, setExtraVersions] = useState<StudioVersion[]>([]);
  const [versionsCursor, setVersionsCursor] = useState<string | null>(null);
  const [proposal, setProposal] = useState<{
    artifact: StudioArtifact;
    operationId: string;
  } | null>(null);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalSummary, setProposalSummary] = useState("");
  const [proposalHook, setProposalHook] = useState("");
  const [proposalDirection, setProposalDirection] = useState("");
  const [profileStyle, setProfileStyle] =
    useState<Partial<StudioProfileSettings> | null>(null);
  const profilePreferencesRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (profileStyle && chosenStage === "brief") {
      profilePreferencesRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [profileStyle, chosenStage]);
  const operation = useStudioOperation(
    projectId,
    project.data?.activeOperations.map((item) => item.id),
    () => {
      void project.refresh();
    },
  );
  const trackedKey = operation.trackedIds.join("|");
  useEffect(() => {
    // Reviews are pruned with the operations they belong to.
    const tracked = trackedKey.split("|");
    setEditReviews((previous) =>
      Object.keys(previous).every((id) => tracked.includes(id))
        ? previous
        : Object.fromEntries(Object.entries(previous).filter(([id]) => tracked.includes(id))),
    );
  }, [trackedKey]);
  useEffect(() => {
    setVersionsCursor(project.data?.versionsNextCursor || null);
  }, [project.data?.versionsNextCursor]);
  const proposalHeading = useRef<HTMLHeadingElement>(null);
  const proposalTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // A suggestion opens below the page: bring it into view and focus it, then
    // return focus to what opened it when it closes.
    if (proposal) {
      proposalHeading.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      proposalHeading.current?.focus({ preventScroll: true });
    } else if (proposalTrigger.current) {
      const trigger = proposalTrigger.current;
      proposalTrigger.current = null;
      if (trigger.isConnected) trigger.focus();
    }
  }, [proposal]);
  const reviewProposal = (artifact: StudioArtifact, operationId: string) => {
    if (!proposalTrigger.current && document.activeElement instanceof HTMLElement)
      proposalTrigger.current = document.activeElement;
    setProposal({ artifact, operationId });
    if (artifact.kind === "youtube_source") {
      setProposalTitle(artifact.metadata.title);
      setProposalSummary(artifact.metadata.description.slice(0, 3000));
      setProposalHook(project.draft?.creatorHook || "");
      setProposalDirection(project.draft?.visualDirection || "");
    } else if (artifact.kind === "brief_proposal") {
      setProposalTitle(artifact.briefInput.videoTitle);
      setProposalSummary(artifact.briefInput.summary);
      setProposalHook(artifact.briefInput.creatorHook);
      setProposalDirection(artifact.briefInput.visualDirection);
    }
  };
  const run = async (work: () => Promise<unknown>) => {
    setError(null);
    try {
      return await work();
    } catch (failure) {
      setError(studioError(failure));
    }
  };
  // What to do once an action's work has started (also after its changed price is confirmed).
  const afterStart = useRef(new Map<string, (started: StudioOperation) => void>());
  /**
   * One click on a priced button: flush the autosave (so the quote uses the
   * current brief), then quote and start in the same click (useStudioOperation).
   */
  const runAction = async (
    key: string,
    credits: number | null,
    items: (revisionId: string) => StudioQuoteItem[],
    options: { retryOfItemId?: string; retryOf?: string; then?: (started: StudioOperation) => void } = {},
  ) => {
    if (options.then) afterStart.current.set(key, options.then);
    else afterStart.current.delete(key);
    const started = await operation.run({
      key,
      credits,
      retryOf: options.retryOf,
      request: async () => {
        const current = await project.save();
        return {
          items: items(current.currentRevisionId),
          ...(options.retryOfItemId ? { retryOfItemId: options.retryOfItemId } : {}),
        };
      },
    });
    if (started) afterStart.current.get(key)?.(started);
    return started;
  };
  const confirmAction = async (key: string) => {
    const started = await operation.confirm(key);
    if (started) afterStart.current.get(key)?.(started);
    return started;
  };
  const generateCredits = (() => {
    const unit = studioItemCredits(pricing, "generate");
    return unit === null ? null : unit * count;
  })();
  const editCredits = studioItemCredits(pricing, "edit");
  const generateKey = `generate:${count}:${quality}`;
  const generate = (credits: number | null = generateCredits) =>
    runAction(
      generateKey,
      credits,
      (revisionId) =>
        Array.from({ length: count }, (_, index) => ({
          projectId,
          revisionId,
          action: "generate" as const,
          input: { conceptIndex: index, conceptCount: count, quality },
        })),
      // The concepts land on step 2, where their progress is shown.
      { then: () => setStage("choose") },
    );
  /** A free text aid (suggested brief, titles, style): one click, no price. */
  const assist = (key: string, action: "prepare_brief" | "suggest_titles" | "describe_style", input: StudioItemInput) =>
    runAction(key, 0, (revisionId) => [{ projectId, revisionId, action, input }]);
  // A suggested brief requested by an upload has no button of its own: its
  // refusal shows below the source picker with a way to ask again.
  const [preparing, setPreparing] = useState<{ key: string; scriptAssetIds: string[] } | null>(null);
  const prepareBrief = (key: string, scriptAssetIds: string[]) => {
    setPreparing({ key, scriptAssetIds });
    return assist(key, "prepare_brief", { scriptAssetIds });
  };
  const retryCredits = (item: StudioOperationItem) =>
    item.retryMode === "new_preparation"
      ? (() => {
          const unit = studioItemCredits(pricing, "generate");
          return unit === null ? null : unit * (item.input.conceptCount || 1);
        })()
      : studioItemCredits(pricing, item.action, item.input);
  const retry = (item: StudioOperationItem) => {
    const key = `retry:${item.id}`;
    const check = (revisionId: string) => {
      if (revisionId !== item.revisionId) throw new Error(instructionsChanged);
    };
    if (item.retryMode === "new_preparation") {
      const n = item.input.conceptCount || 1;
      return runAction(
        key,
        retryCredits(item),
        (revisionId) => {
          check(revisionId);
          return Array.from({ length: n }, (_, index) => ({
            projectId: item.projectId,
            revisionId: item.revisionId,
            action: "generate" as const,
            input: {
              conceptIndex: index,
              conceptCount: n,
              quality: item.input.quality || "high",
            },
          }));
        },
        { retryOf: item.id },
      );
    }
    return runAction(
      key,
      retryCredits(item),
      (revisionId) => {
        check(revisionId);
        return [
          {
            projectId: item.projectId,
            revisionId: item.revisionId,
            action: item.action,
            input: item.input,
          },
        ];
      },
      { retryOfItemId: item.id },
    );
  };
  const versions = Array.from(new Map([
    ...(project.data?.versions || []),
    ...(project.data?.selectedVersion ? [project.data.selectedVersion] : []),
    ...extraVersions,
  ].map(version => [version.id, version])).values());
  const assetVersions = Array.from(new Map(versions.map(version => [version.assetId, version])).values());
  const { queries: assets } = useStudioAssets(
    assetVersions.map((version) => version.assetId),
    (id) => assetVersions.find((version) => version.assetId === id)?.asset || undefined,
  );
  const concepts: GeneratedConcept[] = versions.map((version, index) => ({
    id: version.id,
    thumbnailUrl: assets[assetVersions.findIndex(asset => asset.assetId === version.assetId)]?.data?.url || "",
    thumbnailPath: "",
    prompt: version.instruction || "",
    conceptName: `Version ${index + 1}`,
    conceptDescription: version.instruction || (version.kind === "import" ? "Your imported thumbnail" : "Saved thumbnail"),
    estimatedCTRScore: 0,
    editing: version.editing || undefined,
  }));
  const serverVersions = project.data?.versions;
  useEffect(() => {
    if (!serverVersions) return;
    const incoming = serverVersions;
    if (seenVersions.current) {
      const delivered = incoming.find(version => !seenVersions.current!.has(version.id));
      if (delivered) { setVersionId(delivered.id); setStage("choose"); }
    }
    seenVersions.current = new Set(incoming.map(version => version.id));
  }, [serverVersions]);
  useEffect(() => {
    if (!entry?.startGeneration || consumedEntry.current || !project.draft || !project.data) return;
    consumedEntry.current = true;
    // This follows the creator's click on "Generate N concepts · X credits" on the shared
    // creation form. Returning from sign-in never sets this flag; consuming it also
    // prevents Back/refresh from repeating it.
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: { ...location.state, studioEntry: { ...entry, startGeneration: false } },
    });
    // The price that button showed; the quote must match it to start without another click.
    const credits = entry.generationCredits === undefined ? generateCredits : entry.generationCredits;
    const short = credits !== null && availableCredits !== undefined && availableCredits < credits;
    // Otherwise the page shows why (credits, a pause, reminders) next to the Generate button.
    if (start.available && !short && project.draft.videoTitle.trim())
      void generate(credits);
  });
  if (project.isPending)
    return (
      <p role="status" className="text-zinc-300">
        Opening your saved project…
      </p>
    );
  if (project.error || !project.data || !project.draft)
    return (
      <div role="alert" className="text-red-300">
        {project.error
          ? <StudioErrorText error={studioError(project.error)} />
          : "Project unavailable."}
        <Link className="ml-3 underline" to="/ai-thumbnails/projects">
          Back to projects
        </Link>
      </div>
    );
  const data = project.data;
  const draft = project.draft;
  const current =
    versions.find(
      (version) => version.id === (versionId || data.selectedVersionId),
    ) || versions[0];
  const parent = current?.parentVersionId
    ? versions.find((version) => version.id === current.parentVersionId)
    : null;
  const orientation = (version: StudioVersion) =>
    version.outputFormat ||
    (version.asset?.width &&
    version.asset.height &&
    version.asset.height > version.asset.width
      ? "portrait"
      : "landscape");
  const comparedIds = compareIds.length
    ? compareIds
    : current
      ? [
          current.id,
          ...versions
            .filter(
              (version) =>
                version.id !== current.id &&
                orientation(version) === orientation(current),
            )
            .slice(0, 2)
            .map((version) => version.id),
        ]
      : [];
  const comparisonVersions = versions.filter((version) =>
    comparedIds.includes(version.id),
  );
  const compareFormat = comparisonVersions[0]
    ? orientation(comparisonVersions[0])
    : null;
  const audits = Array.from(
    new Map(
      [...data.audits, ...extraAudits].map((audit) => [audit.id, audit]),
    ).values(),
  ).filter((audit) => audit.versionId === current?.id);
  // A hidden (archived) project works like any other: starting work restores it.
  const actionsDisabled =
    operation.busy ||
    referencesBusy ||
    project.saving ||
    Boolean(project.saveError);
  const stage =
    chosenStage ||
    entryStage ||
    (versions.length ? "choose" : "brief");
  const currentConcept = concepts.find(concept => concept.id === current?.id);
  const outputFormat = (concept: GeneratedConcept) => orientation(versions.find(version => version.id === concept.id)!) === "portrait" ? "short" as const : "landscape" as const;
  // `choice`: the export the server suggested after EXPORT_TOO_LARGE (one click).
  const download = async (id: string, choice: StudioExportChoice = { format, size: exportSize }) => downloadStudioBlob(
    await thumbnailStudioApi.exportVersion(id, choice.format, choice.size),
    `thumbnail-${id.slice(0, 8)}.${choice.format === "jpeg" ? "jpg" : "png"}`,
  );
  const keep = (id: string) => { void run(() => project.save({ selectedVersionId: id })); };
  // Action keys name the exact request, so a refusal or changed price shows next
  // to the button that asked for it, and never starts a different request.
  const editKey = (versionId: string, target: ThumbnailEditTarget, text: string) =>
    `edit:${versionId}:${target}:${text}`;
  const overlayKey = (versionId: string, text: string) => `overlay:${versionId}:${text}`;
  const correctionKey = (versionId: string, findingIds: string[]) =>
    `correction:${versionId}:${findingIds.join(",")}`;
  /** One click on an edit, text change or correction; its progress then shows next to the image. */
  const startEdit = (
    key: string,
    id: string,
    request: StudioEditRequest,
    input: StudioItemInput,
    action: "edit" | "overlay" = "edit",
  ) => {
    // Keep the image in view on the Refine step: the work shows next to it.
    setVersionId(id);
    setStage("refine");
    return runAction(
      key,
      studioItemCredits(pricing, action),
      (revisionId) => [{ projectId, revisionId, action, input }],
      { then: (started) => setEditReviews((reviews) => ({ ...reviews, [started.id]: { versionId: id, request } })) },
    );
  };
  const edit = (id: string, instruction: string, target: ThumbnailEditTarget, rawText?: string) => {
    if (target === "headline" && rawText !== undefined) {
      project.setDraft({ ...draft, overrides: { ...draft.overrides,
        text: { mode: rawText.trim() ? "exact" : "none", value: rawText.trim() },
      } });
    }
    return startEdit(
      editKey(id, target, rawText ?? instruction),
      id,
      { kind: target, text: rawText ?? instruction },
      { sourceVersionId: id, instruction },
    );
  };
  const overlay = (id: string, text: string) => {
    project.setDraft({ ...draft, overrides: { ...draft.overrides,
      text: { mode: text ? "exact" : "none", value: text },
    } });
    return startEdit(overlayKey(id, text), id, { kind: "overlay", text }, { sourceVersionId: id, text }, "overlay");
  };
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
      onConfirm={() => void confirmAction(key)}
    />
  );
  // The editor's actions: an AI edit with words to send shows what it changes
  // and keeps right above its priced button (spec §8); a text change is free.
  const editAction = (versionId: string) => (action: ThumbnailEditAction) => {
    const request: StudioEditRequest = { kind: action.target, text: action.text };
    return paid(
      action.kind === "overlay" ? overlayKey(versionId, action.text) : editKey(versionId, action.target, action.text),
      {
        label: action.label,
        credits: action.kind === "overlay" ? 0 : editCredits,
        secondary: action.secondary,
        disabled: action.disabled,
        onRun: action.run,
        children:
          action.kind === "edit" && action.text ? (
            <StudioEditSummary brief={data.currentRevision.brief} request={request} />
          ) : undefined,
      },
    );
  };
  // An edit's request: the saved one, or one rebuilt from its input (another tab).
  const editOf = (item: StudioOperation): StudioEditReview | null => {
    const first = item.items[0];
    if (item.items.length !== 1 || !first || (first.action !== "edit" && first.action !== "overlay"))
      return null;
    return (
      editReviews[item.id] || {
        versionId: first.input.sourceVersionId || "",
        request: studioEditRequestFromItem(first),
      }
    );
  };
  // Started work: its progress, result, and a one-click Retry for a failed output.
  const panel = (item: StudioOperation, extra?: React.ReactNode) => {
    const edit = editOf(item);
    return (
    <StudioOperationPanel
      key={item.id}
      operation={item}
      summary={
        edit && !isStudioTerminal(item.state) ? (
          <>
            <StudioEditSummary brief={data.currentRevision.brief} request={edit.request} />
            {extra}
          </>
        ) : undefined
      }
      busy={operation.busy || project.saving}
      renderRetry={(retried) =>
        paid(`retry:${retried.id}`, {
          label: retried.retryMode === "new_preparation" ? "Prepare concepts again" : "Retry",
          credits: retryCredits(retried),
          secondary: true,
          disabled: actionsDisabled,
          onRun: () => void retry(retried),
        })
      }
      onDismiss={(finished) => operation.forget(finished.id)}
      onUseProposal={reviewProposal}
    />
    );
  };
  // A version is on screen as its card in step 2, or as the large image in step 3.
  const versionOnScreen = (id: string) =>
    versions.some((version) => version.id === id) &&
    (stage === "choose" || (stage === "refine" && current?.id === id));
  // Until it finishes, an edit's progress stays next to its image while that
  // image is on screen, and in the list below otherwise.
  const editsNextToImage = operation.operations.flatMap((item) => {
    const edit = editOf(item);
    return edit && !isStudioTerminal(item.state) && versionOnScreen(edit.versionId)
      ? [{ item, versionId: edit.versionId }]
      : [];
  });
  const editPanels = (versionId: string | undefined) =>
    editsNextToImage
      .filter((edit) => edit.versionId === versionId)
      .map((edit) => panel(edit.item));
  const openVersion = (id: string, operationId: string) => {
    setVersionId(id);
    setStage("refine");
    setFocusOperation(operationId);
  };
  const listedPanel = (item: StudioOperation) => {
    const edit = editOf(item);
    const index = edit ? versions.findIndex((version) => version.id === edit.versionId) : -1;
    return panel(
      item,
      edit && index >= 0 && !isStudioTerminal(item.state) && (
        <button
          type="button"
          className="text-sm text-orange-300 underline"
          onClick={() => openVersion(edit.versionId, item.id)}
        >
          Open Version {index + 1} to follow this edit next to it
        </button>
      ),
    );
  };
  const generating = operation.operations.some(
    (item) => !isStudioTerminal(item.state) && item.items.some((entry) => entry.action === "generate"),
  );
  const generateAction = (secondary = false) =>
    paid(generateKey, {
      label: `Generate ${count} concept${count === 1 ? "" : "s"}`,
      credits: generateCredits,
      secondary,
      disabled: actionsDisabled || !draft.videoTitle.trim(),
      onRun: () => void generate(),
      confirmLabel: "Generate",
    });
  const earlierInstructions = (version: StudioVersion) => version.revisionId !== data.currentRevisionId && (
    <p className="text-xs text-amber-200">Made with earlier instructions. Your current brief applies to the next edit.</p>
  );
  const versionInfo = (concept: GeneratedConcept) => {
    const version = versions.find(version => version.id === concept.id)!;
    return <>
      {earlierInstructions(version)}
      <OutputWarnings version={version} checking={checking} />
    </>;
  };
  const steps = [
    { id: "brief" as const, label: "1. Brief", disabled: false },
    { id: "choose" as const, label: "2. Choose", disabled: false },
    { id: "refine" as const, label: "3. Refine", disabled: !current },
  ];
  const saveState = project.saveError
    ? "Not saved — review the message below"
    : project.saving
      ? "Saving…"
      : project.dirty
        ? "Changes waiting to save"
        : "All changes saved";
  const editor = (id: string, concept: GeneratedConcept): ControlledThumbnailEditor => ({
    version: { id, imageUrl: concept.thumbnailUrl, editing: concept.editing },
    onRequestEdit: (_source, instruction, target, rawText) => edit(id, instruction, target, rawText),
    onRequestOverlay: (_source, text) => overlay(id, text),
    pending: operation.busy,
    editCredits,
    renderAction: editAction(id),
  });
  const auditKey = current ? `audit:${current.id}:${includePersonas}` : "";
  return (
    <div className="thumbnail-flow studio-wide mx-auto w-full space-y-5 pb-12 text-white">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-white/[0.08] pb-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Link
            aria-label="Your projects"
            title="Your projects"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            to="/ai-thumbnails/projects"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          {renaming ? (
            <input
              aria-label="Project name"
              autoFocus
              className={`${studioField} max-w-sm py-1.5`}
              defaultValue={data.name}
              maxLength={200}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  event.currentTarget.value = data.name;
                  event.currentTarget.blur();
                }
              }}
              onBlur={(event) => {
                const name = event.target.value.trim();
                setRenaming(false);
                if (name && name !== data.name)
                  void run(() => project.save({ name }));
              }}
            />
          ) : (
            <>
              <p className="truncate text-lg font-semibold">{data.name}</p>
              <button
                type="button"
                aria-label="Rename project"
                title="Rename project"
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setRenaming(true)}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <nav aria-label="Thumbnail creation progress" className="flex items-center gap-1 text-sm">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />}
              <button
                type="button"
                disabled={step.disabled}
                onClick={() => setStage(step.id)}
                aria-current={stage === step.id ? "step" : undefined}
                className={`rounded-lg px-2.5 py-1 transition-colors disabled:opacity-40 ${stage === step.id ? "bg-orange-500/10 text-orange-300" : "text-zinc-400 hover:text-white"}`}
              >
                {step.label}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {/* Autosave: every change to the brief is saved on its own. */}
          <p
            role="status"
            className={`inline-flex items-center gap-1.5 text-xs ${project.saveError ? "text-amber-200" : "text-zinc-400"}`}
          >
            {!project.saveError && !project.saving && !project.dirty && (
              <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
            )}
            {saveState}
          </p>
          <Link
            className={studioCompactButton}
            to={`/ai-thumbnails/projects/batch?projects=${projectId}`}
          >
            Prepare a batch
          </Link>
        </div>
      </header>
      {project.saveError && (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-amber-500/30 p-4 text-amber-200"
        >
          <p>
            <StudioErrorText error={project.saveError} /> Your local instructions are still here.
          </p>
          {project.saveError.code === "PROJECT_CHANGED" ? (
            <div className="flex flex-wrap gap-2">
              <button
                className={studioSecondary}
                onClick={() => run(() => project.reload())}
              >
                Reload server version and discard my changes
              </button>
              <button
                className={studioSecondary}
                onClick={() =>
                  run(async () => {
                    const copied = await project.copy();
                    navigate(`/ai-thumbnails/projects/${copied.id}`);
                  })
                }
              >
                Save my changes as a new project
              </button>
            </div>
          ) : (
            <button
              className={studioSecondary}
              onClick={() => run(() => project.save())}
            >
              Retry save
            </button>
          )}
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 p-3 text-sm text-red-200"
        >
          <StudioErrorText error={error} />
        </p>
      )}
      {operation.queryErrors.map((failure, index) => (
        <p role="alert" key={index} className="text-sm text-amber-200">
          Status could not be refreshed: <StudioErrorText error={failure} /> Leaving this page does not
          cancel accepted work.
        </p>
      ))}
      <div hidden={stage !== "brief"} className="space-y-5">
        <StudioCreditsScope availableCredits={availableCredits}>
          <BriefReview
            onBusyChange={setReferencesBusy}
            value={draft}
            revision={data.currentRevision}
            onChange={project.setDraft}
            onBlur={() => {
              if (project.dirty && !project.saveError)
                void project.save().catch(() => undefined);
            }}
            aside={<>
              <details className="thumbnail-disclosure" open={Boolean(location.search && new URLSearchParams(location.search).get("source") !== "idea")}>
                <summary>Start from a video, script or image</summary>
                <SourcePicker
                  project={data}
                  initialSource={studioEntrySource(
                    new URLSearchParams(location.search).get("source"),
                  )}
                  onSave={() => project.save()}
                  onProposal={reviewProposal}
                  onImage={async (asset) => {
                    const saved = await project.save({
                      sourceAssets: { imageAssetId: asset.id },
                    });
                    // Importing into a hidden project restores it; reload shows that.
                    await thumbnailStudioApi.importVersion(
                      projectId,
                      saved.lockVersion,
                      asset.id,
                    );
                    await project.reload();
                    // The upload was the click: the free suggested brief starts at once.
                    await prepareBrief(`prepare_brief:image:${asset.id}`, []);
                  }}
                  onScript={async (asset) => {
                    await project.save({
                      sourceAssets: { scriptAssetId: asset.id },
                    });
                    await prepareBrief(`prepare_brief:script:${asset.id}`, [asset.id]);
                  }}
                />
                {preparing &&
                  (operation.actions[preparing.key] || operation.working === preparing.key) &&
                  paid(preparing.key, {
                    label: "Prepare a suggested brief",
                    credits: 0,
                    secondary: true,
                    disabled: actionsDisabled,
                    onRun: () => void prepareBrief(preparing.key, preparing.scriptAssetIds),
                  })}
              </details>
              <details ref={profilePreferencesRef} className="thumbnail-disclosure" open={Boolean(profileStyle)}>
                <summary>Channel preferences</summary>
                <ChannelProfilePanel
                  acceptedStyle={profileStyle}
                  onApply={async (profile) => {
                    await project.save({ applyProfile: profile });
                  }}
                  describeAction={(assetId) =>
                    paid(`describe_style:${assetId}`, {
                      label: "Ask for style suggestions",
                      credits: 0,
                      secondary: true,
                      disabled: actionsDisabled,
                      onRun: () => void assist(`describe_style:${assetId}`, "describe_style", { styleAssetId: assetId }),
                    })
                  }
                />
              </details>
            </>}
          />
          {/* The brief's actions stay in reach while the form scrolls. */}
          <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-start gap-3 rounded-2xl border border-white/10 bg-[#111113]/95 p-3 shadow-[0_15px_45px_rgba(0,0,0,.35)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                Concepts
                <div className="w-20">
                  <StudioSelect
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </StudioSelect>
                </div>
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                Quality
                <div className="w-32">
                  <StudioSelect
                    value={quality}
                    onChange={(event) =>
                      setQuality(event.target.value as typeof quality)
                    }
                  >
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                  </StudioSelect>
                </div>
              </label>
            </div>
            <div className="ml-auto flex flex-wrap items-start justify-end gap-2">
              {paid(`suggest_titles:${current?.id || ""}`, {
                label: "Suggest two video titles",
                credits: 0,
                secondary: true,
                disabled: actionsDisabled || !draft.videoTitle.trim(),
                onRun: () =>
                  void assist(`suggest_titles:${current?.id || ""}`, "suggest_titles", {
                    ...(current ? { sourceVersionId: current.id } : {}),
                  }),
              })}
              {generateAction()}
            </div>
          </div>
        </StudioCreditsScope>
      </div>
      <div hidden={stage !== "choose"} className="space-y-5">
        <StudioCreditsScope availableCredits={availableCredits}>
          {!versions.length && (
            <section
              aria-label="Your brief"
              className="max-w-3xl space-y-3 rounded-2xl border border-white/10 p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fa7517]">
                Your brief
              </p>
              <h2 className="text-xl font-semibold">
                {draft.videoTitle || "Untitled video"}
              </h2>
              {draft.summary && (
                <p className="line-clamp-3 text-sm text-zinc-300">
                  {draft.summary}
                </p>
              )}
              <p className="text-xs text-zinc-400">
                {draft.outputFormat === "portrait" ? "9:16" : "16:9"} · {count}{" "}
                concept{count === 1 ? "" : "s"} ·{" "}
                {quality === "high" ? "High" : "Standard"} quality
              </p>
              <div className="flex flex-wrap items-start gap-2">
                <button
                  type="button"
                  className={studioSecondary}
                  onClick={() => setStage("brief")}
                >
                  Edit brief
                </button>
                {!generating && generateAction(true)}
              </div>
              {generating && (
                <p role="status" className="text-xs text-zinc-400">
                  Your concepts are being created. They appear here as soon as
                  they are ready.
                </p>
              )}
            </section>
          )}
          {versions.length > 0 && (
            <GeneratedConceptsGrid
              concepts={concepts}
              detectedNiche={null}
              generationTime={null}
              onClear={() => setStage("brief")}
              controlled={{
                selectedId: data.selectedVersionId || undefined,
                onRefine: concept => { setVersionId(concept.id); setStage("refine"); },
                onSelect: concept => keep(concept.id),
                onDownload: (concept, choice) => download(concept.id, choice),
                getOutputFormat: outputFormat,
                renderVersionInfo: versionInfo,
                // Running edits show next to their card while this step is on screen (next to the large image on Refine).
                renderActions: concept => stage === "choose" && editPanels(concept.id).map(item => <div key={item.key} className="mt-1">{item}</div>),
              }}
            />
          )}
          {assets.some(asset => asset.error) && <p role="alert" className="text-sm text-amber-200">Some previews could not be refreshed. Your saved images can still be downloaded.</p>}
          {versions.length > 0 && (
            <details className="thumbnail-disclosure"><summary>Compare at YouTube size <span className="text-zinc-500">Free</span></summary>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="text-xs text-zinc-300">
                  Preview size
                  <StudioSelect
                    className={studioField}
                    value={width}
                    onChange={(event) =>
                      setWidth(Number(event.target.value) as 160 | 320)
                    }
                  >
                    <option value={320}>320 px</option>
                    <option value={160}>160 px</option>
                  </StudioSelect>
                </label>
                <label className="flex items-center gap-2 pb-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={light}
                    onChange={(event) => setLight(event.target.checked)}
                  />{" "}
                  Light preview
                </label>
              </div>
              <fieldset className="mt-3 space-y-2">
                <legend className="mb-2 text-sm text-zinc-300">
                  Choose up to three versions of the same format to compare
                </legend>
                {versions.map((version, index) => (
                  <div
                    className="flex items-center gap-3 text-sm"
                    key={version.id}
                  >
                    <input
                      aria-label={`Compare version ${index + 1}`}
                      type="checkbox"
                      checked={comparedIds.includes(version.id)}
                      disabled={
                        !comparedIds.includes(version.id) &&
                        (comparedIds.length >= 3 ||
                          Boolean(
                            compareFormat &&
                              orientation(version) !== compareFormat,
                          ))
                      }
                      onChange={(event) =>
                        setCompareIds(
                          event.target.checked
                            ? [...comparedIds, version.id]
                            : comparedIds.filter((id) => id !== version.id),
                        )
                      }
                    />
                    <button
                      className={`${current?.id === version.id ? "text-orange-300" : "text-zinc-300"} underline`}
                      onClick={() => {
                        setVersionId(version.id);
                        if (
                          compareFormat &&
                          orientation(version) !== compareFormat
                        )
                          setCompareIds([version.id]);
                      }}
                    >
                      Version {index + 1} · {orientation(version)} ·{" "}
                      {new Date(version.createdAt).toLocaleString()}
                    </button>
                  </div>
                ))}
              </fieldset>
              <div
                className="mt-3 flex gap-4 overflow-x-auto pb-3"
                tabIndex={0}
                aria-label="Thumbnail versions"
              >
                {comparisonVersions.map((version, index) => (
                  <article key={version.id} className="shrink-0">
                    <button
                      className={`mb-2 rounded-lg border px-3 py-2 text-xs ${current?.id === version.id ? "border-orange-500 text-orange-300" : "border-white/20"}`}
                      aria-pressed={current?.id === version.id}
                      onClick={() => setVersionId(version.id)}
                    >
                      Version {index + 1} · {version.kind}
                      {data.selectedVersionId === version.id
                        ? " · selected"
                        : ""}
                    </button>
                    <ThumbnailPreview
                      version={version}
                      title={draft.videoTitle}
                      width={width}
                      light={light}
                      exportSize={exportSize}
                    />
                  </article>
                ))}
              </div>
              {versionsCursor && (
                <button
                  className={studioSecondary}
                  onClick={() =>
                    run(async () => {
                      const page = await thumbnailStudioApi.versions(
                        projectId,
                        versionsCursor,
                      );
                      setExtraVersions((previous) => [
                        ...previous,
                        ...page.items,
                      ]);
                      setVersionsCursor(page.nextCursor);
                    })
                  }
                >
                  Load older versions
                </button>
              )}
            </details>
          )}
        </StudioCreditsScope>
      </div>
      <div hidden={stage !== "refine"}>
        <StudioCreditsScope availableCredits={availableCredits}>
          {current && currentConcept && (
            <StudioRefineView
              imageUrl={currentConcept.thumbnailUrl}
              alt={currentConcept.conceptName}
              portrait={orientation(current) === "portrait"}
              title={currentConcept.conceptName}
              subtitle={current.instruction}
              onBack={() => setStage("choose")}
              notes={(earlierInstructions(current) || (checking && current.validation)) ? (
                <div className="space-y-2">
                  {earlierInstructions(current)}
                  <OutputWarnings version={current} checking={checking} />
                </div>
              ) : undefined}
              toolbar={<>
                <div className="w-24">
                  <StudioSelect
                    aria-label="File format"
                    value={format}
                    onChange={(event) => setFormat(event.target.value as typeof format)}
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                  </StudioSelect>
                </div>
                <div className="w-40">
                  <StudioSelect
                    aria-label="Size"
                    value={exportSize}
                    onChange={(event) => setExportSize(event.target.value as typeof exportSize)}
                  >
                    <option value="original">Original size</option>
                    <option value="youtube">YouTube size (fit)</option>
                  </StudioSelect>
                </div>
                <StudioDownloadButton onDownload={(choice) => download(current.id, choice)} />
                <button
                  type="button"
                  disabled={data.selectedVersionId === current.id}
                  onClick={() => keep(current.id)}
                  className={`${studioCompactButton} ${data.selectedVersionId === current.id ? "border-emerald-500/30 text-emerald-300" : ""}`}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  {data.selectedVersionId === current.id ? "Selected version" : "Keep this version"}
                </button>
              </>}
              tabs={[
                {
                  id: "text",
                  label: "Text",
                  content: <PreciseThumbnailEditor disabled={actionsDisabled} controlled={{ ...editor(current.id, currentConcept), panel: "text" }} />,
                },
                {
                  id: "change",
                  label: "Change something",
                  content: <PreciseThumbnailEditor disabled={actionsDisabled} controlled={{ ...editor(current.id, currentConcept), panel: "change" }} />,
                },
                {
                  id: "audit",
                  label: "Audit",
                  content: (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start gap-3">
                        {paid(auditKey, {
                          label: "Audit this version",
                          credits: studioItemCredits(pricing, "audit", { includePersonas }),
                          disabled: actionsDisabled,
                          onRun: () =>
                            void runAction(
                              auditKey,
                              studioItemCredits(pricing, "audit", { includePersonas }),
                              (revisionId) => [
                                {
                                  projectId,
                                  revisionId,
                                  action: "audit",
                                  input: { sourceVersionId: current.id, includePersonas },
                                },
                              ],
                            ),
                        })}
                        <label className="flex items-center gap-2 pt-2 text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={includePersonas}
                            onChange={(event) => setPersonas(event.target.checked)}
                          />
                          Include AI persona opinions
                        </label>
                      </div>
                      {audits.map((audit) => (
                        <AuditCorrectionPicker
                          key={audit.id}
                          audit={audit}
                          versionId={current.id}
                          revisionId={data.currentRevisionId}
                          disabled={actionsDisabled || project.dirty}
                          editCredits={editCredits}
                          onApply={(text, ids) =>
                            startEdit(correctionKey(current.id, ids), current.id, { kind: "correction", text }, {
                              sourceVersionId: current.id,
                              instruction: text,
                              selectedFindingIds: ids,
                            })
                          }
                          renderAction={(correction) =>
                            paid(correctionKey(current.id, correction.findingIds), {
                              label: correction.label,
                              credits: editCredits,
                              disabled: correction.disabled,
                              onRun: correction.run,
                              children: correction.instruction ? (
                                <StudioEditSummary
                                  brief={data.currentRevision.brief}
                                  request={{ kind: "correction", text: correction.instruction }}
                                />
                              ) : undefined,
                            })
                          }
                        />
                      ))}
                      {auditCursor && (
                        <button
                          className={studioSecondary}
                          onClick={() =>
                            run(async () => {
                              const page = await thumbnailStudioApi.audits(
                                projectId,
                                auditCursor,
                              );
                              setExtraAudits((previous) => [...previous, ...page.items]);
                              setAuditCursor(page.nextCursor);
                            })
                          }
                        >
                          Load older audits
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
              activity={stage === "refine" && editPanels(current.id).length > 0 && <div className="space-y-3">{editPanels(current.id)}</div>}
              more={<div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {current.parentVersionId && (
                    <button
                      type="button"
                      className={studioCompactButton}
                      onClick={() =>
                        void run(async () => {
                          const parentId = current.parentVersionId!;
                          if (
                            !versions.some((version) => version.id === parentId)
                          ) {
                            let cursor = versionsCursor;
                            while (cursor) {
                              const page = await thumbnailStudioApi.versions(
                                projectId,
                                cursor,
                              );
                              setExtraVersions((previous) => [
                                ...previous,
                                ...page.items,
                              ]);
                              cursor = page.nextCursor;
                              setVersionsCursor(cursor);
                              if (
                                page.items.some(
                                  (version) => version.id === parentId,
                                )
                              )
                                break;
                            }
                          }
                          setVersionId(parentId);
                        })
                      }
                    >
                      Back to previous version · free
                    </button>
                  )}
                  <button
                    type="button"
                    className={studioCompactButton}
                    onClick={() => {
                      setProfileStyle({ styleAssetId: current.assetId });
                      setStage("brief");
                    }}
                  >
                    Use as channel style reference
                  </button>
                </div>
                {parent && (
                  <details className="thumbnail-disclosure">
                    <summary>Compare before and after</summary>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <div>
                        <p className="mb-2 text-xs">Before</p>
                        <ThumbnailPreview
                          version={parent}
                          title={draft.videoTitle}
                          width={width}
                          light={light}
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-xs">After</p>
                        <ThumbnailPreview
                          version={current}
                          title={draft.videoTitle}
                          width={width}
                          light={light}
                        />
                      </div>
                    </div>
                  </details>
                )}
              </div>}
            />
          )}
        </StudioCreditsScope>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {operation.announcement}
      </p>
      <StudioCreditsScope availableCredits={availableCredits}>
        <div aria-label="Ongoing work and results" className="space-y-4">
          {operation.operations
            .filter((item) => !editsNextToImage.some((edit) => edit.item.id === item.id))
            .reverse()
            .map(listedPanel)}
        </div>
      </StudioCreditsScope>
      {proposal && (
        <section
          aria-label="Review suggestion"
          className="max-w-3xl space-y-4 rounded-2xl border border-orange-500/40 bg-[#15100c] p-5"
        >
          <h2 ref={proposalHeading} tabIndex={-1} className="text-lg font-semibold focus:outline-none">
            Review this suggestion
          </h2>
          {(proposal.artifact.kind === "youtube_source" ||
            proposal.artifact.kind === "brief_proposal") && (
            <>
              <p className="text-sm text-zinc-300">
                Read:{" "}
                {studioSourceLabels(
                  proposal.artifact.sourceAvailability.contentsRead,
                ) || "provided instructions"}
                . Transcript:{" "}
                {proposal.artifact.sourceAvailability.transcriptStatus}.
              </p>
              {proposal.artifact.sourceAvailability.limitations.map(
                (text, index) => (
                  <p className="text-xs text-amber-200" key={index}>
                    {text}
                  </p>
                ),
              )}
              <label className="block text-sm">
                Video title
                <input
                  className={studioField}
                  maxLength={500}
                  value={proposalTitle}
                  onChange={(event) => setProposalTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                Summary
                <textarea
                  className={studioField}
                  maxLength={3000}
                  rows={4}
                  value={proposalSummary}
                  onChange={(event) => setProposalSummary(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                What will viewers discover?
                <textarea
                  className={studioField}
                  maxLength={1000}
                  value={proposalHook}
                  onChange={(event) => setProposalHook(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                Visual direction
                <textarea
                  className={studioField}
                  maxLength={3000}
                  value={proposalDirection}
                  onChange={(event) => setProposalDirection(event.target.value)}
                />
              </label>
              <button
                className={studioButton}
                onClick={() =>
                  run(async () => {
                    project.setDraft({
                      ...draft,
                      videoTitle: proposalTitle,
                      summary: proposalSummary,
                      creatorHook: proposalHook,
                      visualDirection: proposalDirection,
                    });
                    await project.save({
                      sourceProposalOperationId: proposal.operationId,
                    });
                    setProposal(null);
                  })
                }
              >
                Use these reviewed details
              </button>
              {proposal.artifact.kind === "youtube_source" &&
                paid(`prepare_brief:youtube:${proposal.operationId}`, {
                  label: "Request a suggested summary",
                  credits: 0,
                  secondary: true,
                  className: "mt-2 space-y-2",
                  disabled: actionsDisabled,
                  onRun: () =>
                    void assist(`prepare_brief:youtube:${proposal.operationId}`, "prepare_brief", {
                      sourceOperationId: proposal.operationId,
                      scriptAssetIds: [],
                    }),
                })}
            </>
          )}
          {proposal.artifact.kind === "title_suggestions" &&
            proposal.artifact.titles.map((title, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/10 p-3"
              >
                <p className="font-medium">{title.title}</p>
                <p className="my-2 text-xs text-zinc-400">
                  {title.explanation}
                </p>
                <button
                  className={studioSecondary}
                  onClick={() => {
                    project.setDraft({ ...draft, videoTitle: title.title });
                    setProposal(null);
                  }}
                >
                  Use this video title
                </button>
              </div>
            ))}
          {proposal.artifact.kind === "style_proposal" && (
            <>
              <p className="text-sm text-zinc-300">
                Suggested colours and text layout
              </p>
              <p className="text-sm text-zinc-400">
                {proposal.artifact.explanation}
              </p>
              <fieldset disabled>
                <StyleFields
                  value={proposal.artifact.settings.style}
                  onChange={() => undefined}
                />
              </fieldset>
              <button
                className={studioButton}
                onClick={() => {
                  if (proposal.artifact.kind === "style_proposal") {
                    setProfileStyle({
                      style: proposal.artifact.settings.style,
                    });
                    setStage("brief");
                    setProposal(null);
                  }
                }}
              >
                Apply to the open profile form for review
              </button>
            </>
          )}
          <button
            className={`${studioSecondary} ml-2`}
            onClick={() => setProposal(null)}
          >
            Close without applying
          </button>
        </section>
      )}
    </div>
  );
}

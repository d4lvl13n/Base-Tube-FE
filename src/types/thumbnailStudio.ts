import type { CreditPricingCatalog, PersonaVotes } from "./ctr";
import type { ThumbnailEditing } from "./thumbnail";
export type StudioRule = "allow" | "forbid";
export interface StudioRules {
  faces: StudioRule;
  logos: StudioRule;
  prices: StudioRule;
  additional: string[];
}
export interface StudioStyle {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  font: "DejaVu Sans" | "DejaVu Serif" | "DejaVu Sans Mono";
  textPosition: "left" | "right" | "top" | "bottom" | "center";
  stroke: boolean;
}
export interface StudioProfileRef {
  id: string;
  version: number;
}
export interface StudioBriefInputV1 {
  schemaVersion: 1;
  videoTitle: string;
  summary: string;
  creatorHook: string;
  visualDirection: string;
  outputFormat: "landscape" | "portrait";
  subjectAssetIds: string[];
  layout:
    | "auto"
    | "comparison"
    | "subject_closeup"
    | "object_hero"
    | "before_after"
    | "scene"
    | "minimal";
  profile: StudioProfileRef | null;
  overrides: {
    language?: string;
    text?: { mode: "exact" | "suggest" | "none"; value: string };
    rules?: Partial<StudioRules>;
    faceAssetId?: string | null;
    logoAssetId?: string | null;
    styleAssetId?: string | null;
  };
  styleOverrides: Partial<StudioStyle>;
}
export interface StudioBrief
  extends Omit<StudioBriefInputV1, "overrides" | "styleOverrides"> {
  language: string;
  text: { mode: "exact" | "suggest" | "none"; value: string };
  rules: StudioRules;
  faceAssetId: string | null;
  logoAssetId: string | null;
  styleAssetId: string | null;
}
export interface StudioProfileSettings {
  language: string;
  rules: StudioRules;
  textMode: "suggest" | "none";
  faceAssetId: string | null;
  logoAssetId: string | null;
  styleAssetId: string | null;
  style: StudioStyle;
}
export interface StudioProfile {
  id: string;
  version: number;
  name: string;
  settings: StudioProfileSettings;
  youtubeChannelId: string | null;
  isDefault: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface StudioSourceContext {
  type: "idea" | "youtube" | "script" | "image" | "channel_audit";
  transcriptStatus: "provided" | "unavailable";
  contentsRead: string[];
  assets?: Array<{
    id: string;
    kind: "image" | "script";
    sha256: string;
    name: string | null;
  }>;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  youtubeChannelId?: string;
  retrievedAt?: string;
  channelAuditOrigin?: {
    auditId: number;
    experimentId: string;
    videoId: string;
    publicText?: string;
  };
}
export interface StudioRevision {
  id: string;
  projectId: string;
  sequence: number;
  briefInput: StudioBriefInputV1;
  brief: StudioBrief;
  resolvedStyle: StudioStyle;
  profileSnapshot:
    | (StudioProfileRef & { name: string; settings: StudioProfileSettings })
    | null;
  sourceContext: StudioSourceContext;
  contextHash: string;
  createdAt: string;
}
export interface StudioProjectSummary {
  selectedVersion?: StudioVersion | null;
  id: string;
  name: string;
  youtubeVideoId: string | null;
  youtubeChannelId: string | null;
  currentRevisionId: string;
  selectedVersionId: string | null;
  lockVersion: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface StudioProject extends StudioProjectSummary {
  currentRevision: StudioRevision;
  versions: StudioVersion[];
  audits: StudioAudit[];
  versionsNextCursor: string | null;
  auditsNextCursor: string | null;
  activeOperations: Array<{
    id: string;
    state: StudioOperationState;
    updatedAt: string;
  }>;
}
export interface StudioVersion {
  outputFormat?: "landscape" | "portrait";
  asset?: StudioAsset | null;
  id: string;
  projectId: string;
  revisionId: string;
  assetId: string;
  parentVersionId: string | null;
  operationItemId: string | null;
  kind: "import" | "generation" | "edit" | "overlay";
  instruction: string | null;
  editing: ThumbnailEditing | null;
  validation: StudioOutputValidation | null;
  validationFeedback?: import("@basetube/api").StudioValidationFeedback[];
  createdAt: string;
}
export interface StudioOutputValidation {
  schemaVersion: 1;
  status: "checked" | "unavailable";
  validatorVersion: string;
  observedText: Array<{ text: string; box?: [number, number, number, number] }>;
  checks: Array<{
    code: string;
    status: "pass" | "warning" | "unknown";
    expected?: string;
    observed?: string;
    explanation: string;
  }>;
}
export interface StudioFinding {
  id: string;
  category:
    | "text"
    | "readability"
    | "composition"
    | "brief_conflict"
    | "title_fit";
  severity: "must_fix" | "consider";
  observation: string;
  creatorImpact: string;
  proposedChange: string;
  preserve: string[];
  evidence: "visible" | "brief_comparison" | "hypothesis";
  box?: [number, number, number, number];
  editable: boolean;
}
export interface StudioAudit {
  id: string;
  projectId: string;
  revisionId: string;
  versionId: string;
  operationItemId: string | null;
  result: {
    schemaVersion: 1;
    versionId: string;
    revisionId: string;
    findings: StudioFinding[];
    strengths: string[];
    limitations: string[];
    personaOpinion?: PersonaVotes;
  };
  createdAt: string;
}
export type StudioAssetPurpose =
  | "subject"
  | "face"
  | "logo"
  | "style"
  | "source_image"
  | "script";
export interface StudioAsset {
  id: string;
  kind: "image" | "script";
  purpose: StudioAssetPurpose;
  originalName: string | null;
  mime: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  sha256: string;
  url: string;
  urlExpiresAt: string;
}
export interface StudioPage<T> {
  items: T[];
  nextCursor: string | null;
}
export type StudioStartUnavailableReason = "paused" | "worker_unavailable";
/** Spec §17.2: capabilities only say whether new work can start; they never choose a product. */
export interface StudioCapabilities {
  operations: {
    available: boolean;
    reason: StudioStartUnavailableReason | null;
  };
  validation: boolean;
  pricing: CreditPricingCatalog;
  limits: {
    conceptsPerProject: number;
    projectsPerBatch: number;
    conceptsPerBatchProject: number;
    outputsPerBatch: number;
    quoteLifetimeSeconds: number;
    textAssistsPer24Hours: number;
    subjectReferences: number;
    imageBytes: number;
    imagePixels: number;
    scriptBytes: number;
    scriptCharacters: number;
  };
}
export type StudioOperationState =
  | "quoted"
  | "expired"
  | "running"
  | "succeeded"
  | "partial"
  | "failed";
export type StudioItemState =
  | "quoted"
  | "queued"
  | "preparing"
  | "dispatching"
  | "finalizing"
  | "outcome_unknown"
  | "succeeded"
  | "failed";
export type StudioAction =
  | "generate"
  | "edit"
  | "overlay"
  | "audit"
  | "prepare_brief"
  | "suggest_titles"
  | "describe_style";
export interface StudioItemInput {
  conceptIndex?: number;
  conceptCount?: number;
  quality?: "standard" | "high";
  sourceVersionId?: string;
  instruction?: string;
  selectedFindingIds?: string[];
  text?: string;
  style?: Partial<StudioStyle>;
  includePersonas?: boolean;
  scriptAssetIds?: string[];
  sourceOperationId?: string;
  styleAssetId?: string;
}
export interface StudioQuoteItem {
  projectId: string;
  revisionId: string;
  action: StudioAction;
  input: StudioItemInput;
}
export interface StudioQuoteInput {
  items: StudioQuoteItem[];
  retryOfItemId?: string;
}
export interface StudioSourceAvailability {
  contentsRead: string[];
  transcriptStatus: "provided" | "unavailable";
  limitations: string[];
}
export type StudioArtifact =
  | { kind: "version"; versionId: string }
  | { kind: "audit"; auditId: string }
  | {
      kind: "brief_proposal";
      briefInput: StudioBriefInputV1;
      sourceContext: StudioSourceContext;
      sourceAvailability: StudioSourceAvailability;
    }
  | {
      kind: "title_suggestions";
      titles: Array<{ title: string; explanation: string }>;
    }
  | {
      kind: "style_proposal";
      settings: StudioProfileSettings;
      explanation: string;
    }
  | {
      kind: "youtube_source";
      projectId: string;
      metadata: {
        videoId: string;
        title: string;
        description: string;
        channelId: string;
        channelTitle: string;
        thumbnailUrl: string;
      };
      sourceAssetId: string | null;
      sourceContext: StudioSourceContext;
      sourceAvailability: StudioSourceAvailability;
    };
export interface StudioOperationItem extends StudioQuoteItem {
  id: string;
  quotedCredits: number;
  actualCredits: number;
  state: StudioItemState;
  artifact: StudioArtifact | null;
  errorCode: string | null;
  retryable: boolean;
  retryMode: "identical_item" | "new_preparation" | null;
  /** The failed item this item retries (a quote with `retryOfItemId`); null otherwise. Absent from older servers. */
  retryOfItemId?: string | null;
  preparedConcept: {
    name?: string;
    description?: string;
    prompt?: string;
    headline?: string;
  } | null;
}
export interface StudioOperation {
  id: string;
  state: StudioOperationState;
  quoteExpiresAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  quotedCredits: number;
  capturedCredits: number;
  releasedCredits: number;
  pricing: CreditPricingCatalog;
  result: Record<string, unknown> | null;
  items: StudioOperationItem[];
}
export interface StudioProjectPatch {
  name?: string;
  briefInput?: StudioBriefInputV1;
  sourceProposalOperationId?: string;
  sourceAssets?: { scriptAssetId?: string; imageAssetId?: string } | null;
  applyProfile?: StudioProfileRef | null;
  selectedVersionId?: string | null;
  archived?: boolean;
}
export const emptyStudioBrief = (): StudioBriefInputV1 => ({
  schemaVersion: 1,
  videoTitle: "",
  summary: "",
  creatorHook: "",
  visualDirection: "",
  outputFormat: "landscape",
  subjectAssetIds: [],
  layout: "auto",
  profile: null,
  overrides: {},
  styleOverrides: {},
});
export const defaultStudioSettings = (): StudioProfileSettings => ({
  language: "en",
  rules: { faces: "allow", logos: "allow", prices: "forbid", additional: [] },
  textMode: "suggest",
  faceAssetId: null,
  logoAssetId: null,
  styleAssetId: null,
  style: {
    primaryColor: "#ffffff",
    secondaryColor: "#111111",
    accentColor: "#fa7517",
    font: "DejaVu Sans",
    textPosition: "bottom",
    stroke: true,
  },
});

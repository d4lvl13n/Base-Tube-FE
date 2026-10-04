interface NicheVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  publishedText?: string;
  url: string;
  durationSeconds?: number | null;
}
interface NicheCompetitorVideo extends NicheVideo {
  channelId: string;
  channelTitle: string;
  channelSubscribers?: number;
}

export interface PublicVideoMetadata extends NicheVideo {
  description: string;
  durationSeconds: number | null;
  publishedAt: string | null;
  likes: number | null;
  comments: number | null;
}
export interface BaselineVideo {
  videoId: string;
  title: string;
  url: string;
  viewCount: number;
  publishedText: string | null;
  publishedAt: string | null;
  approximateAgeDays: number | null;
  proximityDistance?: number;
  durationSeconds: number | null;
}
export interface BaselineProvenance {
  asOf: string;
  candidate: BaselineVideo;
  members: BaselineVideo[];
  excluded: { video: BaselineVideo; reasons: string[] }[];
  selection?: {
    strategy: "age_duration_proximity";
    selectedStage: number | null;
    stages: {
      ageFactor: number;
      durationFactor: number;
      eligibleCount: number;
      ageMinDays: number | null;
      ageMaxDays: number | null;
      durationMinSeconds: number | null;
      durationMaxSeconds: number | null;
    }[];
    maximumPeers: number;
    ageAllowanceDays: number;
    distanceFormula: string;
    expanded: boolean;
  };
  rules: {
    ageDays: { minExclusive: number; maxInclusive: number | null } | null;
    durationSeconds: {
      minExclusive: number;
      maxInclusive: number | null;
    } | null;
    minimumPeers: number;
    minimumMedianViews: number;
    outlierThreshold: number;
    candidateExcluded: true;
    deduplicatedByVideoId: true;
    ageSource: string;
  };
}
export interface ConsistencyCheck {
  videoId: string;
  kind: "music_label_divergence";
  evidence: {
    source: "title" | "thumbnail" | "description" | "music_credit";
    quote: string;
    label: "lofi" | "ambient";
  }[];
  action: string;
}
export interface PublicReference extends NicheCompetitorVideo {
  selection?: {
    viewing: ViewingContext;
    matchedCreatorVideoIds: string[];
    subjectTokens: string[];
    reason: string;
  };
  source: "search" | "related";
  query: string;
  relevance: string;
  durationSeconds: number | null;
  observed: string[];
  transfer?: { aspect: string; evidence: string; limitation: string };
  baseline: {
    medianViews: number | null;
    sampleSize: number;
    ratio: number | null;
    isOutlier: boolean;
    caveat: string;
    provenance?: BaselineProvenance;
  };
}
export interface ThumbnailSnapshot {
  videoId: string;
  sourceUrl: string;
  fetchedAt: string;
  sha256: string;
  sourceSha256: string;
  mime: string;
  byteSize: number;
  width: number;
  height: number;
  assetId?: string;
  inlineDataUrl?: string;
  comparison: {
    status:
      | "changed"
      | "unchanged"
      | "previous_image_unavailable"
      | "first_snapshot";
    previousAuditId?: number;
    previousSha256?: string;
    previousSourceUrl?: string;
    explanation: string;
  };
}
export interface VideoCoverage {
  videoId: string;
  checked: ("title" | "thumbnail" | "description" | "music_credit")[];
  notChecked: {
    source: "description" | "music_credit";
    reason: "not_retrieved" | "not_available";
  }[];
}
export type ViewerIntent =
  | "relax"
  | "solve_task"
  | "choose_product"
  | "discover_options"
  | "understand_topic"
  | "follow_story"
  | "stay_informed"
  | "enjoy_performance"
  | "unknown";
export type EditorialFormat =
  | "scenic_film"
  | "ambient_loop"
  | "task_guide"
  | "ranked_list"
  | "review"
  | "explainer"
  | "conversation"
  | "story"
  | "news_update"
  | "performance"
  | "unknown";
export interface ViewingContext {
  videoId: string;
  intent: ViewerIntent;
  format: EditorialFormat;
  confidence: "high" | "medium" | "low";
  basis: string;
}
export interface ActionAssessment {
  packaging: {
    status:
      | "documented_issue"
      | "possible_improvement"
      | "creative_alternative"
      | "needs_verification";
    reason: string;
  };
  opportunity: {
    status:
      | "correct_now"
      | "test_if_exposure"
      | "monitor_reactivation"
      | "prepare_alternative";
    rationale: string;
    selection: {
      videoId: string;
      whyVideo: string;
      whyNow: string;
      missingInformation: string[];
    }[];
  };
  effort: {
    level: "low" | "medium" | "high";
    reason: string;
    requiredSource: string;
  };
  decisionRule: string;
}
export interface HookCheck {
  decisionId: string;
  target: "thumbnail_text" | "title";
  original: string;
  text: string;
  immediateComprehension: { passed: boolean; reason: string };
  naturalLanguage: { passed: boolean; reason: string };
  contentFidelity: { passed: boolean; reason: string };
  subjectIdentification: { passed: boolean; reason: string };
  evidence: {
    videoId: string;
    source: "title" | "description" | "observation";
    quote: string;
  }[];
}
export interface PublicVideoContext {
  videoId: string;
  title?: string;
  publishedAt: string | null;
  ageDays: number | null;
  durationSeconds: number | null;
  publicViews: number;
  viewing: ViewingContext;
}
export interface ReferenceTracking {
  videoId: string;
  samples: { asOf: string; views: number }[];
  deltaViews: number | null;
  elapsedDays: number | null;
  acceleration: number | null;
}
export interface RecommendationHistory {
  previousAuditId?: number;
  previousAsOf: string;
  reused: boolean;
  reasons: (
    | "new_image"
    | "new_public_data"
    | "changed_goal"
    | "new_references"
    | "creative_alternative"
    | "policy_changed"
  )[];
  entries: {
    kind: "decision" | "editorial";
    previous:
      | PublicDecision
      | NonNullable<PublicReview["editorialTasks"]>[number];
    currentId?: string;
    status: "retained" | "revised" | "not_repeated";
    explanation: string;
  }[];
}
export interface PublicResearch {
  version: "2.2";
  reliabilityVersion?: "1";
  actionVersion?: "2";
  opportunityVersion?: "1";
  inputFingerprint?: string;
  videoContext?: PublicVideoContext[];
  referenceSelection?: {
    inputHash: string;
    contexts: ViewingContext[];
    peerInputHash?: string;
    peerContexts?: ViewingContext[];
    rejected: { videoId: string; title: string; reason: string }[];
  };
  referenceTracking?: ReferenceTracking[];
  publicMomentum?: {
    status:
      | "insufficient_history"
      | "no_corroborated_signal"
      | "corroborated_public_activity";
    creatorVideoIds?: string[];
    referenceIds: string[];
    recentPublicationIds: string[];
    reason: string;
  };
  thumbnailSnapshots?: ThumbnailSnapshot[];
  videoCoverage?: VideoCoverage[];
  visualChecks?: {
    videoId: string;
    status: "rechecked" | "unverified";
    originalObserved: string[];
    checkedObserved: string[];
  }[];
  consistencyChecks?: ConsistencyCheck[];
  asOf: string;
  creatorGoal: string | null;
  channelDescription: string;
  channelTitle?: string;
  channelContext?: {
    subscribers: number;
    videoCount: number;
    totalViews: number;
  };
  metadata: PublicVideoMetadata[];
  queries: string[];
  suggestions: string[];
  references: PublicReference[];
  callsAttempted: number;
  limitations: string[];
}
export interface PublicDecision {
  actionAssessment?: ActionAssessment;
  id: string;
  title: string;
  evidence: { videoId: string; observationIndex: number }[];
  category?:
    | "observable_inconsistency"
    | "composition_adjustment"
    | "creative_exploration";
  observationReliability?: { level: "high" | "medium" | "low"; reason: string };
  counterEvidence?: string;
  performanceEffect?: "unknown";
  metadataEvidence?: {
    videoId: string;
    source: "title" | "description" | "music_credit";
    quote: string;
  }[];
  possibleIssue: string;
  change: string;
  whyPriority: string;
  confidence: { level: "high" | "medium" | "low"; reason: string };
  titleOptions: { title: string; reason: string }[];
  titleUnchangedReason?: string;
  referenceVideoIds: string[];
  referenceLessons: { videoId: string; lesson: string }[];
  experimentId?: string;
  visualPlan?: {
    subject: string;
    composition: string;
    text: string;
    titleContribution: string;
    preserve: string[];
    requiredSource: string;
  };
}
export interface PublicReview {
  goal: { text: string; source: "creator" | "inferred" };
  promise: {
    channel: string;
    titles: string;
    thumbnails: string;
    publicContent: string;
    assessment: string;
  };
  referenceTransfers?: {
    videoId: string;
    aspect: string;
    observationIndexes: number[];
    limitation: string;
  }[];
  strengths: {
    text: string;
    evidence: { videoId: string; observationIndex: number }[];
  }[];
  decisions: PublicDecision[];
  hookChecks?: HookCheck[];
  recommendationHistory?: RecommendationHistory;
  editorialTasks?: {
    actionAssessment?: ActionAssessment;
    id: string;
    title: string;
    evidence: { videoId: string; observationIndex: number }[];
    metadataEvidence: {
      videoId: string;
      source: "title" | "description" | "music_credit";
      quote: string;
    }[];
    instruction: string;
    reason: string;
    completionCheck: string;
  }[];
  packagingApproaches?: {
    id: string;
    name: string;
    referenceVideoIds: string[];
    difference: string;
    applicableUse: string;
    limitation: string;
  }[];
  videoAssessments?: {
    videoId: string;
    status:
      | "no_manifest_issue"
      | "verification_needed"
      | "test_suggested"
      | "optional_exploration";
    checked: VideoCoverage["checked"];
    notChecked: VideoCoverage["notChecked"];
    summary: string;
  }[];
  noIssueVideoIds: string[];
  limitations: string[];
}

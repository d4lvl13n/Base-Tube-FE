// src/types/ctr.ts
// CTR Thumbnail Engine Types

import type { ThumbnailSizePreset } from './thumbnail';

// ============================================================================
// ACCESS TYPES
// ============================================================================

export type UsageMode = 'quota' | 'credits';
export type UsageTier = 'anonymous' | 'free' | 'pro' | 'enterprise';

export interface QuotaInfo {
  used: number;
  limit: number;        // -1 means unlimited
  remaining: number;    // -1 means unlimited
  resetsAt: string;
}

export interface GeneratorQuotaInfo extends QuotaInfo {
  isAnonymous: boolean;
  tier: UsageTier;
  upgradeUrl?: string;
  message?: string;
}

export interface CTRQuotaStatus {
  audit: QuotaInfo;
  generate: QuotaInfo;
  tier: UsageTier;
  isAnonymous: boolean;
  limits: {
    audit: { anonymous: number; free: number; pro: number; enterprise: number };
    generate: { anonymous: number; free: number; pro: number; enterprise: number };
  };
}

export interface CreditInfo {
  balance: number;
  reserved: number;
  available: number;
}

export interface CreditPricingCatalog {
  thumbnail: {
    generatePerImage: number;
    editPerImage: number;
    variationPerImage: number;
  };
  ctr: {
    audit: number;
    auditWithPersonas: number;
    generatePerConcept: number;
  };
}

// A buyable credit pack — matches GET /api/v1/credits/packs items.
export interface CreditPack {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  currency: string;
}

// Matches GET /api/v1/credits/packs
export interface CreditPacksResponse {
  success: boolean;
  data: {
    packs: CreditPack[];
  };
}

// Stripe Checkout session returned by POST /api/v1/credits/checkout.
export interface CreditCheckoutSession {
  sessionId: string;
  url: string;
  pack: CreditPack;
}

// Matches POST /api/v1/credits/checkout
export interface CreditCheckoutResponse {
  success: boolean;
  data: CreditCheckoutSession;
}

// Matches GET /api/v1/credits/balance
export interface CreditBalanceResponse {
  success: boolean;
  data: {
    balance: CreditInfo;
    pricing?: CreditPricingCatalog;
  };
}

// Matches GET /api/v1/credits/ledger entries
export interface CreditLedgerEntry {
  id?: number;
  type?: string;
  balanceDelta: number;
  reservedDelta?: number;
  operation?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface CreditLedgerResponse {
  success: boolean;
  data: {
    balance: CreditInfo;
    pricing?: CreditPricingCatalog;
    entries: CreditLedgerEntry[];
    pagination?: { limit: number; offset: number; hasMore: boolean };
  };
}

export type CTRUsageAccess =
  | {
      mode: 'quota';
      quota: CTRQuotaStatus;
      creditInfo?: undefined;
      pricing?: undefined;
    }
  | {
      mode: 'credits';
      quota?: undefined;
      creditInfo: CreditInfo;
      pricing: CreditPricingCatalog | null;
    };

export type GeneratorUsageAccess =
  | {
      mode: 'quota';
      quotaInfo: GeneratorQuotaInfo;
      creditInfo?: undefined;
      pricing?: undefined;
    }
  | {
      mode: 'credits';
      quotaInfo?: undefined;
      creditInfo: CreditInfo;
      pricing: CreditPricingCatalog | null;
    };

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface ThumbnailHeuristics {
  mobileReadability: number;
  colorContrast: number;
  facePresence: boolean;
  faceEmotion: string | null;
  compositionScore: number;
  textOverlay: boolean;
  brightness: number;
  colorfulness: number;
}

export interface PersonaVote {
  personaName: string;
  personaDescription: string;
  wouldClick: boolean;
  confidence: number;
  reasoning: string;
}

export interface PersonaVotes {
  votes: PersonaVote[];
  aggregateScore: number;
  consensusLevel: 'unanimous' | 'strong' | 'mixed' | 'divided';
}

export interface EstimatedCTR {
  low: number;
  mid: number;
  high: number;
}

export interface ThumbnailAudit {
  overallScore: number;           // 1-10
  confidence: 'low' | 'medium' | 'high';
  heuristics: ThumbnailHeuristics;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  personaVotes?: PersonaVotes;
  detectedNiche: string;
  estimatedCTR?: EstimatedCTR;
}

export interface AuditContext {
  title?: string;
  description?: string;
  niche?: string;
  tags?: string[];
}

export interface AuditRequest {
  imageUrl?: string;
  imageBase64?: string;
  includePersonas?: boolean;
  context?: AuditContext;
}

export interface YouTubeAuditRequest {
  youtubeUrl: string;
  includePersonas?: boolean;
  context?: AuditContext;
}

export interface YouTubeVideoMetadata {
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  viewCount?: number;
  likeCount?: number;
  publishedAt?: string;
}

export interface AuditResponse {
  success: boolean;
  data: {
    audit: ThumbnailAudit;
    auditId: number;           // NEW - Persisted audit ID
    quotaInfo?: QuotaInfo;
    creditInfo?: CreditInfo;
    pricing?: CreditPricingCatalog;
  };
}

export interface YouTubeAuditResponse {
  success: boolean;
  data: {
    audit: ThumbnailAudit;
    auditId: number;           // NEW - Persisted audit ID
    videoMetadata: YouTubeVideoMetadata;
    thumbnailUrl: string;
    quotaInfo?: QuotaInfo;
    creditInfo?: CreditInfo;
    pricing?: CreditPricingCatalog;
  };
}

// ============================================================================
// AUDIT HISTORY TYPES
// ============================================================================

export interface AuditHistoryItem {
  id: number;
  userId: string;
  thumbnailUrl: string;
  youtubeVideoId?: string;
  overallScore: number;
  detectedNiche: string;
  confidence: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface AuditHistoryPagination {
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AuditHistoryResponse {
  success: boolean;
  data: {
    audits: AuditHistoryItem[];
    pagination: AuditHistoryPagination;
  };
}

export interface AuditStats {
  totalAudits: number;
  averageScore: number;
  bestScore: number;
  mostCommonNiche: string | null;
  scoreImprovement: number | null;  // null if only one audit
}

export interface AuditStatsResponse {
  success: boolean;
  data: AuditStats;
}

export interface AuditDetailResponse {
  success: boolean;
  data: {
    audit: ThumbnailAudit;
  };
}

// ============================================================================
// GENERATION TYPES
// ============================================================================

export interface GeneratedConcept {
  id: string;
  thumbnailUrl: string;
  thumbnailPath: string;
  prompt: string;
  conceptName: string;
  conceptDescription: string;
  estimatedCTRScore: number;
  /**
   * The anti-clickbait art-direction strategy that drove this concept's base
   * prompt — key (e.g. 'neo_minimal') + human label (e.g. 'Neo-minimal — one
   * focal point'). Present when concepts come from the "Optimized" strategy
   * engine; optional so older responses stay valid.
   */
  strategy?: { key: string; label: string };
}

// ============================================================================
// BRAND OVERLAY (headline placement) TYPES
// ============================================================================

/** The five negative-space zones the overlay engine can place the headline in. */
export type OverlayTextZone = 'left' | 'right' | 'top' | 'bottom' | 'center';

export interface OverlayTextPlan {
  headline: string;
  subhead?: string;
  zone: OverlayTextZone;
  emphasisWord?: string;
}

export interface ApplyOverlayResponse {
  success: boolean;
  data: {
    thumbnailUrl: string;
  };
}

export interface GenerateRequest {
  title: string;
  description?: string;
  prompt?: string;          // Optimized prompt from audit
  niche?: string;           // 'auto' or specific niche
  textOverlay?: string;
  includeFace?: boolean;
  concepts?: number;        // 1-5, default 3
  quality?: 'low' | 'medium' | 'high';
  size?: ThumbnailSizePreset;
}

export interface CTRGenerationResponse {
  success: boolean;
  data: {
    concepts: GeneratedConcept[];
    detectedNiche: string;
    generationTime: number;
    quotaInfo?: QuotaInfo;
    creditInfo?: CreditInfo;
    pricing?: CreditPricingCatalog;
  };
}

// ============================================================================
// NICHE TYPES
// ============================================================================

export interface NicheOption {
  id: string;
  name: string;
  description: string;
}

export interface NichesResponse {
  success: boolean;
  data: {
    niches: NicheOption[];
  };
}

// ============================================================================
// FACE REFERENCE TYPES
// ============================================================================

export interface FaceReferenceUploadRequest {
  imageBase64: string;
}

export interface FaceReference {
  hasFaceReference: boolean;
  thumbnailUrl?: string;
  faceReferenceKey?: string;
}

export interface FaceReferenceResponse {
  success: boolean;
  data: FaceReference;
}

export interface FaceReferenceUploadResponse {
  success: boolean;
  data: {
    faceReferenceKey: string;
    thumbnailUrl: string;
  };
}

// ============================================================================
// OPTIMIZE PROMPT TYPES
// ============================================================================

export interface OptimizePromptRequest {
  audit: {
    overallScore: number;
    heuristics: Partial<ThumbnailHeuristics>;
    weaknesses: string[];
    suggestions: string[];
    detectedNiche: string;
  };
  context: {
    title: string;
    description?: string;
  };
}

export interface OptimizedPrompt {
  prompt: string;
  improvements: string[];
  originalScore: number;
  estimatedNewScore: number;
  estimatedScoreImprovement: number;
}

export interface OptimizePromptResponse {
  success: boolean;
  data: OptimizedPrompt;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type CTRErrorCode =
  | 'ANONYMOUS_AUDIT_QUOTA_EXCEEDED'
  | 'AUDIT_QUOTA_EXCEEDED'
  | 'GENERATE_QUOTA_EXCEEDED'
  | 'INSUFFICIENT_CREDITS'
  | 'AUTHENTICATION_REQUIRED'
  | 'MISSING_IMAGE'
  | 'MISSING_TITLE'
  | 'INVALID_URL'
  | 'YOUTUBE_API_NOT_CONFIGURED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNKNOWN_ERROR';

export interface CTRError {
  code: CTRErrorCode;
  message: string;
  quota?: QuotaInfo;
}

export interface CTRErrorResponse {
  success: false;
  error: CTRError;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface GenerationProgress {
  status: 'idle' | 'generating' | 'complete' | 'error';
  currentConcept?: number;
  totalConcepts?: number;
  elapsedTime?: number;
  estimatedTotal?: number;
}

export interface AuditProgress {
  status: 'idle' | 'auditing' | 'complete' | 'error';
  includesPersonas: boolean;
  elapsedTime?: number;
}

// ============================================================================
// CHANNEL PACKAGING AUDIT TYPES — V1 (LEGACY)
// Persisted v1 audits (rows written before schemaVersion: 2) still come back
// from GET /ctr/audits/:id tagged `schemaVersion: 1`. They render through a
// minimal legacy view — never crash on them, never silently cast them to v2.
// ============================================================================

/** A single over/under-performing video vs the channel median (views / channelMedian). */
export interface PackagingOutlier {
  videoId?: string;
  title: string;
  views: number;
  ratio: number;
}

/** A title/format cluster correlated with performance (e.g. "listicle" vs "raw match clip"). */
export interface PackagingFormatCluster {
  label: string;
  /** Median views across the videos in this format cluster (backend: medianViews). */
  medianViews: number;
  videoCount: number;
  sampleTitles?: string[];
}

/** Title-hygiene stats across the analyzed set. */
export interface PackagingTitleStats {
  avgWordCount: number;
  overLong?: boolean;
  note?: string;
}

/** Cheap text-only pattern pass over all analyzed videos (spec §2). */
export interface PackagingPattern {
  median: number;
  outliers: PackagingOutlier[];
  formatClusters: PackagingFormatCluster[];
  titleStats: PackagingTitleStats;
  verdict: string;
}

/** A size-band peer used as a "channels your size winning" example (spec §4). */
export interface NicheBenchmarkPeer {
  title: string;
  subscribers: number;
  views: number;
  thumbnailUrl: string;
  /** Public YouTube URLs so the user can open the winning video / channel. */
  videoUrl?: string;
  channelUrl?: string;
  whyItWorks: string;
}

/** Niche benchmark — "winners your size do X, you do Y" (spec §5). */
export interface ChannelNicheBenchmark {
  band: { min: number; max: number };
  winningPatterns: string[];
  examplePeers: NicheBenchmarkPeer[];
  yourGap: string[];
}

/** Per-video packaging critique in the sampled set; each links into the fix flow. */
export interface ChannelAuditPerVideo {
  videoId: string;
  title: string;
  views: number;
  thumbnailUrl: string;
  /** Public YouTube watch URL so the user can open their own video. */
  videoUrl?: string;
  issues: string[];
  fix: string;
  score: number;
}

export type FixImpact = 'high' | 'medium' | 'low';

export interface ChannelPrioritizedFix {
  title: string;
  detail: string;
  impact: FixImpact;
}

/**
 * LEGACY (v1) channel audit. Kept so persisted rows still render.
 * Everything below `headline` is optional in practice on old rows — the legacy
 * view only leans on `headline` + `perVideo[].issues/fix`.
 */
export interface ChannelPackagingAudit {
  /** Absent on the original rows; the backend stamps `1` when it serves them. */
  schemaVersion?: 1;
  channel: {
    title: string;
    subscribers: number;
    niche: string;
    videosAnalyzed: number;
  };
  headline: string;
  performancePattern?: PackagingPattern;
  nicheBenchmark?: ChannelNicheBenchmark;
  perVideo: ChannelAuditPerVideo[];
  prioritizedFixes?: ChannelPrioritizedFix[];
  /** Present but de-emphasized in the UI (spec §5). */
  score?: number;
}

// ============================================================================
// CHANNEL PACKAGING AUDIT TYPES — V2 (FROZEN CONTRACT)
// Mirrors the frozen `ChannelPackagingAuditV2` interface in
// base-be docs/specs/moat-phase-0-1-spec.md ("THE v2 AUDIT CONTRACT").
// Product shape: observed evidence + hedged hypotheses + falsifiable
// experiments. NOT scores, NOT causal claims, NOT winners-vs-you benchmarks.
// Do not add fields here that the backend does not send.
// ============================================================================

/** Connected-mode only. Real numbers from the YouTube Analytics/Reporting APIs. */
export interface ChannelAuditV2VideoMetrics {
  impressions: number | null;
  /** Impression-weighted click-through rate, as a percentage (e.g. 4.2). */
  ctr: number | null;
  averageViewDuration: number | null;
  /** Impression-volume tier — gates how strongly anything may be read into CTR. */
  evidenceStrength: 'insufficient' | 'directional' | 'observational';
  dominantTrafficSource: string | null;
  /** e.g. "below your browse-matched baseline"; null when no valid cohort. */
  baselineDelta: string | null;
}

// ----------------------------------------------------------------------------
// v2.1 — MULTI-SOURCE ANALYTICS (FROZEN ADDITIONS)
// Mirrors "ADDENDUM v2.1 — Multi-source Analytics" in
// base-be docs/specs/moat-phase-0-1-spec.md. ADDITIVE to the v2 contract:
// every v2.1 field is absent on a v2 backend, and the report must degrade to
// the v2 rendering rather than assume them.
//
// Two orthogonal axes the FE must NEVER collapse into one:
//   evidenceStrength — how much CTR evidence exists (impression volume only)
//   trust            — where the number came from (verified vs self-reported)
// A metric can be "observational" AND "self-reported" — render BOTH labels.
// ----------------------------------------------------------------------------

/**
 * How much private analytics this audit actually has. The FE drives depth,
 * badges and CTAs from THIS — not from the legacy `mode`.
 *
 *   preview           — no private analytics at all (craft audit only)
 *   uploaded          — Studio CSV only; every metric self-reported + ranged
 *   connected_partial — OAuth live; impressions/CTR still syncing
 *   connected_full    — verified reporting coverage complete and fresh
 *   hybrid            — some metrics verified, some supplied by an upload
 */
export type AuditDataMode =
  | 'preview'
  | 'uploaded'
  | 'connected_partial'
  | 'connected_full'
  | 'hybrid';

/** Every metric the audit can carry — availability is tracked per key. */
export type AuditMetricKey =
  | 'impressions'
  | 'ctr'
  | 'analyticsViews'
  | 'averageViewDuration'
  | 'averageViewPercentage'
  | 'subscribersGained'
  | 'subscribersGainedPerThousandViews'
  | 'traffic'
  | 'baselineDelta';

/**
 * WHY a metric is (or is not) there. Absence is always explained — the FE never
 * zero-fills and never renders `0` for a metric that is merely absent.
 */
export type MetricAvailability =
  | { state: 'ready'; datasetId: string }
  | { state: 'syncing' }
  | { state: 'not_provided' }
  | {
      state: 'suppressed';
      datasetId: string;
      reason: 'low_impressions' | 'no_valid_cohort' | 'coverage_mismatch';
    }
  | {
      state: 'unavailable';
      reason: 'query_failed' | 'unsupported' | 'invalid_source_data';
    };

/** Provenance of one batch of numbers. Cited by `MetricAvailability.datasetId`. */
export interface MetricDataset {
  id: string;
  source: 'connected' | 'uploaded';
  transport: 'reports_query' | 'reporting_api' | 'studio_csv';
  /** Orthogonal to evidenceStrength — never merged with it. */
  trust: 'verified' | 'self_reported';
  coverage:
    | { kind: 'date_range'; startDate: string; endDate: string } // YYYY-MM-DD
    | { kind: 'lifetime'; startDate: null; endDate: string | null };
  /** ISO timestamp: when this dataset was produced / ingested. */
  asOf: string;
}

/** Per-video metrics, v2.1: the v2 fields plus the multi-source additions. */
export interface PerVideoMetricsV21 extends ChannelAuditV2VideoMetrics {
  /** Views INSIDE the dataset window — never lifetime. Always label the window. */
  analyticsViews: number | null;
  /** Percentage points (e.g. 41.8). */
  averageViewPercentage: number | null;
  subscribersGained: number | null;
  subscribersGainedPerThousandViews: number | null;
  traffic: {
    dominant: string;
    sharePercent: number;
    basis: 'views' | 'impressions';
  } | null;
  datasets: MetricDataset[];
  availability: Record<AuditMetricKey, MetricAvailability>;
}

/** What `perVideo[].metrics` can be: the v2 shape, or the v2.1 superset. */
export type ChannelAuditVideoMetrics =
  | ChannelAuditV2VideoMetrics
  | PerVideoMetricsV21;

/** Narrowing guard — the ONLY sanctioned way to tell v2.1 metrics apart. */
export function isPerVideoMetricsV21(
  metrics: ChannelAuditVideoMetrics | null | undefined
): metrics is PerVideoMetricsV21 {
  const candidate = metrics as PerVideoMetricsV21 | null | undefined;
  return !!candidate && Array.isArray(candidate.datasets) && !!candidate.availability;
}

/** One audited video: what is literally observable + one hedged hypothesis. */
export interface ChannelAuditV2PerVideo {
  videoId: string;
  title: string;
  views: number;
  thumbnailUrl: string;
  videoUrl: string;
  /** Literally visible/countable facts only — no interpretation. */
  observed: string[];
  /** Hedged, never causal ("may", "could"). */
  hypothesis: string;
  /** References `experiments[].id`; null when no experiment covers this video. */
  experimentId: string | null;
  /** v2 shape on a v2 backend; the v2.1 superset once multi-source lands. */
  metrics?: ChannelAuditVideoMetrics;
}

/** A falsifiable test the creator can actually run. */
export interface ChannelAuditV2Experiment {
  id: string;
  title: string;
  hypothesis: string;
  variantBrief: { thumbnail: string; title?: string };
  /** e.g. "YouTube Test & Compare, 2 variants, ≥X impressions". */
  method: string;
  /** 1 = run this first. Never high/medium/low. */
  priority: number;
  videoIds: string[];
}

/** How the swipe-file sample relates to the audited channel's size. */
export interface ChannelAuditV2SwipeSize {
  match: 'size_matched' | 'aspirational' | 'mixed';
  minSubscribers: number;
  maxSubscribers: number;
  /** Human string derived from the structured fields. */
  label: string;
}

export interface ChannelAuditV2SwipeExample {
  title: string;
  channelTitle: string;
  subscribers: number;
  views: number;
  thumbnailUrl: string;
  videoUrl: string;
  channelUrl: string;
  whyInteresting: string;
}

export interface ChannelAuditV2SwipeFile {
  searchQueries: string[];
  size: ChannelAuditV2SwipeSize;
  examples: ChannelAuditV2SwipeExample[];
}

export interface ChannelAuditV2ReviewQueueItem {
  videoId: string;
  title: string;
  views: number;
}

/** Descriptive only — the "upload age not adjusted" caveat is mandatory in the FE. */
export interface ChannelAuditV2ReviewQueue {
  medianViews: number;
  high: ChannelAuditV2ReviewQueueItem[];
  low: ChannelAuditV2ReviewQueueItem[];
}

/**
 * Why this audit is (or is not) in connected mode — an ADDITIVE field the
 * backend only starts sending with MOAT D2. It may be absent on every response
 * until then, so absence must degrade to the plain "connect your channel" CTA.
 *
 *   connected       — a live grant for the audited channel (frozen contract; the
 *                     FE only started seeing it with v2.1's connected modes)
 *   unconnected     — no YouTube grant for this user / channel
 *   mismatched      — a channel IS connected, but a different one was audited
 *   reauth_required — the grant was revoked or expired
 *   syncing         — connected; the first Reporting CSVs have not landed yet
 */
export type ChannelAuditConnectionStatus =
  | 'connected'
  | 'unconnected'
  | 'mismatched'
  | 'reauth_required'
  | 'syncing';

/** The frozen v2 audit contract. */
export interface ChannelPackagingAuditV2 {
  schemaVersion: 2;
  mode: 'preview' | 'connected';
  id?: number;
  channel: {
    title: string;
    subscribers: number;
    niche: string;
    videosAnalyzed: number;
  };
  /** Analyst-inferred read of what the channel is — rendered first. */
  positioning: string;
  /** Sharp but NON-CAUSAL diagnosis. */
  headline: string;
  perVideo: ChannelAuditV2PerVideo[];
  experiments: ChannelAuditV2Experiment[];
  swipeFile: ChannelAuditV2SwipeFile;
  reviewQueue: ChannelAuditV2ReviewQueue;
  /** Connected mode only. */
  analyticsStatus?: 'syncing' | 'ready' | 'reauth_required';
  /** Additive (MOAT D2). Absent on older backends — never rely on it existing. */
  connectionStatus?: ChannelAuditConnectionStatus;
  /**
   * Additive (MOAT v2.1). When present it — not `mode` — drives report depth,
   * badges and CTAs. Absent = a pre-v2.1 backend: fall back to `mode`.
   */
  dataMode?: AuditDataMode;
}

/** What the audit endpoints can hand back today: the new report, or a legacy row. */
export type ChannelAuditResult = ChannelPackagingAuditV2 | ChannelPackagingAudit;

/** Narrowing guard — the ONLY sanctioned way to tell the two apart. */
export function isChannelAuditV2(
  audit: ChannelAuditResult | null | undefined
): audit is ChannelPackagingAuditV2 {
  return !!audit && (audit as ChannelPackagingAuditV2).schemaVersion === 2;
}

/** POST /api/v1/ctr/channel-audit request body. */
export interface ChannelAuditRequest {
  channelUrl: string;
}

/** POST /api/v1/ctr/channel-audit success envelope. */
export interface ChannelAuditResponse {
  success: true;
  data: ChannelAuditResult;
}

/**
 * One line of the audit history (GET /api/v1/ctr/channel-audit) — light on
 * purpose: enough to render a list row and re-open the audit, never the report.
 */
export interface ChannelAuditSummary {
  id: number;
  /** What the user originally pasted — reused verbatim for a re-run. */
  channelRef: string;
  channelId: string;
  channelTitle: string | null;
  subscribers: number | null;
  videosAnalyzed: number | null;
  niche: string;
  schemaVersion: 1 | 2;
  mode: string | null;
  dataMode: AuditDataMode | null;
  createdAt: string | null;
}

// ============================================================================
// STUDIO ANALYTICS IMPORT (MOAT v2.1, M2)
//
// PROVISIONAL SHAPES. The v2.1 addendum freezes the STORAGE model
// (`yt_studio_imports` / `yt_studio_import_rows`) and the parser rules, but it
// does not spell out the HTTP request/response bodies. These types are derived
// from those two, one-for-one, and are the FE's read of the contract:
//
//   POST /api/v1/ctr/analytics-import/analyze        (multipart: file)
//   POST /api/v1/ctr/analytics-import/:id/confirm    (mapping + coverage + locale)
//   GET  /api/v1/ctr/analytics-import/latest         (?channelId=)
//
// The endpoints may not exist yet — every caller degrades on 404.
// ============================================================================

/** Our canonical column names — mirrors the `yt_studio_import_rows` columns. */
export type AnalyticsImportField =
  | 'videoId'
  | 'impressions'
  | 'ctrPercent'
  | 'views'
  | 'averageViewDurationSeconds'
  | 'averageViewPercentage'
  | 'subscribersGained';

/** A column the parser found in the uploaded CSV. */
export interface AnalyticsImportDetectedColumn {
  /** The header exactly as it appears in the file. */
  header: string;
  /** Zero-based position in the header row. */
  index: number;
  /** A couple of values, so the user can recognise the column. */
  sampleValues?: string[];
  /**
   * What the alias registry matched, if anything. `null` = no confident match;
   * the user has to map it (or leave it unmapped).
   */
  suggestedField?: AnalyticsImportField | null;
}

/**
 * our field → COLUMN INDEX (zero-based). Index — not header text — is the
 * identity: two identical "Views" headers stay distinguishable. An explicit
 * `null` CLEARS an auto-detected column ("don't import this"); a field simply
 * absent inherits the backend's detection, so every rendered field must be
 * submitted (index or null) for the user's screen to be authoritative.
 */
export type AnalyticsImportMapping = Partial<Record<AnalyticsImportField, number | null>>;

/** The backend's supported number-format locales. NO silent default — the user confirms. */
export type AnalyticsImportLocale = 'en' | 'fr' | 'de' | 'es';

/**
 * The window the numbers describe. MANDATORY user confirmation — an unlabeled
 * range is never accepted (v2.1 CSV parser rules, LOCKED).
 */
export type AnalyticsImportCoverage =
  | { kind: 'date_range'; startDate: string; endDate: string } // YYYY-MM-DD
  | { kind: 'lifetime' };

/** What the parser thinks the range is — a PREFILL, never an assumption. */
export interface AnalyticsImportDetectedCoverage {
  kind: 'date_range' | 'lifetime' | 'unknown';
  startDate?: string | null;
  endDate?: string | null;
  /** Where the guess came from, e.g. "filename", "date column", "export header". */
  source?: string | null;
}

/** POST /analyze — what the parser made of the file. Nothing is committed yet. */
export interface AnalyticsImportAnalysis {
  importId: string;
  status: 'needs_confirmation' | 'ready' | 'rejected';
  /** True when at least one required column could not be matched confidently. */
  needsMapping: boolean;
  detectedColumns: AnalyticsImportDetectedColumn[];
  /** Best-effort mapping from the alias registry — the user confirms or edits it. */
  suggestedMapping: AnalyticsImportMapping;
  detectedCoverage: AnalyticsImportDetectedCoverage;
  /** Detected decimal/locale convention, e.g. "en-US" / "fr-FR". */
  detectedLocale?: string | null;
  rowCount: number;
  /** Non-fatal notes: ignored footer rows, unknown columns, etc. */
  warnings?: string[];
  /** Present when `status === 'rejected'` (duplicate video IDs, bad quoting…). */
  rejectionReason?: string | null;
}

/**
 * POST /:id/confirm — the user's confirmed mapping + range + NUMBER FORMAT.
 * `/confirm` is a DRY RUN: it validates, returns the review numbers and a
 * single-use `validationToken`, and writes NOTHING. POST /:id/commit with that
 * token performs the actual import.
 */
export interface AnalyticsImportConfirmRequest {
  mapping: AnalyticsImportMapping;
  coverage: AnalyticsImportCoverage;
  /** REQUIRED, user-confirmed. There is no silent default — 4,3 vs 4.3 is 1000×. */
  locale: AnalyticsImportLocale;
}

/**
 * Returned by BOTH /confirm (dry run, `committed: false`, importedAt null) and
 * /commit (`committed: true`). `units` come from the backend — never derived.
 */
export interface AnalyticsImportResult {
  importId: string;
  status: 'pending' | 'ready' | 'rejected';
  /** false = dry run (nothing written); true = the rows are in. */
  committed: boolean;
  /** Present on the dry run only — hand it back to commitAnalyticsImport. */
  validationToken?: string;
  matchedRows: number;
  rejectedRows: number;
  coverage: AnalyticsImportCoverage;
  /** ISO timestamp of the WRITE. Null on the dry run — nothing was written. */
  importedAt: string | null;
  /** Authoritative from the backend, e.g. { ctrPercent: 'percentage_points' }. */
  units?: Partial<Record<AnalyticsImportField, string>>;
  /** Per-row problems worth showing, e.g. "3 rows had no resolvable video ID". */
  rejectionSamples?: string[];
  rejectionReason?: string | null;
}

/** GET /latest — the import currently backing this channel's audit, if any. */
export interface AnalyticsImportSummary extends AnalyticsImportResult {
  youtubeChannelId?: string | null;
  /** Backend-computed staleness, when it offers one. The FE can also derive it. */
  isStale?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ScoreColor = 'green' | 'yellow' | 'orange' | 'red';

export type ScoreLabel = 
  | 'Exceptional'
  | 'Excellent'
  | 'Good'
  | 'Above Average'
  | 'Average'
  | 'Below Average'
  | 'Needs Improvement'
  | 'Poor';

export type ConsensusIcon = '🎯' | '👍' | '🤔' | '⚖️' | '❓';

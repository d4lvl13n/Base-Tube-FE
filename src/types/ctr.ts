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
// CHANNEL PACKAGING AUDIT TYPES
// Mirrors the backend `ChannelPackagingAudit` contract
// (docs/specs/channel-packaging-audit-spec.md §5) returned by
// POST /api/v1/ctr/channel-audit. No CTR is part of this contract — the
// benchmark signal is views-relative-to-subscribers only.
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

/** The hero-feature response contract (spec §5). */
export interface ChannelPackagingAudit {
  channel: {
    title: string;
    subscribers: number;
    niche: string;
    videosAnalyzed: number;
  };
  headline: string;
  performancePattern: PackagingPattern;
  nicheBenchmark: ChannelNicheBenchmark;
  perVideo: ChannelAuditPerVideo[];
  prioritizedFixes: ChannelPrioritizedFix[];
  /** Present but de-emphasized in the UI (spec §5). */
  score?: number;
}

/** POST /api/v1/ctr/channel-audit request body. */
export interface ChannelAuditRequest {
  channelUrl: string;
}

/** POST /api/v1/ctr/channel-audit success envelope. */
export interface ChannelAuditResponse {
  success: true;
  data: ChannelPackagingAudit;
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

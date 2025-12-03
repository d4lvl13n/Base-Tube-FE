// src/types/ctr.ts
// CTR Thumbnail Engine Types

// ============================================================================
// QUOTA TYPES
// ============================================================================

export interface QuotaInfo {
  used: number;
  limit: number;        // -1 means unlimited
  remaining: number;    // -1 means unlimited
  resetsAt: string;
}

export interface CTRQuotaStatus {
  audit: QuotaInfo;
  generate: QuotaInfo;
  tier: 'anonymous' | 'free' | 'pro' | 'enterprise';
  isAnonymous: boolean;
  limits: {
    audit: { anonymous: number; free: number; pro: number; enterprise: number };
    generate: { anonymous: number; free: number; pro: number; enterprise: number };
  };
}

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
}

export interface GenerateRequest {
  title: string;
  description?: string;
  niche?: string;           // 'auto' or specific niche
  textOverlay?: string;
  includeFace?: boolean;
  concepts?: number;        // 1-5, default 3
  quality?: 'low' | 'medium' | 'high';
  size?: '1024x1024' | '1536x1024' | '1024x1536';
}

export interface CTRGenerationResponse {
  success: boolean;
  data: {
    concepts: GeneratedConcept[];
    detectedNiche: string;
    generationTime: number;
    quotaInfo?: QuotaInfo;
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


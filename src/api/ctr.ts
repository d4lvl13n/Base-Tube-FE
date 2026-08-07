// src/api/ctr.ts
// CTR Thumbnail Engine API Service

import api from './index';
import {
  AuditRequest,
  AuditResponse,
  YouTubeAuditRequest,
  YouTubeAuditResponse,
  GenerateRequest,
  CTRGenerationResponse,
  NichesResponse,
  FaceReference,
  FaceReferenceUploadResponse,
  CTRErrorResponse,
  OptimizePromptRequest,
  OptimizePromptResponse,
  OptimizedPrompt,
  OverlayTextPlan,
  ApplyOverlayResponse,
  AuditHistoryResponse,
  AuditHistoryItem,
  AuditStats,
  AuditStatsResponse,
  AuditDetailResponse,
  ThumbnailAudit,
  AuditContext,
  CTRUsageAccess,
  ChannelAuditResult,
  ChannelAuditRequest,
  ChannelAuditResponse,
  AnalyticsImportAnalysis,
  AnalyticsImportConfirmRequest,
  AnalyticsImportCoverage,
  AnalyticsImportField,
  AnalyticsImportMapping,
  AnalyticsImportResult,
  AnalyticsImportSummary,
} from '../types/ctr';
import { normalizeUsageAccessResponse } from '../utils/usageAccess';

const CTR_BASE_PATH = '/api/v1/ctr';

/**
 * Thrown (as an Error message) when a Studio-import endpoint answers 404 — i.e.
 * backend M2 is not deployed. Callers show "not available yet", never an error.
 */
export const ANALYTICS_IMPORT_UNAVAILABLE = 'ANALYTICS_IMPORT_UNAVAILABLE';

/**
 * CTR Thumbnail Engine API Service
 * 
 * Provides endpoints for:
 * - Thumbnail auditing (CTR score analysis)
 * - CTR-optimized thumbnail generation
 * - Face reference management
 * - Quota tracking
 */
export const ctrApi = {
  // ============================================================================
  // QUOTA
  // ============================================================================

  /**
   * Fetch current quota status for CTR operations
   * Works for both anonymous and authenticated users
   */
  getQuota: async (): Promise<CTRUsageAccess> => {
    const response = await api.get(
      `${CTR_BASE_PATH}/quota`
    );
    
    if (!response.data.success) {
      throw new Error((response.data as unknown as CTRErrorResponse).error.message);
    }

    const normalized = normalizeUsageAccessResponse(response.data) as CTRUsageAccess | null;
    if (!normalized) {
      throw new Error('Failed to normalize CTR access response');
    }

    return normalized;
  },

  // ============================================================================
  // AUDIT
  // ============================================================================

  /**
   * Audit a thumbnail by URL or base64 image
   * Works for anonymous users (3/day) and authenticated users (10-unlimited/day)
   * 
   * @param request - Image URL, base64, or context for audit
   * @returns Audit results with CTR score, strengths, weaknesses, and suggestions
   */
  auditThumbnail: async (request: AuditRequest): Promise<AuditResponse['data']> => {
    const response = await api.post<AuditResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/audit`,
      request
    );
    
    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
    
    return (response.data as AuditResponse).data;
  },

  /**
   * Audit a thumbnail directly from a YouTube video URL
   * Automatically extracts the thumbnail and video metadata
   * 
   * @param youtubeUrl - YouTube video URL (various formats supported)
   * @param includePersonas - Whether to include persona voting analysis (adds ~3s)
   * @returns Audit results plus video metadata
   */
  auditYouTubeThumbnail: async (
    youtubeUrl: string,
    includePersonas: boolean = false,
    context?: AuditContext
  ): Promise<YouTubeAuditResponse['data']> => {
    const response = await api.post<YouTubeAuditResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/audit/youtube`,
      { youtubeUrl, includePersonas, context } as YouTubeAuditRequest
    );
    
    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
    
    return (response.data as YouTubeAuditResponse).data;
  },

  // ============================================================================
  // CHANNEL PACKAGING AUDIT (the hero feature)
  // ============================================================================

  /**
   * Run a full channel packaging audit.
   *
   * Paste a channel URL / @handle → the backend observes the last ~15-20
   * thumbnails + titles, records what is literally there, and returns hedged
   * hypotheses plus falsifiable experiments (`ChannelPackagingAuditV2`).
   *
   * The response is a UNION: freshly-run audits are v2 (`schemaVersion: 2`);
   * audits persisted before the v2 contract come back as legacy v1 rows.
   * Callers MUST narrow with `isChannelAuditV2()` — never cast.
   *
   * Auth optional: 1 free audit, then credit-costed (`channel.audit`).
   *
   * @param channelUrl - Channel URL, @handle, or channel id
   * @returns The full packaging audit report (v2, or a legacy v1 row)
   */
  auditChannel: async (channelUrl: string): Promise<ChannelAuditResult> => {
    const response = await api.post<ChannelAuditResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/channel-audit`,
      { channelUrl } as ChannelAuditRequest
    );

    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }

    return (response.data as ChannelAuditResponse).data;
  },

  // ============================================================================
  // AUDIT HISTORY & STATS
  // ============================================================================

  /**
   * Get user's audit history with pagination
   * Requires authentication
   * 
   * @param limit - Number of audits to return (max 100, default 20)
   * @param offset - Pagination offset (default 0)
   * @returns List of audit history items with pagination info
   */
  getAuditHistory: async (
    limit: number = 20,
    offset: number = 0
  ): Promise<{ audits: AuditHistoryItem[]; pagination: AuditHistoryResponse['data']['pagination'] }> => {
    const response = await api.get<AuditHistoryResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/audits`,
      { params: { limit: Math.min(limit, 100), offset } }
    );
    
    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
    
    return (response.data as AuditHistoryResponse).data;
  },

  /**
   * Get user's audit statistics
   * Requires authentication
   * 
   * @returns Aggregated stats including total audits, average score, best score, etc.
   */
  getAuditStats: async (): Promise<AuditStats> => {
    const response = await api.get<AuditStatsResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/audits/stats`
    );
    
    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
    
    return (response.data as AuditStatsResponse).data;
  },

  /**
   * Get a specific audit by ID
   * Authentication optional (returns audit if user owns it or if anonymous)
   * 
   * @param auditId - The ID of the audit to retrieve
   * @returns Full audit details
   */
  getAuditById: async (auditId: number): Promise<ThumbnailAudit> => {
    const response = await api.get<AuditDetailResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/audits/${auditId}`
    );
    
    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
    
    return (response.data as AuditDetailResponse).data.audit;
  },

  // ============================================================================
  // GENERATION
  // ============================================================================

  /**
   * Generate CTR-optimized thumbnail concepts
   * Requires authentication
   * 
   * @param request - Generation parameters including title, niche, etc.
   * @returns Array of generated concept thumbnails with scores
   */
  generateThumbnails: async (
    request: GenerateRequest
  ): Promise<CTRGenerationResponse['data']> => {
    const response = await api.post<CTRGenerationResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/generate`,
      request
    );
    
    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
    
    return (response.data as CTRGenerationResponse).data;
  },

  // ============================================================================
  // BRAND OVERLAY (headline placement)
  // ============================================================================

  /**
   * Composite a real headline (+ optional subhead) onto an already generated
   * base image, in one of the five negative-space zones, using the user's Brand
   * Kit. FREE for now (no credit metering). Requires authentication.
   *
   * @param baseImageUrl - The generated concept's image URL (http/https)
   * @param textPlan - Headline, optional subhead, zone, optional emphasis word
   * @returns The signed URL of the composited thumbnail
   */
  applyOverlay: async (
    baseImageUrl: string,
    textPlan: OverlayTextPlan
  ): Promise<ApplyOverlayResponse['data']> => {
    const response = await api.post<ApplyOverlayResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/overlay`,
      { baseImageUrl, textPlan }
    );

    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }

    return (response.data as ApplyOverlayResponse).data;
  },

  // ============================================================================
  // OPTIMIZE PROMPT
  // ============================================================================

  /**
   * Generate an optimized prompt based on audit results
   * Uses the audit weaknesses and suggestions to create a better prompt
   * 
   * @param request - Audit data and context for optimization
   * @returns Optimized prompt with estimated score improvement
   */
  optimizePrompt: async (request: OptimizePromptRequest): Promise<OptimizedPrompt> => {
    const response = await api.post<OptimizePromptResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/optimize-prompt`,
      request
    );
    
    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
    
    return (response.data as OptimizePromptResponse).data;
  },

  // ============================================================================
  // NICHES
  // ============================================================================

  /**
   * Fetch available niche presets for CTR optimization
   * Public endpoint - no authentication required
   */
  getNiches: async (): Promise<NichesResponse['data']['niches']> => {
    const response = await api.get<NichesResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/niches`
    );
    
    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
    
    return (response.data as NichesResponse).data.niches;
  },

  // ============================================================================
  // FACE REFERENCE
  // ============================================================================

  /**
   * Upload a face reference image for personalized thumbnails
   * Requires authentication
   * 
   * @param imageBase64 - Base64 encoded image data
   * @returns Face reference key and thumbnail URL
   */
  uploadFaceReference: async (
    imageBase64: string
  ): Promise<FaceReferenceUploadResponse['data']> => {
    const response = await api.post<FaceReferenceUploadResponse | CTRErrorResponse>(
      `${CTR_BASE_PATH}/face-reference`,
      { imageBase64 }
    );
    
    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
    
    return (response.data as FaceReferenceUploadResponse).data;
  },

  /**
   * Get current user's face reference
   * Requires authentication
   * 
   * @returns Face reference info or null if not set
   */
  getFaceReference: async (): Promise<FaceReference | null> => {
    try {
      const response = await api.get<{ success: boolean; data: FaceReference } | CTRErrorResponse>(
        `${CTR_BASE_PATH}/face-reference`
      );
      
      if (!response.data.success) {
        throw new Error((response.data as CTRErrorResponse).error.message);
      }
      
      return (response.data as { success: boolean; data: FaceReference }).data;
    } catch (error: any) {
      // 404 means no face reference exists
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Delete current user's face reference
   * Requires authentication
   */
  deleteFaceReference: async (): Promise<void> => {
    const response = await api.delete<{ success: boolean } | CTRErrorResponse>(
      `${CTR_BASE_PATH}/face-reference`
    );

    if (!response.data.success) {
      throw new Error((response.data as CTRErrorResponse).error.message);
    }
  },

  // ============================================================================
  // STUDIO ANALYTICS IMPORT (MOAT v2.1, M2)
  //
  // The self-reported half of the two-source story: a creator who does not want
  // to connect OAuth exports their Studio CSV instead and gets the same report
  // depth, labelled self-reported and bounded by a range THEY confirm.
  //
  // These endpoints ship with backend M2. Until they are deployed the calls 404
  // — every method below turns that into a benign "not available yet" instead of
  // an error banner, so the upload CTA can be shipped independently.
  // ============================================================================

  /**
   * Upload a YouTube Studio CSV export for parsing. NOTHING is committed here:
   * the response describes what the parser saw so the user can confirm the
   * column mapping and — mandatory — the date range.
   *
   * @throws Error('ANALYTICS_IMPORT_UNAVAILABLE') when the backend has no such
   *         route yet (404), so the caller can show "not available yet".
   */
  analyzeAnalyticsImport: async (file: File): Promise<AnalyticsImportAnalysis> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<
        { success: true; data: BackendAnalyzeResponse } | CTRErrorResponse
      >(`${CTR_BASE_PATH}/analytics-import/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.success) {
        throw new Error((response.data as CTRErrorResponse).error.message);
      }

      // ADAPTER: the backend speaks snake_case fields + column INDICES; the FE
      // model speaks camelCase fields + header STRINGS. Translate at the boundary
      // and remember the header order per importId so /confirm can translate back.
      const raw = (response.data as { success: true; data: BackendAnalyzeResponse }).data;
      return adaptAnalyzeResponse(raw);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new Error(ANALYTICS_IMPORT_UNAVAILABLE);
      }
      throw new Error(
        error?.response?.data?.error?.message ||
          error?.message ||
          'Could not read that export. Please try again.'
      );
    }
  },

  /**
   * Commit an analysed import with the user's CONFIRMED mapping and coverage.
   * `coverage` is mandatory by contract — an unlabeled range is never stored.
   */
  confirmAnalyticsImport: async (
    importId: string,
    payload: AnalyticsImportConfirmRequest
  ): Promise<AnalyticsImportResult> => {
    try {
      const response = await api.post<
        { success: true; data: BackendConfirmResponse } | CTRErrorResponse
      >(
        `${CTR_BASE_PATH}/analytics-import/${encodeURIComponent(importId)}/confirm`,
        adaptConfirmRequest(importId, payload)
      );

      if (!response.data.success) {
        throw new Error((response.data as CTRErrorResponse).error.message);
      }

      const raw = (response.data as { success: true; data: BackendConfirmResponse }).data;
      return adaptConfirmResponse(raw);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new Error(ANALYTICS_IMPORT_UNAVAILABLE);
      }
      throw new Error(
        error?.response?.data?.error?.message ||
          error?.message ||
          'Could not save that import. Please try again.'
      );
    }
  },

  /**
   * COMMIT an import the dry run validated. This is the only call that writes:
   * it requires the single-use `validationToken` from confirmAnalyticsImport.
   * Closing the modal without calling this leaves ZERO imported rows.
   */
  commitAnalyticsImport: async (
    importId: string,
    validationToken: string
  ): Promise<AnalyticsImportResult> => {
    try {
      const response = await api.post<
        { success: true; data: BackendConfirmResponse } | CTRErrorResponse
      >(`${CTR_BASE_PATH}/analytics-import/${encodeURIComponent(importId)}/commit`, {
        validationToken,
      });

      if (!response.data.success) {
        throw new Error((response.data as CTRErrorResponse).error.message);
      }

      const raw = (response.data as { success: true; data: BackendConfirmResponse }).data;
      return adaptConfirmResponse(raw);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new Error(ANALYTICS_IMPORT_UNAVAILABLE);
      }
      throw new Error(
        error?.response?.data?.error?.message ||
          error?.message ||
          'Could not finish that import. Please review it again.'
      );
    }
  },

  /**
   * The import currently backing a channel's audit, if any. Used for the
   * staleness / re-upload prompt.
   *
   * Returns null for BOTH "no import yet" and "endpoint not deployed" — the
   * caller only ever needs to know whether there is something to show.
   */
  latestAnalyticsImport: async (
    channelId?: string
  ): Promise<AnalyticsImportSummary | null> => {
    try {
      const response = await api.get<
        { success: true; data: BackendLatestSummary | null } | CTRErrorResponse
      >(`${CTR_BASE_PATH}/analytics-import/latest`, {
        params: channelId ? { channelId } : undefined,
      });

      if (!response.data.success) return null;

      const raw =
        (response.data as { success: true; data: BackendLatestSummary | null }).data ?? null;
      return raw ? adaptLatestSummary(raw) : null;
    } catch (error: any) {
      // 404 = no import for this channel, or the route does not exist yet.
      // Either way there is nothing to show.
      if (error?.response?.status === 404) return null;
      throw error;
    }
  },
};

// ============================================================================
// STUDIO IMPORT — BACKEND↔FE CONTRACT ADAPTER
//
// The backend (M2) speaks snake_case canonical fields and maps columns by
// INDEX; the FE model (M3) speaks camelCase fields and maps by HEADER string.
// Everything is translated here, at the API boundary, so neither side leaks
// into the other. The header order for each analyzed import is remembered in a
// module-scoped map (session-lived — a stepper flow never outlives the page).
// ============================================================================

const FIELD_TO_BACKEND: Record<AnalyticsImportField, string> = {
  videoId: 'video_id',
  impressions: 'impressions',
  ctrPercent: 'ctr_percent',
  views: 'views',
  averageViewDurationSeconds: 'average_view_duration_seconds',
  averageViewPercentage: 'average_view_percentage',
  subscribersGained: 'subscribers_gained',
};
const FIELD_FROM_BACKEND: Record<string, AnalyticsImportField> = Object.fromEntries(
  Object.entries(FIELD_TO_BACKEND).map(([fe, be]) => [be, fe as AnalyticsImportField])
);

/** Backend /analyze payload (M2's AnalyzeUploadResult). */
interface BackendAnalyzeResponse {
  importId: number;
  status: string; // 'pending_mapping' | 'pending_confirmation'
  needsMapping: boolean;
  detectedMapping: Record<string, number>; // snake field → column index
  mappingSource?: string;
  headers: string[];
  ambiguousColumns?: { index: number; header: string; candidates?: string[] }[];
  unmappedColumns?: { index: number; header: string }[];
  recognizedButUnused?: { index: number; header: string }[];
  detectedLocale?: string | null;
  totalDataRows: number;
  sampleRows?: { videoId: string | null; title: string | null; values: Record<string, string> }[];
  draftExpiresInSeconds?: number;
}

interface BackendConfirmResponse {
  importId: number;
  status: string; // 'pending' (dry run) | 'imported' (commit)
  committed: boolean;
  validationToken?: string;
  datasetId?: string;
  youtubeChannelId?: string | null;
  coverage: AnalyticsImportCoverage;
  locale?: string;
  matchedRows: number;
  rejectedRows: number;
  footerRowsIgnored?: number;
  providedMetrics?: string[];
  units?: Record<string, string>;
  effectiveMapping?: Record<string, number>;
  importedAt?: string | null;
  validatedAt?: string;
  rejectionBreakdown?: Record<string, number>;
}

interface BackendLatestSummary {
  importId: number;
  datasetId?: string;
  youtubeChannelId?: string | null;
  coverage: AnalyticsImportCoverage;
  locale?: string;
  matchedRows: number;
  rejectedRows: number;
  importedAt: string;
  stale?: boolean;
  staleReason?: string | null;
}

/** headers + locale remembered per analyzed import (analyze-time context). */
const importTranslationCtx = new Map<string, { headers: string[]; locale: string | null }>();

/**
 * Strict locale narrowing — review HIGH-4: there is NO silent 'en' fallback. A
 * wrong number format corrupts counts by 1000×, so an unsupported/absent locale
 * throws and the UI must make the user pick.
 */
const toBackendLocale = (locale: string | null | undefined): string => {
  const two = String(locale || '').slice(0, 2).toLowerCase();
  if (!['en', 'fr', 'de', 'es'].includes(two)) {
    throw new Error('Confirm the number format of the export before importing.');
  }
  return two;
};

function adaptAnalyzeResponse(raw: BackendAnalyzeResponse): AnalyticsImportAnalysis {
  const importId = String(raw.importId);
  importTranslationCtx.set(importId, {
    headers: raw.headers || [],
    locale: raw.detectedLocale ?? null,
  });

  // field → COLUMN INDEX (the FE model's identity — header text is display-only).
  const suggestedMapping: AnalyticsImportMapping = {};
  for (const [beField, idx] of Object.entries(raw.detectedMapping || {})) {
    const feField = FIELD_FROM_BACKEND[beField];
    if (feField && Number.isInteger(idx)) suggestedMapping[feField] = idx;
  }

  const indexToSuggested: Record<number, AnalyticsImportField | null> = {};
  for (const [beField, idx] of Object.entries(raw.detectedMapping || {})) {
    indexToSuggested[idx] = FIELD_FROM_BACKEND[beField] ?? null;
  }

  const detectedColumns = (raw.headers || []).map((header, index) => ({
    header,
    index,
    sampleValues: (raw.sampleRows || [])
      .map((r) => r.values?.[header])
      .filter((v): v is string => typeof v === 'string')
      .slice(0, 3),
    suggestedField: indexToSuggested[index] ?? null,
  }));

  const warnings: string[] = [];
  if (raw.recognizedButUnused?.length) {
    warnings.push(
      `Ignored (not imported): ${raw.recognizedButUnused.map((c) => c.header).join(', ')}`
    );
  }
  if (raw.unmappedColumns?.length) {
    warnings.push(`Unrecognized columns: ${raw.unmappedColumns.map((c) => c.header).join(', ')}`);
  }

  return {
    importId,
    status: 'needs_confirmation', // both backend draft states require the stepper
    needsMapping: raw.needsMapping,
    detectedColumns,
    suggestedMapping,
    // The backend never guesses a range — confirmation is mandatory by contract.
    detectedCoverage: { kind: 'unknown' },
    detectedLocale: raw.detectedLocale ?? null,
    rowCount: raw.totalDataRows,
    warnings: warnings.length ? warnings : undefined,
  };
}

function adaptConfirmRequest(
  _importId: string,
  payload: AnalyticsImportConfirmRequest
): Record<string, unknown> {
  // Review MED (duplicate headers) + HIGH-6 (explicit clears): the FE model now
  // speaks COLUMN INDICES directly — no header→index lookup, so two identical
  // headers stay distinguishable — and every rendered field is submitted, with
  // `null` as an explicit clear the backend honors.
  const mapping: Record<string, number | null> = {};
  for (const [feField, idx] of Object.entries(payload.mapping || {})) {
    const beField = FIELD_TO_BACKEND[feField as AnalyticsImportField];
    if (!beField) continue;
    mapping[beField] = idx === null ? null : Number(idx);
  }
  return {
    mapping: Object.keys(mapping).length ? mapping : undefined,
    coverage: payload.coverage,
    // Strict: throws on unsupported/absent — the UI requires an explicit pick.
    locale: toBackendLocale(payload.locale),
  };
}

/** Backend snake_case units → FE camelCase fields. Authoritative — never derived. */
function adaptUnits(
  raw: Record<string, string> | undefined
): Partial<Record<AnalyticsImportField, string>> | undefined {
  if (!raw) return undefined;
  const units: Partial<Record<AnalyticsImportField, string>> = {};
  for (const [beField, unit] of Object.entries(raw)) {
    const feField = FIELD_FROM_BACKEND[beField];
    if (feField) units[feField] = unit;
  }
  return Object.keys(units).length ? units : undefined;
}

function adaptConfirmResponse(raw: BackendConfirmResponse): AnalyticsImportResult {
  const rejectionSamples = Object.entries(raw.rejectionBreakdown || {})
    .filter(([, n]) => n > 0)
    .map(([reason, n]) => `${n} row${n === 1 ? '' : 's'}: ${reason.replace(/_/g, ' ')}`);
  return {
    importId: String(raw.importId),
    status: raw.committed ? 'ready' : 'pending',
    committed: !!raw.committed,
    validationToken: raw.validationToken,
    matchedRows: raw.matchedRows,
    rejectedRows: raw.rejectedRows,
    coverage: raw.coverage,
    // Authoritative server time — null on the dry run (nothing was written).
    importedAt: raw.importedAt ?? null,
    units: adaptUnits(raw.units),
    rejectionSamples: rejectionSamples.length ? rejectionSamples : undefined,
  };
}

function adaptLatestSummary(raw: BackendLatestSummary): AnalyticsImportSummary {
  return {
    importId: String(raw.importId),
    status: 'ready',
    committed: true,
    matchedRows: raw.matchedRows,
    rejectedRows: raw.rejectedRows,
    coverage: raw.coverage,
    importedAt: raw.importedAt,
    youtubeChannelId: raw.youtubeChannelId ?? null,
    isStale: raw.stale,
    staleReason: raw.staleReason ?? null,
  } as AnalyticsImportSummary;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert a File to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validate YouTube URL format
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
    /^(https?:\/\/)?youtu\.be\/[\w-]+/,
  ];
  return patterns.some((pattern) => pattern.test(url));
};

/**
 * Get color for score display
 */
export const getScoreColor = (score: number): 'green' | 'yellow' | 'orange' | 'red' => {
  if (score >= 8) return 'green';
  if (score >= 6) return 'yellow';
  if (score >= 4) return 'orange';
  return 'red';
};

/**
 * Get label for score display
 */
export const getScoreLabel = (score: number): string => {
  if (score >= 9) return 'Exceptional';
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 6) return 'Above Average';
  if (score >= 5) return 'Average';
  if (score >= 4) return 'Below Average';
  if (score >= 3) return 'Needs Improvement';
  return 'Poor';
};

/**
 * Get consensus icon for persona voting
 */
export const getConsensusIcon = (level: string): string => {
  switch (level) {
    case 'unanimous': return '🎯';
    case 'strong': return '👍';
    case 'mixed': return '🤔';
    case 'divided': return '⚖️';
    default: return '❓';
  }
};

/**
 * Format quota limit for display
 */
export const formatQuotaLimit = (limit: number): string => {
  return limit === -1 ? '∞' : String(limit);
};

export default ctrApi;

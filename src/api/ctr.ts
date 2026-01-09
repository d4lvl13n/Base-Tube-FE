// src/api/ctr.ts
// CTR Thumbnail Engine API Service

import api from './index';
import {
  CTRQuotaStatus,
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
  AuditHistoryResponse,
  AuditHistoryItem,
  AuditStats,
  AuditStatsResponse,
  AuditDetailResponse,
  ThumbnailAudit,
} from '../types/ctr';

const CTR_BASE_PATH = '/api/v1/ctr';

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
  getQuota: async (): Promise<CTRQuotaStatus> => {
    const response = await api.get<{ success: boolean; data: CTRQuotaStatus }>(
      `${CTR_BASE_PATH}/quota`
    );
    
    if (!response.data.success) {
      throw new Error((response.data as unknown as CTRErrorResponse).error.message);
    }
    
    return response.data.data;
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
};

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


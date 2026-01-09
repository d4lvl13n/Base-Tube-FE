// src/hooks/useCTREngine.ts
// CTR Thumbnail Engine Hook

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthMethod } from '../types/auth';
import { ctrApi, fileToBase64 } from '../api/ctr';
import {
  CTRQuotaStatus,
  ThumbnailAudit,
  YouTubeVideoMetadata,
  GeneratedConcept,
  NicheOption,
  FaceReference,
  AuditContext,
  GenerateRequest,
  AuditProgress,
  GenerationProgress,
  CTRErrorCode,
  AuditHistoryItem,
  AuditStats,
} from '../types/ctr';

// ============================================================================
// TYPES
// ============================================================================

interface UseCTREngineReturn {
  // Quota
  quota: CTRQuotaStatus | null;
  isLoadingQuota: boolean;
  refreshQuota: () => Promise<void>;
  
  // Audit
  auditResult: ThumbnailAudit | null;
  auditId: number | null;           // NEW - Persisted audit ID
  auditThumbnailUrl: string | null; // NEW - Thumbnail URL from audit
  youtubeMetadata: YouTubeVideoMetadata | null;
  auditProgress: AuditProgress;
  auditByUrl: (imageUrl: string, includePersonas?: boolean, context?: AuditContext) => Promise<void>;
  auditByFile: (file: File, includePersonas?: boolean, context?: AuditContext) => Promise<void>;
  auditByYouTube: (youtubeUrl: string, includePersonas?: boolean) => Promise<void>;
  clearAuditResult: () => void;
  
  // Audit History & Stats
  auditHistory: AuditHistoryItem[];
  auditHistoryPagination: { hasMore: boolean; offset: number } | null;
  isLoadingAuditHistory: boolean;
  auditStats: AuditStats | null;
  isLoadingAuditStats: boolean;
  loadAuditHistory: (limit?: number, offset?: number, reset?: boolean) => Promise<void>;
  loadAuditStats: () => Promise<void>;
  loadAuditById: (id: number) => Promise<ThumbnailAudit | null>;
  
  // Generation
  generatedConcepts: GeneratedConcept[];
  detectedNiche: string | null;
  generationTime: number | null;
  generationProgress: GenerationProgress;
  generateThumbnails: (request: GenerateRequest) => Promise<void>;
  clearGeneratedConcepts: () => void;
  
  // Niches
  niches: NicheOption[];
  isLoadingNiches: boolean;
  loadNiches: () => Promise<void>;
  
  // Face Reference
  faceReference: FaceReference | null;
  isLoadingFaceReference: boolean;
  isUploadingFaceReference: boolean;
  loadFaceReference: () => Promise<void>;
  uploadFaceReference: (file: File) => Promise<void>;
  deleteFaceReference: () => Promise<void>;
  
  // Error handling
  error: string | null;
  errorCode: CTRErrorCode | null;
  clearError: () => void;
  
  // Auth state
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export const useCTREngine = (): UseCTREngineReturn => {
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const { isAuthenticated: isWeb3Authenticated } = useAuth();
  
  // Determine auth method and overall auth status
  const authMethod = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_method') as AuthMethod 
    : null;
  const isAuthLoaded = authMethod === AuthMethod.WEB3 ? true : isClerkLoaded;
  
  // Quota state
  const [quota, setQuota] = useState<CTRQuotaStatus | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);
  
  // Audit state
  const [auditResult, setAuditResult] = useState<ThumbnailAudit | null>(null);
  const [auditId, setAuditId] = useState<number | null>(null);
  const [auditThumbnailUrl, setAuditThumbnailUrl] = useState<string | null>(null);
  const [youtubeMetadata, setYoutubeMetadata] = useState<YouTubeVideoMetadata | null>(null);
  const [auditProgress, setAuditProgress] = useState<AuditProgress>({
    status: 'idle',
    includesPersonas: false,
  });
  
  // Audit History & Stats state
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);
  const [auditHistoryPagination, setAuditHistoryPagination] = useState<{ hasMore: boolean; offset: number } | null>(null);
  const [isLoadingAuditHistory, setIsLoadingAuditHistory] = useState(false);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [isLoadingAuditStats, setIsLoadingAuditStats] = useState(false);
  
  // Generation state
  const [generatedConcepts, setGeneratedConcepts] = useState<GeneratedConcept[]>([]);
  const [detectedNiche, setDetectedNiche] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    status: 'idle',
  });
  
  // Niches state
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [isLoadingNiches, setIsLoadingNiches] = useState(false);
  
  // Face reference state
  const [faceReference, setFaceReference] = useState<FaceReference | null>(null);
  const [isLoadingFaceReference, setIsLoadingFaceReference] = useState(false);
  const [isUploadingFaceReference, setIsUploadingFaceReference] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<CTRErrorCode | null>(null);
  
  // Track if initial load has happened
  const hasLoadedQuota = useRef(false);
  const hasLoadedNiches = useRef(false);
  
  // ============================================================================
  // COMPUTED
  // ============================================================================
  
  // Check both Clerk and Web3 authentication
  const isAuthenticated = authMethod === AuthMethod.WEB3 
    ? isWeb3Authenticated 
    : (isClerkLoaded && isSignedIn === true);
  const isAnonymous = authMethod === AuthMethod.WEB3 
    ? !isWeb3Authenticated 
    : (isClerkLoaded && isSignedIn === false);
  
  // ============================================================================
  // ERROR HANDLING
  // ============================================================================
  
  const handleError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    setError(message);
    
    // Extract error code if present
    if (message.includes('QUOTA_EXCEEDED')) {
      if (message.includes('ANONYMOUS')) {
        setErrorCode('ANONYMOUS_AUDIT_QUOTA_EXCEEDED');
      } else if (message.includes('AUDIT')) {
        setErrorCode('AUDIT_QUOTA_EXCEEDED');
      } else if (message.includes('GENERATE')) {
        setErrorCode('GENERATE_QUOTA_EXCEEDED');
      }
    } else if (message.includes('AUTHENTICATION_REQUIRED') || message.includes('authentication')) {
      setErrorCode('AUTHENTICATION_REQUIRED');
    } else if (message.includes('RATE_LIMIT')) {
      setErrorCode('RATE_LIMIT_EXCEEDED');
    } else {
      setErrorCode('UNKNOWN_ERROR');
    }
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);
  
  // ============================================================================
  // QUOTA
  // ============================================================================
  
  const refreshQuota = useCallback(async () => {
    if (!isAuthLoaded) return;
    
    setIsLoadingQuota(true);
    try {
      const quotaData = await ctrApi.getQuota();
      setQuota(quotaData);
    } catch (err) {
      console.error('Failed to fetch CTR quota:', err);
      handleError(err);
    } finally {
      setIsLoadingQuota(false);
    }
  }, [isAuthLoaded, handleError]);
  
  // Load quota on mount and auth change
  useEffect(() => {
    if (isAuthLoaded && !hasLoadedQuota.current) {
      hasLoadedQuota.current = true;
      refreshQuota();
    }
  }, [isAuthLoaded, refreshQuota]);
  
  // Refresh quota when auth state changes
  useEffect(() => {
    if (isAuthLoaded && hasLoadedQuota.current) {
      refreshQuota();
    }
  }, [isAuthenticated, isAuthLoaded, refreshQuota]);
  
  // ============================================================================
  // AUDIT
  // ============================================================================
  
  const auditByUrl = useCallback(async (
    imageUrl: string,
    includePersonas: boolean = false,
    context?: AuditContext
  ) => {
    clearError();
    setAuditProgress({ status: 'auditing', includesPersonas: includePersonas });
    setYoutubeMetadata(null);
    setAuditId(null);
    setAuditThumbnailUrl(imageUrl);
    
    const startTime = Date.now();
    
    try {
      const result = await ctrApi.auditThumbnail({
        imageUrl,
        includePersonas,
        context,
      });
      
      setAuditResult(result.audit);
      setAuditId(result.auditId);  // Store the persisted audit ID
      setAuditProgress({
        status: 'complete',
        includesPersonas: includePersonas,
        elapsedTime: Date.now() - startTime,
      });
      
      // Update quota if returned
      if (result.quotaInfo) {
        setQuota((prev) => prev ? { ...prev, audit: result.quotaInfo! } : null);
      } else {
        await refreshQuota();
      }
    } catch (err) {
      handleError(err);
      setAuditProgress({
        status: 'error',
        includesPersonas: includePersonas,
        elapsedTime: Date.now() - startTime,
      });
    }
  }, [clearError, handleError, refreshQuota]);
  
  const auditByFile = useCallback(async (
    file: File,
    includePersonas: boolean = false,
    context?: AuditContext
  ) => {
    clearError();
    setAuditProgress({ status: 'auditing', includesPersonas: includePersonas });
    setYoutubeMetadata(null);
    setAuditId(null);
    setAuditThumbnailUrl(null);  // File uploads don't have a URL initially
    
    const startTime = Date.now();
    
    try {
      const base64 = await fileToBase64(file);
      const result = await ctrApi.auditThumbnail({
        imageBase64: base64,
        includePersonas,
        context,
      });
      
      setAuditResult(result.audit);
      setAuditId(result.auditId);  // Store the persisted audit ID
      setAuditProgress({
        status: 'complete',
        includesPersonas: includePersonas,
        elapsedTime: Date.now() - startTime,
      });
      
      if (result.quotaInfo) {
        setQuota((prev) => prev ? { ...prev, audit: result.quotaInfo! } : null);
      } else {
        await refreshQuota();
      }
    } catch (err) {
      handleError(err);
      setAuditProgress({
        status: 'error',
        includesPersonas: includePersonas,
        elapsedTime: Date.now() - startTime,
      });
    }
  }, [clearError, handleError, refreshQuota]);
  
  const auditByYouTube = useCallback(async (
    youtubeUrl: string,
    includePersonas: boolean = false,
    context?: AuditContext
  ) => {
    clearError();
    setAuditProgress({ status: 'auditing', includesPersonas: includePersonas });
    setAuditId(null);
    setAuditThumbnailUrl(null);
    
    const startTime = Date.now();
    
    try {
      const result = await ctrApi.auditYouTubeThumbnail(youtubeUrl, includePersonas, context);
      
      setAuditResult(result.audit);
      setAuditId(result.auditId);  // Store the persisted audit ID
      setAuditThumbnailUrl(result.thumbnailUrl);  // Store the thumbnail URL
      setYoutubeMetadata(result.videoMetadata);
      setAuditProgress({
        status: 'complete',
        includesPersonas: includePersonas,
        elapsedTime: Date.now() - startTime,
      });
      
      if (result.quotaInfo) {
        setQuota((prev) => prev ? { ...prev, audit: result.quotaInfo! } : null);
      } else {
        await refreshQuota();
      }
    } catch (err) {
      handleError(err);
      setAuditProgress({
        status: 'error',
        includesPersonas: includePersonas,
        elapsedTime: Date.now() - startTime,
      });
    }
  }, [clearError, handleError, refreshQuota]);
  
  const clearAuditResult = useCallback(() => {
    setAuditResult(null);
    setAuditId(null);
    setAuditThumbnailUrl(null);
    setYoutubeMetadata(null);
    setAuditProgress({ status: 'idle', includesPersonas: false });
  }, []);
  
  // ============================================================================
  // AUDIT HISTORY & STATS
  // ============================================================================
  
  /**
   * Load audit history with pagination
   * @param limit - Number of items to load (default 20)
   * @param offset - Offset for pagination (default 0)
   * @param reset - If true, replaces history; if false, appends to existing
   */
  const loadAuditHistory = useCallback(async (
    limit: number = 20,
    offset: number = 0,
    reset: boolean = true
  ) => {
    if (!isAuthenticated) return;
    
    setIsLoadingAuditHistory(true);
    try {
      const result = await ctrApi.getAuditHistory(limit, offset);
      
      if (reset) {
        setAuditHistory(result.audits);
      } else {
        // Append for infinite scroll
        setAuditHistory(prev => [...prev, ...result.audits]);
      }
      
      setAuditHistoryPagination({
        hasMore: result.pagination.hasMore,
        offset: result.pagination.offset + result.audits.length,
      });
    } catch (err) {
      console.error('Failed to load audit history:', err);
      handleError(err);
    } finally {
      setIsLoadingAuditHistory(false);
    }
  }, [isAuthenticated, handleError]);
  
  /**
   * Load audit statistics
   */
  const loadAuditStats = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingAuditStats(true);
    try {
      const stats = await ctrApi.getAuditStats();
      setAuditStats(stats);
    } catch (err) {
      console.error('Failed to load audit stats:', err);
      handleError(err);
    } finally {
      setIsLoadingAuditStats(false);
    }
  }, [isAuthenticated, handleError]);
  
  /**
   * Load a specific audit by ID
   * @param id - Audit ID to load
   * @returns The audit details or null if not found
   */
  const loadAuditById = useCallback(async (id: number): Promise<ThumbnailAudit | null> => {
    try {
      const audit = await ctrApi.getAuditById(id);
      return audit;
    } catch (err) {
      console.error('Failed to load audit by ID:', err);
      handleError(err);
      return null;
    }
  }, [handleError]);
  
  // ============================================================================
  // GENERATION
  // ============================================================================
  
  const generateThumbnails = useCallback(async (request: GenerateRequest) => {
    if (!isAuthenticated) {
      setError('Please sign in to generate thumbnails');
      setErrorCode('AUTHENTICATION_REQUIRED');
      return;
    }
    
    clearError();
    const conceptCount = request.concepts || 3;
    setGenerationProgress({
      status: 'generating',
      totalConcepts: conceptCount,
      currentConcept: 0,
    });
    
    const startTime = Date.now();
    
    // Simulate progress updates (actual generation is single request)
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => ({
        ...prev,
        elapsedTime: Date.now() - startTime,
        estimatedTotal: conceptCount * 15000, // ~15s per concept estimate
      }));
    }, 1000);
    
    try {
      const result = await ctrApi.generateThumbnails(request);
      
      clearInterval(progressInterval);
      
      setGeneratedConcepts(result.concepts);
      setDetectedNiche(result.detectedNiche);
      setGenerationTime(result.generationTime);
      setGenerationProgress({
        status: 'complete',
        totalConcepts: conceptCount,
        currentConcept: conceptCount,
        elapsedTime: Date.now() - startTime,
      });
      
      if (result.quotaInfo) {
        setQuota((prev) => prev ? { ...prev, generate: result.quotaInfo! } : null);
      } else {
        await refreshQuota();
      }
    } catch (err) {
      clearInterval(progressInterval);
      handleError(err);
      setGenerationProgress({
        status: 'error',
        elapsedTime: Date.now() - startTime,
      });
    }
  }, [isAuthenticated, clearError, handleError, refreshQuota]);
  
  const clearGeneratedConcepts = useCallback(() => {
    setGeneratedConcepts([]);
    setDetectedNiche(null);
    setGenerationTime(null);
    setGenerationProgress({ status: 'idle' });
  }, []);
  
  // ============================================================================
  // NICHES
  // ============================================================================
  
  const loadNiches = useCallback(async () => {
    if (niches.length > 0) return; // Already loaded
    
    setIsLoadingNiches(true);
    try {
      const nichesData = await ctrApi.getNiches();
      setNiches(nichesData);
    } catch (err) {
      console.error('Failed to load niches:', err);
      // Don't set error for this - it's not critical
    } finally {
      setIsLoadingNiches(false);
    }
  }, [niches.length]);
  
  // Load niches on mount
  useEffect(() => {
    if (!hasLoadedNiches.current) {
      hasLoadedNiches.current = true;
      loadNiches();
    }
  }, [loadNiches]);
  
  // ============================================================================
  // FACE REFERENCE
  // ============================================================================
  
  const loadFaceReference = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingFaceReference(true);
    try {
      const ref = await ctrApi.getFaceReference();
      setFaceReference(ref);
    } catch (err) {
      console.error('Failed to load face reference:', err);
    } finally {
      setIsLoadingFaceReference(false);
    }
  }, [isAuthenticated]);
  
  const uploadFaceReference = useCallback(async (file: File) => {
    if (!isAuthenticated) {
      setError('Please sign in to upload a face reference');
      setErrorCode('AUTHENTICATION_REQUIRED');
      return;
    }
    
    clearError();
    setIsUploadingFaceReference(true);
    
    try {
      const base64 = await fileToBase64(file);
      const result = await ctrApi.uploadFaceReference(base64);
      
      setFaceReference({
        hasFaceReference: true,
        thumbnailUrl: result.thumbnailUrl,
        faceReferenceKey: result.faceReferenceKey,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setIsUploadingFaceReference(false);
    }
  }, [isAuthenticated, clearError, handleError]);
  
  const deleteFaceReference = useCallback(async () => {
    if (!isAuthenticated) return;
    
    clearError();
    
    try {
      await ctrApi.deleteFaceReference();
      setFaceReference(null);
    } catch (err) {
      handleError(err);
    }
  }, [isAuthenticated, clearError, handleError]);
  
  // Load face reference when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFaceReference();
    }
  }, [isAuthenticated, loadFaceReference]);
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // Quota
    quota,
    isLoadingQuota,
    refreshQuota,
    
    // Audit
    auditResult,
    auditId,
    auditThumbnailUrl,
    youtubeMetadata,
    auditProgress,
    auditByUrl,
    auditByFile,
    auditByYouTube,
    clearAuditResult,
    
    // Audit History & Stats
    auditHistory,
    auditHistoryPagination,
    isLoadingAuditHistory,
    auditStats,
    isLoadingAuditStats,
    loadAuditHistory,
    loadAuditStats,
    loadAuditById,
    
    // Generation
    generatedConcepts,
    detectedNiche,
    generationTime,
    generationProgress,
    generateThumbnails,
    clearGeneratedConcepts,
    
    // Niches
    niches,
    isLoadingNiches,
    loadNiches,
    
    // Face Reference
    faceReference,
    isLoadingFaceReference,
    isUploadingFaceReference,
    loadFaceReference,
    uploadFaceReference,
    deleteFaceReference,
    
    // Error handling
    error,
    errorCode,
    clearError,
    
    // Auth state
    isAuthenticated,
    isAnonymous,
  };
};

export default useCTREngine;


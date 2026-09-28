// src/hooks/useCTREngine.ts
// CTR Thumbnail Engine Hook

import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthMethod } from '../types/auth';
import { ctrApi, fileToBase64 } from '../api/ctr';
import { useStudioBalance } from './useStudioBalance';
import { plainApiError } from '../utils/plainApiError';
import {
  CTRUsageAccess,
  ThumbnailAudit,
  YouTubeVideoMetadata,
  NicheOption,
  FaceReference,
  AuditContext,
  AuditProgress,
  CTRErrorCode,
  AuditHistoryItem,
  AuditStats,
} from '../types/ctr';

// ============================================================================
// TYPES
// ============================================================================

interface UseCTREngineReturn {
  // Access
  usageAccess: CTRUsageAccess | null;
  isLoadingQuota: boolean;
  refreshQuota: () => Promise<void>;
  
  // Audit
  auditResult: ThumbnailAudit | null;
  /** The saved audit, or null (not saved yet, or the audit could not be saved): never link to a null id. */
  auditId: number | null;
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
  /** A sentence for people: the server's message, or what happened and what to do. */
  error: string | null;
  /** HTTP status / server code of the last error, for a development-only suffix. */
  errorDetail: string | null;
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
  const { isSignedIn, isLoaded: isClerkLoaded, user: clerkUser } = useUser();
  const { isAuthenticated: isWeb3Authenticated, user: web3User, isRestoring: isWeb3Restoring } = useAuth();

  // Determine auth method and overall auth status
  const authMethod = typeof window !== 'undefined'
    ? localStorage.getItem('auth_method') as AuthMethod
    : null;
  // A stored wallet session is restored after the first render: until then the
  // account is loading, never anonymous (no sign-in flash, no anonymous page).
  const web3Pending = Boolean(isWeb3Restoring);
  const isAuthLoaded = authMethod === AuthMethod.WEB3 ? !web3Pending : isClerkLoaded;
  
  // Quota state
  const accountId = authMethod === AuthMethod.WEB3
    ? (isWeb3Authenticated && web3User ? `web3:${web3User.id}` : 'anonymous')
    : (isSignedIn && clerkUser ? `clerk:${clerkUser.id}` : 'anonymous');
  const { usageAccess, isLoadingQuota, refreshQuota } = useStudioBalance(accountId, isAuthLoaded && (authMethod === AuthMethod.WEB3 ? !isWeb3Authenticated || Boolean(web3User) : !isSignedIn || Boolean(clerkUser)));
  
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
  
  // Niches state
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [isLoadingNiches, setIsLoadingNiches] = useState(false);
  
  // Face reference state
  const [faceReference, setFaceReference] = useState<FaceReference | null>(null);
  const [isLoadingFaceReference, setIsLoadingFaceReference] = useState(false);
  const [isUploadingFaceReference, setIsUploadingFaceReference] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<CTRErrorCode | null>(null);
  
  // Track if initial load has happened
  const hasLoadedNiches = useRef(false);
  
  // ============================================================================
  // COMPUTED
  // ============================================================================
  
  // Check both Clerk and Web3 authentication
  const isAuthenticated = authMethod === AuthMethod.WEB3 
    ? isWeb3Authenticated 
    : (isClerkLoaded && isSignedIn === true);
  const isAnonymous = authMethod === AuthMethod.WEB3
    ? !web3Pending && !isWeb3Authenticated
    : (isClerkLoaded && isSignedIn === false);
  
  // ============================================================================
  // ERROR HANDLING
  // ============================================================================
  
  const handleError = useCallback((err: unknown, fallback?: string) => {
    const axiosError = axios.isAxiosError(err) ? err : null;
    const responseCode = axiosError?.response?.data?.error?.code;
    // The server's sentence, else a plain one — never "Request failed with status code 503".
    const plain = plainApiError(err, fallback);
    setError(plain.message);
    setErrorDetail(plain.technical);
    
    // Classify on the machine-readable error.code — NOT the human message.
    // Prod messages are sentences like "Daily audit limit of N reached.",
    // they never contain the code tokens.
    const code = typeof responseCode === 'string' ? responseCode : '';
    if (axiosError?.response?.status === 402 || code === 'INSUFFICIENT_CREDITS') {
      setErrorCode('INSUFFICIENT_CREDITS');
    } else if (code === 'ANONYMOUS_AUDIT_CAPACITY') {
      setErrorCode('ANONYMOUS_AUDIT_CAPACITY');
    } else if (code.includes('QUOTA_EXCEEDED')) {
      if (code.startsWith('ANONYMOUS')) {
        setErrorCode('ANONYMOUS_AUDIT_QUOTA_EXCEEDED');
      } else if (code.includes('AUDIT')) {
        setErrorCode('AUDIT_QUOTA_EXCEEDED');
      } else if (code.includes('GENERATE')) {
        setErrorCode('GENERATE_QUOTA_EXCEEDED');
      } else {
        setErrorCode('AUDIT_QUOTA_EXCEEDED');
      }
    } else if (code === 'AUTHENTICATION_REQUIRED' || axiosError?.response?.status === 401) {
      setErrorCode('AUTHENTICATION_REQUIRED');
    } else if (code.includes('RATE_LIMIT') || axiosError?.response?.status === 429) {
      setErrorCode('RATE_LIMIT_EXCEEDED');
    } else {
      setErrorCode('UNKNOWN_ERROR');
    }
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
    setErrorDetail(null);
    setErrorCode(null);
  }, []);
  
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
      setAuditId(result.auditId ?? null);  // null: returned but not saved
      setAuditProgress({
        status: 'complete',
        includesPersonas: includePersonas,
        elapsedTime: Date.now() - startTime,
      });
      
      await refreshQuota();
    } catch (err) {
      void refreshQuota();
      handleError(err, 'The audit did not finish. Please try again.');
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
      setAuditId(result.auditId ?? null);  // null: returned but not saved
      setAuditProgress({
        status: 'complete',
        includesPersonas: includePersonas,
        elapsedTime: Date.now() - startTime,
      });
      
      await refreshQuota();
    } catch (err) {
      void refreshQuota();
      handleError(err, 'The audit did not finish. Please try again.');
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
      setAuditId(result.auditId ?? null);  // null: returned but not saved
      setAuditThumbnailUrl(result.thumbnailUrl);  // Store the thumbnail URL
      setYoutubeMetadata(result.videoMetadata);
      setAuditProgress({
        status: 'complete',
        includesPersonas: includePersonas,
        elapsedTime: Date.now() - startTime,
      });
      
      await refreshQuota();
    } catch (err) {
      void refreshQuota();
      handleError(err, 'The audit did not finish. Please try again.');
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
      handleError(err, 'Could not load your audit history. Please try again.');
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
      handleError(err, 'Could not load your audit stats. Please try again.');
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
      handleError(err, 'Could not open this audit. Please try again.');
      return null;
    }
  }, [handleError]);
  
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
      setError('Sign in to upload a face reference.');
      setErrorDetail(null);
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
      handleError(err, 'Your face photo was not saved. Please try again.');
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
      handleError(err, 'Your face photo was not deleted. Please try again.');
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
    // Access
    usageAccess,
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
    errorDetail,
    errorCode,
    clearError,
    
    // Auth state
    isAuthenticated,
    isAnonymous,
  };
};

export default useCTREngine;

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import api from '../api/index';
import creditsApi from '../api/credits';
import { useAuth } from '../contexts/AuthContext';
import { AuthMethod } from '../types/auth';
import {
  CreditInfo,
  CreditPricingCatalog,
  GeneratorQuotaInfo,
  UsageMode,
} from '../types/ctr';
import {
  getOperationAccessUpdate,
  normalizeUsageAccessResponse,
} from '../utils/usageAccess';

// Extend Window interface for Clerk
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

// =============================================================================
// Types
// =============================================================================

interface GeneratedThumbnail {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
  shareUrl?: string;
}

// Gemini 3 Pro aspect ratios
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';

// Gemini 3 Pro resolutions  
export type Resolution = '1K' | '2K' | '4K';

// Model selection
export type ImageModel = 'gemini-3-pro' | 'gpt-image-1';

interface ThumbnailGenerationOptions {
  // NEW: Gemini 3 Pro options (default model)
  model?: ImageModel;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  includeFace?: boolean;  // Use stored face reference for consistency
  
  // LEGACY: OpenAI options (still work if model is 'gpt-image-1')
  size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  quality?: 'medium' | 'high';
  style?: string;
  n?: number;
  referenceImage?: File;
  mask?: File;
  title?: string;
  titleStyle?: {
    bold: boolean;
    outline: boolean;
    shadow: boolean;
    uppercase: boolean;
  };
  titlePosition?: {
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  titleColor?: {
    primary: string;
    name: string;
  };
}

interface GalleryThumbnail {
  id: number;
  thumbnailUrl: string;
  prompt: string;
  size: string;
  quality: string;
  style: string;
  downloadCount: number;
  createdAt: string;
  shareUrl: string;
}

interface UsePublicThumbnailGeneratorReturn {
  // Generation
  generateThumbnail: (prompt: string, options?: ThumbnailGenerationOptions) => Promise<void>;
  thumbnails: GeneratedThumbnail[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  
  // Usage access
  usageMode: UsageMode;
  quotaInfo: GeneratorQuotaInfo | null;
  creditInfo: CreditInfo | null;
  pricing: CreditPricingCatalog | null;
  insufficientCredits: boolean;
  quotaUsed: number;
  maxQuota: number;
  canGenerate: boolean;
  refreshQuota: () => Promise<void>;
  
  // Email capture (for anonymous downloads)
  needsEmailCapture: boolean;
  submitEmailForDownload: (email: string, thumbnailId?: string) => Promise<void>;
  
  // Downloads
  downloadThumbnail: (thumbnailId: string, sourceUrl?: string) => Promise<void>;
  forceDownload: (thumbnailId: string, sourceUrl?: string) => Promise<void>;
  
  // Gallery (authenticated users)
  gallery: GalleryThumbnail[];
  galleryLoading: boolean;
  loadGallery: (page?: number) => Promise<void>;
  deleteFromGallery: (thumbnailId: number) => Promise<void>;
  
  // Helpers
  getCurrentThumbnailContext: (thumbnailId?: string) => { prompt: string; thumbnailId: string; createdAt: string } | null;
}

// =============================================================================
// Constants
// =============================================================================

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const EMAIL_STORAGE_KEY = 'thumbnailUserEmail';

// Public API key for /v1/images/* endpoints (anonymous users)
// This is different from Clerk auth - it's a BaseTube API key (bt_live_...)
const PUBLIC_API_KEY = process.env.REACT_APP_BASETUBE_PUBLIC_API_KEY;

// Debug: Log the API URL being used
if (process.env.NODE_ENV !== 'production') {
  console.log('[usePublicThumbnailGenerator] API_URL:', API_URL);
  console.log('[usePublicThumbnailGenerator] BASETUBE_PUBLIC_API_KEY configured:', !!PUBLIC_API_KEY);
}

// Helper to get auth headers for public API (uses API key)
const getPublicApiHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (PUBLIC_API_KEY) {
    headers['Authorization'] = `Bearer ${PUBLIC_API_KEY}`;
    console.log('[getPublicApiHeaders] ✓ BaseTube API key set');
  } else {
    console.warn('[getPublicApiHeaders] ✗ No REACT_APP_BASETUBE_PUBLIC_API_KEY configured - anonymous requests will fail');
  }
  
  return headers;
};

// Helper to get auth headers (for authenticated endpoints - kept for reference image uploads)
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  try {
    const authMethod = localStorage.getItem('auth_method');
    
    console.log('[getAuthHeaders] Auth method:', authMethod);
    console.log('[getAuthHeaders] Clerk available:', !!window.Clerk);
    console.log('[getAuthHeaders] Clerk session:', !!window.Clerk?.session);
    
    if (authMethod !== 'web3') {
      // Clerk-based auth - try multiple methods to get the token
      let clerkToken: string | null = null;
      
      // Method 1: Try window.Clerk.session.getToken()
      if (window.Clerk?.session) {
        try {
          clerkToken = await window.Clerk.session.getToken();
          console.log('[getAuthHeaders] Clerk getToken() result:', clerkToken ? `token (${clerkToken.length} chars)` : 'null');
        } catch (tokenError) {
          console.error('[getAuthHeaders] Error calling getToken():', tokenError);
        }
      }
      
      // Method 2: If no token, wait a bit and retry (session might be loading)
      if (!clerkToken && window.Clerk?.session) {
        console.log('[getAuthHeaders] Retrying getToken after 100ms...');
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
          clerkToken = await window.Clerk.session.getToken();
          console.log('[getAuthHeaders] Retry result:', clerkToken ? `token (${clerkToken.length} chars)` : 'null');
        } catch (retryError) {
          console.error('[getAuthHeaders] Retry error:', retryError);
        }
      }
      
      if (clerkToken) {
        headers['Authorization'] = `Bearer ${clerkToken}`;
        console.log('[getAuthHeaders] ✓ Authorization header set');
      } else {
        console.warn('[getAuthHeaders] ✗ No Clerk token available - request will likely fail with 401');
      }
    } else {
      console.log('[getAuthHeaders] Web3 auth - relying on cookies');
    }
  } catch (error) {
    console.error('[getAuthHeaders] Failed to get auth token:', error);
  }
  
  return headers;
};

// =============================================================================
// Helper Functions
// =============================================================================

const buildTitleInstructions = (
  title: string, 
  titleStyle?: ThumbnailGenerationOptions['titleStyle'], 
  titlePosition?: ThumbnailGenerationOptions['titlePosition'], 
  titleColor?: ThumbnailGenerationOptions['titleColor']
): string => {
  let instructions = `Add the text "${title}" to the thumbnail`;
  
  if (titleStyle) {
    const styles: string[] = [];
    if (titleStyle.bold) styles.push('bold');
    if (titleStyle.uppercase) styles.push('uppercase');
    if (titleStyle.outline) styles.push('outlined');
    if (titleStyle.shadow) styles.push('with drop shadow');
    
    if (styles.length > 0) {
      instructions += ` in ${styles.join(', ')} style`;
    }
  }
  
  if (titleColor && titleColor.primary !== 'white') {
    instructions += ` in ${titleColor.name.toLowerCase()} color`;
  }
  
  if (titlePosition) {
    const verticalPos = titlePosition.vertical === 'center' ? 'middle' : titlePosition.vertical;
    const horizontalPos = titlePosition.horizontal === 'center' ? 'center' : titlePosition.horizontal;
    instructions += ` positioned at the ${verticalPos} ${horizontalPos} of the thumbnail`;
  }
  
  instructions += '. Make sure the text is clearly readable and stands out against the background.';
  
  return instructions;
};

const isPersistentThumbnailId = (thumbnailId: string): boolean => /^\d+$/.test(thumbnailId);

// =============================================================================
// Hook Implementation
// =============================================================================

export const usePublicThumbnailGenerator = (): UsePublicThumbnailGeneratorReturn => {
  const { isSignedIn } = useUser();
  const { isAuthenticated: isWeb3Authenticated } = useAuth();
  const authMethod = localStorage.getItem('auth_method') as AuthMethod | null;
  const isAuthenticated = authMethod === AuthMethod.WEB3
    ? isWeb3Authenticated
    : isSignedIn === true;
  const mountedRef = useRef(true);
  const pollTimeoutsRef = useRef<Set<number>>(new Set());
  
  // Generation state
  const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usage state (server-side)
  const [usageMode, setUsageMode] = useState<UsageMode>('quota');
  const [quotaInfo, setQuotaInfo] = useState<GeneratorQuotaInfo | null>(null);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [pricing, setPricing] = useState<CreditPricingCatalog | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  
  // Email capture state
  const [needsEmailCapture, setNeedsEmailCapture] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Gallery state
  const [gallery, setGallery] = useState<GalleryThumbnail[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const pollTimeouts = pollTimeoutsRef.current;

    return () => {
      mountedRef.current = false;
      pollTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      pollTimeouts.clear();
    };
  }, []);

  const applyUsageAccess = useCallback((raw: unknown): void => {
    const normalized = normalizeUsageAccessResponse(raw);
    if (!normalized) {
      return;
    }

    if (normalized.mode === 'credits') {
      setUsageMode('credits');
      setQuotaInfo(null);
      setCreditInfo(normalized.creditInfo);
      setPricing(normalized.pricing ?? null);
      return;
    }

    setUsageMode('quota');
    setQuotaInfo(normalized.quotaInfo);
    setCreditInfo(null);
    setPricing(null);
  }, []);

  const refreshCreditBalance = useCallback(async (): Promise<void> => {
    try {
      const balance = await creditsApi.getCreditBalance();
      setUsageMode('credits');
      setQuotaInfo(null);
      setCreditInfo(balance.creditInfo);
      setPricing(balance.pricing);
    } catch (err) {
      console.error('Error fetching credit balance:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Usage Management (Server-Side)
  // ---------------------------------------------------------------------------

  const fetchUsageAccess = useCallback(async (): Promise<GeneratorQuotaInfo | CreditInfo | null> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/v1/images/quota`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });
      
      if (!response.ok) {
        console.error('Failed to fetch quota:', response.status);
        return null;
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        applyUsageAccess(result);

        const normalized = normalizeUsageAccessResponse(result);
        if (normalized?.mode === 'credits') {
          return normalized.creditInfo;
        }
        return normalized?.quotaInfo ?? null;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching quota:', err);
      return null;
    }
  }, [applyUsageAccess]);

  const refreshQuota = useCallback(async (): Promise<void> => {
    await fetchUsageAccess();
  }, [fetchUsageAccess]);

  // Initialize quota on mount and when auth state changes
  useEffect(() => {
    const initializeQuota = async () => {
      await fetchUsageAccess();
    };
    
    initializeQuota();
    
    // Load email from localStorage
    const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, [fetchUsageAccess, isAuthenticated]); // Re-run when the effective auth state changes

  // Computed quota values
  const quotaUsed = quotaInfo?.used ?? 0;
  const maxQuota = quotaInfo?.limit ?? 1;
  const canGenerate = usageMode === 'credits'
    ? (creditInfo?.available ?? 0) > 0
    : (quotaInfo ? quotaInfo.remaining > 0 : false);

  const getGenerationCreditCost = useCallback((options?: ThumbnailGenerationOptions): number => {
    if (!pricing) {
      return 0;
    }

    const imageCount = Math.min(options?.n || 2, 4);
    const perImageCost = options?.referenceImage
      ? pricing.thumbnail.editPerImage
      : pricing.thumbnail.generatePerImage;

    return perImageCost * imageCount;
  }, [pricing]);

  // ---------------------------------------------------------------------------
  // Job Polling
  // ---------------------------------------------------------------------------

  const pollJobStatus = useCallback(async (jobId: string, originalPrompt: string): Promise<void> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/v1/images/job/${jobId}`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to get job status');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get job status');
      }

      const jobData = result.data;
      if (!mountedRef.current) {
        return;
      }
      
      if (jobData.status === 'completed' && jobData.result) {
        // Job completed successfully
        // Handle response
        let generatedThumbnails: GeneratedThumbnail[] = [];
        
        if (jobData.result.thumbnails) {
          generatedThumbnails = jobData.result.thumbnails.map((thumb: any, index: number) => ({
            id: thumb.id ? thumb.id.toString() : `${Date.now()}-${index}`,
            prompt: jobData.result.prompt || originalPrompt,
            imageUrl: thumb.thumbnailUrl,
            createdAt: new Date().toISOString(),
            shareUrl: thumb.shareUrl,
          }));
        } else if (jobData.result.thumbnailUrl) {
          generatedThumbnails = [{
            id: jobData.result.id ? jobData.result.id.toString() : Date.now().toString(),
            prompt: jobData.result.prompt || originalPrompt,
            imageUrl: jobData.result.thumbnailUrl,
            createdAt: new Date().toISOString(),
            shareUrl: jobData.result.shareUrl,
          }];
        }

        if (generatedThumbnails.length > 0) {
          setThumbnails(prev => [...generatedThumbnails, ...prev]);
        }

        if (isAuthenticated) {
          await refreshCreditBalance();
        } else {
          await refreshQuota();
        }

        setLoading(false);
      } else if (jobData.status === 'failed') {
        setError(jobData.error || 'Thumbnail generation failed');
        setLoading(false);
      } else {
        // Still processing, continue polling
        const timeoutId = window.setTimeout(() => {
          pollTimeoutsRef.current.delete(timeoutId);
          if (mountedRef.current) {
            void pollJobStatus(jobId, originalPrompt);
          }
        }, 2000);
        pollTimeoutsRef.current.add(timeoutId);
      }
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to check job status');
      setLoading(false);
    }
  }, [isAuthenticated, refreshCreditBalance, refreshQuota]);

  // ---------------------------------------------------------------------------
  // Thumbnail Generation
  // ---------------------------------------------------------------------------

  const generateThumbnail = useCallback(async (
    prompt: string, 
    options?: ThumbnailGenerationOptions
  ): Promise<void> => {
    let shouldClearLoading = true;

    if (!prompt.trim()) {
      setError('Please enter a prompt for your thumbnail.');
      return;
    }

    setLoading(true);
    setError(null);
    setInsufficientCredits(false);

    try {
      const currentAccess = await fetchUsageAccess();
      const effectiveUsageMode =
        currentAccess && 'available' in currentAccess ? 'credits' : usageMode;

      if (effectiveUsageMode === 'quota') {
        const currentQuota =
          currentAccess && 'remaining' in currentAccess
            ? currentAccess
            : quotaInfo;

        if (!currentQuota || currentQuota.remaining <= 0) {
          setError(currentQuota?.message || 'Daily quota exceeded. Please try again tomorrow or upgrade your account.');
          if (currentQuota) {
            setQuotaInfo(currentQuota);
          }
          return;
        }
      }

      const generationCost = getGenerationCreditCost(options);
      const availableCredits =
        currentAccess && 'available' in currentAccess
          ? currentAccess.available
          : (creditInfo?.available ?? 0);
      if (effectiveUsageMode === 'credits' && generationCost > 0 && availableCredits < generationCost) {
        setInsufficientCredits(true);
        setError(`Insufficient credits. This action costs ${generationCost} credits and you have ${availableCredits} available.`);
        return;
      }

      // Build enhanced prompt with title instructions
      let enhancedPrompt = prompt.trim();
      
      if (options?.title) {
        const titleInstructions = buildTitleInstructions(
          options.title, 
          options.titleStyle, 
          options.titlePosition, 
          options.titleColor
        );
        enhancedPrompt = `${prompt.trim()}. ${titleInstructions}`;
      }

      // Step 2: Call the generation API
      console.log('[generateThumbnail] isAuthenticated:', isAuthenticated);
      console.log('[generateThumbnail] Auth method:', localStorage.getItem('auth_method'));
      
      if (options?.referenceImage) {
        // Reference image upload - always use fetch for FormData
        const endpoint = '/v1/images/edit';
        const formData = new FormData();
        formData.append('image', options.referenceImage);
        formData.append('prompt', enhancedPrompt);
        formData.append('size', options.size || 'auto');
        formData.append('quality', options.quality || 'high');
        formData.append('n', String(Math.min(options.n || 2, 4)));
        
        if (options.style) {
          formData.append('style', options.style);
        }
        
        if (options.mask) {
          formData.append('mask', options.mask);
        }
        
        const formHeaders = await getAuthHeaders();
        // Remove Content-Type for FormData - browser sets it with boundary
        delete formHeaders['Content-Type'];
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          credentials: 'include',
          headers: formHeaders,
          body: formData,
        });

        // Handle async job (202 response)
        if (response.status === 202) {
          const result = await response.json();
          if (result.success && result.jobId) {
            void pollJobStatus(result.jobId, prompt.trim());
            shouldClearLoading = false;
            return; // Don't increment quota yet - will do after job completes
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 402 || errorData.error?.code === 'INSUFFICIENT_CREDITS') {
            setInsufficientCredits(true);
            throw new Error(errorData.error?.message || 'Insufficient credits for this edit.');
          }
          throw new Error(errorData.error?.message || 'Failed to generate thumbnail. Please try again.');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to generate thumbnail.');
        }

        // Handle response
        let generatedThumbnails: GeneratedThumbnail[] = [];
        if (result.data.thumbnails) {
          generatedThumbnails = result.data.thumbnails.map((thumb: any, index: number) => ({
            id: thumb.id ? thumb.id.toString() : `${Date.now()}-${index}`,
            prompt: prompt.trim(),
            imageUrl: thumb.thumbnailUrl,
            createdAt: new Date().toISOString(),
            shareUrl: thumb.shareUrl,
          }));
        } else if (result.data.thumbnailUrl) {
          generatedThumbnails = [{
            id: result.data.id ? result.data.id.toString() : Date.now().toString(),
            prompt: prompt.trim(),
            imageUrl: result.data.thumbnailUrl,
            createdAt: new Date().toISOString(),
            shareUrl: result.data.shareUrl,
          }];
        } else {
          throw new Error('No thumbnail URL found in response.');
        }

        setThumbnails(prev => [...generatedThumbnails, ...prev]);
        const accessUpdate = getOperationAccessUpdate(result);
        if (accessUpdate?.mode === 'credits') {
          setUsageMode('credits');
          setCreditInfo(accessUpdate.creditInfo);
          setPricing(accessUpdate.pricing ?? pricing);
          setQuotaInfo(null);
        } else if (accessUpdate?.mode === 'quota' && accessUpdate.quotaInfo) {
          setUsageMode('quota');
          setCreditInfo(null);
          setPricing(null);
          setQuotaInfo({
            ...accessUpdate.quotaInfo,
            isAnonymous: quotaInfo?.isAnonymous ?? !isAuthenticated,
            tier: quotaInfo?.tier ?? (isAuthenticated ? 'free' : 'anonymous'),
          });
        } else if (isAuthenticated) {
          await refreshCreditBalance();
        } else {
          await refreshQuota();
        }
        setLoading(false);
        return;
      }

      // Text-to-image generation
      // Build config based on model (Gemini 3 Pro is default)
      const useGemini = !options?.model || options.model === 'gemini-3-pro';
      
      const requestBody: Record<string, any> = {
        prompt: enhancedPrompt,
        config: useGemini ? {
          // Gemini 3 Pro options
          aspectRatio: options?.aspectRatio || '16:9',
          resolution: options?.resolution || '1K',
          includeFace: options?.includeFace || false,
        } : {
          // OpenAI fallback options
          model: 'gpt-image-1',
          size: options?.size || 'auto',
          quality: options?.quality || 'high',
        },
        n: Math.min(options?.n || 2, 4),
      };
          
      // Add style if provided
      if (options?.style) {
        requestBody.config.style = options.style;
      }

      if (isAuthenticated) {
        // Authenticated user - use axios with /api/v1/ctr/generate
        console.log('[generateThumbnail] Using authenticated endpoint: /api/v1/ctr/generate');
        
        try {
          const axiosResponse = await api.post('/api/v1/ctr/generate', {
            title: enhancedPrompt,
            niche: options?.style || 'general',
            generateCount: Math.min(options?.n || 2, 4),
            config: requestBody.config,
          });
          
          const result = axiosResponse.data;
          console.log('[generateThumbnail] Axios response:', result);
          
          // CTR API returns "concepts" not "thumbnails", and uses "thumbnailUrl" not "imageUrl"
          if (result.success && result.data?.concepts) {
            // Transform CTR response to match expected format
            const newThumbnails: GeneratedThumbnail[] = result.data.concepts.map((concept: any) => ({
              id: concept.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              prompt: concept.prompt || prompt.trim(),
              imageUrl: concept.thumbnailUrl, // CTR API uses thumbnailUrl
              createdAt: new Date().toISOString(),
              shareUrl: concept.shareUrl,
            }));
            
            console.log('[generateThumbnail] Transformed thumbnails:', newThumbnails);
            
            setThumbnails(prev => [...newThumbnails, ...prev]);
            const accessUpdate = getOperationAccessUpdate(result);
            if (accessUpdate?.mode === 'credits') {
              setUsageMode('credits');
              setCreditInfo(accessUpdate.creditInfo);
              setPricing(accessUpdate.pricing ?? pricing);
              setQuotaInfo(null);
            } else {
              await refreshCreditBalance();
            }
            setLoading(false);
            return;
          }
          
          // Fallback: also check for "thumbnails" field (for backwards compatibility)
          if (result.success && result.data?.thumbnails) {
            const newThumbnails: GeneratedThumbnail[] = result.data.thumbnails.map((t: any) => ({
              id: t.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              prompt: t.prompt || prompt.trim(),
              imageUrl: t.thumbnailUrl || t.imageUrl,
              createdAt: new Date().toISOString(),
              shareUrl: t.shareUrl,
            }));
            
            setThumbnails(prev => [...newThumbnails, ...prev]);
            const accessUpdate = getOperationAccessUpdate(result);
            if (accessUpdate?.mode === 'credits') {
              setUsageMode('credits');
              setCreditInfo(accessUpdate.creditInfo);
              setPricing(accessUpdate.pricing ?? pricing);
              setQuotaInfo(null);
            } else {
              await refreshCreditBalance();
            }
            setLoading(false);
            return;
          }
          
          console.error('[generateThumbnail] Unexpected response structure:', result);
          throw new Error(result.error?.message || 'Failed to generate thumbnail - unexpected response format');
        } catch (axiosError: any) {
          console.error('[generateThumbnail] Axios error details:', {
            message: axiosError.message,
            response: axiosError.response?.data,
            status: axiosError.response?.status,
            url: axiosError.config?.url,
          });
          if (axiosError.response?.status === 402 || axiosError.response?.data?.error?.code === 'INSUFFICIENT_CREDITS') {
            setInsufficientCredits(true);
          }
          const errorMessage = axiosError.response?.data?.error?.message 
            || axiosError.response?.data?.message 
            || axiosError.message 
            || 'Failed to generate thumbnail';
          throw new Error(errorMessage);
        }
      } else {
        // Anonymous user - use fetch with /v1/images/generate (public API endpoint)
        console.log('[generateThumbnail] Using public API endpoint: /v1/images/generate');
        
        const publicHeaders = getPublicApiHeaders();
        
        if (!PUBLIC_API_KEY) {
          throw new Error('Public API key not configured. Please set REACT_APP_BASETUBE_PUBLIC_API_KEY in your environment.');
        }
        
        const response = await fetch(`${API_URL}/v1/images/generate`, {
          method: 'POST',
          credentials: 'include',
          headers: publicHeaders,
          body: JSON.stringify(requestBody),
        });

        // Handle async job (202 response)
        if (response.status === 202) {
          const result = await response.json();
          if (result.success && result.jobId) {
            void pollJobStatus(result.jobId, prompt.trim());
            shouldClearLoading = false;
            return; // Don't increment quota yet - will do after job completes
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle quota exceeded from API
          if (response.status === 429) {
            if (errorData.error) {
              setUsageMode('quota');
              setCreditInfo(null);
              setPricing(null);
              setQuotaInfo({
                used: errorData.error.used || 0,
                limit: errorData.error.limit || 1,
                remaining: errorData.error.remaining || 0,
                isAnonymous: errorData.error.isAnonymous ?? true,
                tier: errorData.error.tier || 'anonymous',
                resetsAt: errorData.error.resetsAt || '',
                upgradeUrl: errorData.error.upgradeUrl,
                message: errorData.error.message,
              });
            }
            throw new Error(errorData.error?.message || 'Daily quota exceeded.');
          }
          
          throw new Error(errorData.error?.message || 'Failed to generate thumbnail. Please try again.');
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to generate thumbnail.');
        }

        // Handle response
        let generatedThumbnails: GeneratedThumbnail[] = [];
        
        if (result.data.thumbnails) {
          generatedThumbnails = result.data.thumbnails.map((thumb: any, index: number) => ({
            id: thumb.id ? thumb.id.toString() : `${Date.now()}-${index}`,
            prompt: prompt.trim(),
            imageUrl: thumb.thumbnailUrl,
            createdAt: new Date().toISOString(),
            shareUrl: thumb.shareUrl,
          }));
        } else if (result.data.thumbnailUrl) {
          generatedThumbnails = [{
            id: result.data.id ? result.data.id.toString() : Date.now().toString(),
            prompt: prompt.trim(),
            imageUrl: result.data.thumbnailUrl,
            createdAt: new Date().toISOString(),
            shareUrl: result.data.shareUrl,
          }];
        } else {
          throw new Error('No thumbnail URL found in response.');
        }

        setThumbnails(prev => [...generatedThumbnails, ...prev]);
        const accessUpdate = getOperationAccessUpdate(result);
        if (accessUpdate?.mode === 'quota' && accessUpdate.quotaInfo) {
          setUsageMode('quota');
          setCreditInfo(null);
          setPricing(null);
          setQuotaInfo({
            ...accessUpdate.quotaInfo,
            isAnonymous: true,
            tier: 'anonymous',
          });
        } else {
          await refreshQuota();
        }
        setLoading(false);
        return;
      }

    } catch (err) {
      console.error('[generateThumbnail] Error caught:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        isAuthenticated,
        authMethod: localStorage.getItem('auth_method'),
      });
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      if (mountedRef.current && shouldClearLoading) {
        setLoading(false);
      }
    }
  }, [
    creditInfo,
    fetchUsageAccess,
    getGenerationCreditCost,
    isAuthenticated,
    pollJobStatus,
    pricing,
    quotaInfo,
    refreshCreditBalance,
    refreshQuota,
    usageMode,
  ]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const getCurrentThumbnailContext = useCallback((thumbnailId?: string) => {
    if (thumbnailId) {
      const thumbnail = thumbnails.find(t => t.id === thumbnailId);
      return thumbnail ? {
        prompt: thumbnail.prompt,
        thumbnailId: thumbnail.id,
        createdAt: thumbnail.createdAt
      } : null;
    }
    return thumbnails.length > 0 ? {
      prompt: thumbnails[0].prompt,
      thumbnailId: thumbnails[0].id,
      createdAt: thumbnails[0].createdAt
    } : null;
  }, [thumbnails]);

  const clearError = useCallback((): void => {
    setError(null);
    setInsufficientCredits(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Email Capture (for anonymous downloads)
  // ---------------------------------------------------------------------------

  const submitEmailForDownload = useCallback(async (
    email: string, 
    thumbnailId?: string
  ): Promise<void> => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const thumbnailContext = getCurrentThumbnailContext(thumbnailId);
      
      // Send to Formspree (until Job 5 backend is ready)
      const formspreeResponse = await fetch('https://formspree.io/f/mvgrqevw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source: 'AI Thumbnail Generator',
          timestamp: new Date().toISOString(),
          quotaUsed: quotaUsed,
          tier: quotaInfo?.tier || 'anonymous',
          totalThumbnails: thumbnails.length,
          currentPrompt: thumbnailContext?.prompt || 'No prompt available',
          currentThumbnailId: thumbnailContext?.thumbnailId || 'N/A',
          userAgent: navigator.userAgent,
          referrer: document.referrer || 'Direct',
          message: `New lead from AI Thumbnail Generator: ${email.trim()}\n\nUser Activity:\n- Thumbnails generated: ${thumbnails.length}\n- Quota: ${quotaUsed}/${maxQuota}\n- Tier: ${quotaInfo?.tier || 'anonymous'}\n- Current prompt: "${thumbnailContext?.prompt || 'N/A'}"\n- Thumbnail ID: ${thumbnailContext?.thumbnailId || 'N/A'}\n- Source: ${window.location.hostname}`
        }),
      });

      if (!formspreeResponse.ok) {
        throw new Error('Failed to save email. Please try again.');
      }

      // Save email locally
      localStorage.setItem(EMAIL_STORAGE_KEY, email.trim());
      setUserEmail(email.trim());
      setNeedsEmailCapture(false);
      
    } catch (err) {
      console.error('Email submission error:', err);
      setError('Failed to save email. Please check your connection and try again.');
    }
  }, [getCurrentThumbnailContext, maxQuota, quotaInfo, quotaUsed, thumbnails]);

  // ---------------------------------------------------------------------------
  // Download Functions
  // ---------------------------------------------------------------------------

  const downloadFromSourceUrl = useCallback(async (
    sourceUrl: string,
    filenameBase: string
  ): Promise<void> => {
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type') || '';
    let extension = 'png';
    if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('jpeg')) extension = 'jpg';

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}.${extension}`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }, []);
    
  const downloadThumbnail = useCallback(async (thumbnailId: string, sourceUrl?: string): Promise<void> => {
    // Check if user has provided email (for anonymous users)
    if (!isAuthenticated && !userEmail) {
      setNeedsEmailCapture(true);
      return;
    }

    const thumbnail = thumbnails.find(t => t.id === thumbnailId);

    try {
      if (!isPersistentThumbnailId(thumbnailId) && sourceUrl) {
        await downloadFromSourceUrl(sourceUrl, `ai-thumbnail-${thumbnail?.id || 'generated'}`);
        return;
      }

      const downloadUrl = `${API_URL}/api/v1/thumbnails/${thumbnailId}/download`;
      
      // Get auth headers for Clerk token
      const headers = await getAuthHeaders();
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('Content-Type') || '';
      let extension = 'png';
      if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('jpeg')) extension = 'jpg';

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-thumbnail-${thumbnail?.id || thumbnailId}.${extension}`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('[downloadThumbnail] Error:', error);
      setError('Failed to download thumbnail. Please try right-clicking the image and saving it manually.');
    }
  }, [downloadFromSourceUrl, isAuthenticated, userEmail, thumbnails]);

  const forceDownload = useCallback(async (thumbnailId: string, sourceUrl?: string): Promise<void> => {
    const thumbnail = thumbnails.find(t => t.id === thumbnailId);

    try {
      if (!isPersistentThumbnailId(thumbnailId) && sourceUrl) {
        await downloadFromSourceUrl(sourceUrl, `ai-thumbnail-${thumbnail?.id || 'generated'}`);
        return;
      }

      const downloadUrl = `${API_URL}/api/v1/thumbnails/${thumbnailId}/download`;
      
      // Get auth headers for Clerk token
      const headers = await getAuthHeaders();
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('Content-Type') || '';
      let extension = 'png';
      if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('jpeg')) extension = 'jpg';

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-thumbnail-${thumbnail?.id || thumbnailId}.${extension}`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('[forceDownload] Error:', error);
      setError('Failed to download thumbnail. Please try right-clicking the image and saving it manually.');
    }
  }, [downloadFromSourceUrl, thumbnails]);

  // ---------------------------------------------------------------------------
  // Gallery Management (Authenticated Users)
  // ---------------------------------------------------------------------------

  const loadGallery = useCallback(async (page = 0): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    setGalleryLoading(true);

    try {
      const limit = 20;
      const offset = page * limit;
      
      // Use axios api client which has auth interceptor for Clerk token
      const response = await api.get(`/api/v1/users/me/thumbnails?limit=${limit}&offset=${offset}`);
      const result = response.data;
      
      console.log('[loadGallery] Response:', result);
      
      if (result.success && result.data) {
        // Gallery endpoint returns "thumbnails" array
        const thumbnails = result.data.thumbnails || [];
        console.log('[loadGallery] Thumbnails count:', thumbnails.length);
        
        if (page === 0) {
          setGallery(thumbnails);
        } else {
          setGallery(prev => [...prev, ...thumbnails]);
        }
        
        // Update access state from gallery response when available
        if (result.data.quotaInfo || result.data.creditInfo) {
          applyUsageAccess({ success: true, data: result.data });
        }
      } else {
        console.warn('[loadGallery] Unexpected response:', result);
      }
    } catch (err: any) {
      console.error('[loadGallery] Error:', err);
      // Don't show error for 401 - user might just need to re-login
      if (err.response?.status !== 401) {
        setError('Failed to load your thumbnail gallery.');
      }
    } finally {
      setGalleryLoading(false);
    }
  }, [applyUsageAccess, isAuthenticated]);

  const deleteFromGallery = useCallback(async (thumbnailId: number): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    try {
      // Use axios api client which has auth interceptor for Clerk token
      await api.delete(`/api/v1/users/me/thumbnails/${thumbnailId}`);
      
      // Remove from local state
      setGallery(prev => prev.filter(t => t.id !== thumbnailId));
      setThumbnails(prev => prev.filter(t => t.id !== thumbnailId.toString()));
    } catch (err) {
      console.error('[deleteFromGallery] Error:', err);
      setError('Failed to delete thumbnail.');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setGallery([]);
    }
  }, [isAuthenticated]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // Generation
    generateThumbnail,
    thumbnails,
    loading,
    error,
    clearError,
    
    // Usage access
    usageMode,
    quotaInfo,
    creditInfo,
    pricing,
    insufficientCredits,
    quotaUsed,
    maxQuota,
    canGenerate,
    refreshQuota,
    
    // Email capture
    needsEmailCapture,
    submitEmailForDownload,
    
    // Downloads
    downloadThumbnail,
    forceDownload,
    
    // Gallery
    gallery,
    galleryLoading,
    loadGallery,
    deleteFromGallery,
    
    // Helpers
    getCurrentThumbnailContext,
  };
}; 

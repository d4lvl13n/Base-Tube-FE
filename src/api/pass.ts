import api from './index';
import {
  Pass,
  PassDetailsResponse,
  DiscoverPassesResponse,
  DiscoverPassesParams,
  CreatePassRequest,
  AddVideoRequest,
  CheckoutSessionResponse,
  SignedUrlResponse,
  PurchaseStatus,
  PlayTokenData,
  PlayTokenErrorCode
} from '../types/pass';
import { handleApiError, retryWithBackoff } from '../utils/errorHandler';
import { ErrorCode } from '../types/error';

/**
 * Custom error class for video playback errors
 * Provides structured error information for handling different failure cases
 */
export class PlaybackError extends Error {
  constructor(
    public code: PlayTokenErrorCode,
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'PlaybackError';
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PlaybackError.prototype);
  }
}

/**
 * API helpers for Pass-as-a-Link feature
 */
export const passApi = {
  /**
   * Fetch pass details by ID or slug
   * @param identifier Pass unique id or slug (string)
   */
  getPassDetails: async (identifier: string): Promise<Pass> => {
    const response = await api.get(`/api/v1/passes/${identifier}`);
    const data = 'data' in response.data ? response.data.data : response.data;
    return data as Pass;
  },

  /**
   * Create a Stripe checkout session and return redirect URL
   * @param passId Pass unique id
   */
  createCheckoutSession: async (
    passId: string
  ): Promise<CheckoutSessionResponse> => {
    const response = await api.post<CheckoutSessionResponse>(
      `/api/v1/passes/${passId}/checkout`
    );
    return response.data;
  },

  /**
   * Retrieve a signed video URL for S3/CDN hosted content
   * @param videoId Video uuid
   * @note Only works for non-external storage tiers (standard, premium, cdn, decentralised)
   * @note For external videos (YouTube, etc.), use getPlayToken instead
   * @throws PlaybackError with code 'USE_PLAY_TOKEN' if video is external
   */
  getSignedVideoUrl: async (videoId: string): Promise<string> => {
    try {
      const response = await api.get<SignedUrlResponse>(
        `/api/v1/passes/videos/${videoId}/signed-url`
      );
      return response.data.signed_url;
    } catch (error: any) {
      // Handle USE_PLAY_TOKEN error - video is external, need play-token endpoint
      if (error.response?.data?.error?.code === 'USE_PLAY_TOKEN') {
        throw new PlaybackError(
          'USE_PLAY_TOKEN' as PlayTokenErrorCode,
          'External videos require play-token endpoint',
          400
        );
      }
      throw error;
    }
  },

  /**
   * Get playback URL for a video based on its storage tier
   * Routes to the correct endpoint automatically:
   * - external (YouTube, Twitch, etc.) → play-token endpoint
   * - S3/CDN hosted → signed-url endpoint
   *
   * @param videoId Video UUID
   * @param storageTier The video's storage tier (default: 'external' for safety)
   * @returns PlayTokenData with playback URLs
   */
  getVideoPlaybackUrl: async (
    videoId: string,
    storageTier: 'external' | 'standard' | 'premium' | 'cdn' | 'decentralised' = 'external'
  ): Promise<PlayTokenData> => {
    // External videos must use play-token endpoint
    if (storageTier === 'external') {
      return passApi.getPlayToken(videoId);
    }

    // S3/CDN videos use signed-url endpoint
    try {
      const signedUrl = await passApi.getSignedVideoUrl(videoId);
      // Convert signed URL to PlayTokenData format for consistency
      return {
        video_id: videoId,
        playback_url: signedUrl,
        embed_url: null,
        platform: 'hosted',
        token: '',
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        expires_in_seconds: 3600,
      };
    } catch (error: any) {
      // Fallback to play-token if signed-url returns USE_PLAY_TOKEN error
      if (error instanceof PlaybackError && error.code === 'USE_PLAY_TOKEN') {
        console.log('[passApi] Falling back to play-token for video:', videoId);
        return passApi.getPlayToken(videoId);
      }
      throw error;
    }
  },

  /**
   * Get a play token for video playback
   * Call this when user initiates playback to get the actual video URL
   *
   * @param videoId Video UUID
   * @returns Play token data with playback URLs
   * @throws PlaybackError on failure (UNAUTHORIZED, NO_ACCESS, NOT_FOUND, RATE_LIMIT)
   *
   * Rate limits:
   * - 30 requests per user per hour (100 in development)
   * - 5 requests per video per user per hour
   */
  getPlayToken: async (videoId: string): Promise<PlayTokenData> => {
    try {
      const response = await api.post<{ success: true; data: PlayTokenData }>(
        `/api/v1/passes/videos/${videoId}/play-token`
      );

      if (!response.data.success) {
        throw new PlaybackError('SERVER_ERROR', 'Failed to get playback URL', 500);
      }

      return response.data.data;
    } catch (error: any) {
      // Handle axios error responses
      if (error.response) {
        const { status, data } = error.response;
        const errorCode: PlayTokenErrorCode = data?.error?.code || 'SERVER_ERROR';
        const errorMessage = data?.error?.message || 'Failed to get playback URL';
        throw new PlaybackError(errorCode, errorMessage, status);
      }

      // Re-throw PlaybackError as-is
      if (error instanceof PlaybackError) {
        throw error;
      }

      // Wrap other errors
      throw new PlaybackError('SERVER_ERROR', 'Failed to get playback URL', 500);
    }
  },
  
  /**
   * Get all passes purchased by the current user
   * Requires authentication
   */
  getPurchasedPasses: async (): Promise<Pass[]> => {
    const response = await api.get<Pass[]>('/api/v1/passes/me');
    return response.data;
  },
  
  /**
   * Check the status of a Stripe checkout session
   * @param sessionId Stripe checkout session ID
   */
  getCheckoutStatus: async (sessionId: string): Promise<PurchaseStatus> => {
    const response = await api.get<PurchaseStatus>(
      `/api/v1/passes/purchase/status/${sessionId}`
    );
    return response.data;
  },

  /**
   * Create a new pass for monetization
   * @param data Pass creation data including title, price, and source URL(s)
   * @returns The newly created pass
   */
  createPass: async (data: CreatePassRequest): Promise<Pass> => {
    // Simple deterministic hash from payload to dedupe accidental double-submits client-side
    const payloadString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < payloadString.length; i++) {
      hash = ((hash << 5) - hash) + payloadString.charCodeAt(i);
      hash |= 0; // 32-bit
    }
    const idempotencyKey = `pass-create-${Math.abs(hash)}`;
    const response = await api.post<Pass>('/api/v1/passes', data, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
    return response.data;
  },
  
  /**
   * Get all passes created by the current user
   * Requires authentication
   */
  getCreatorPasses: async (): Promise<Pass[]> => {
    const response = await api.get<Pass[]>('/api/v1/passes/creator/all');
    return response.data;
  },
  
  /**
   * Add a new video to an existing pass
   * @param passId Pass ID to add the video to
   * @param data Video source URL data
   * @returns The updated pass with the new video
   */
  addVideoToPass: async (passId: string, data: AddVideoRequest): Promise<Pass> => {
    const response = await api.post<Pass>(`/api/v1/passes/${passId}/videos`, data);
    return response.data;
  },

  /**
   * Discover available passes with filtering options
   * @param params Discovery parameters and filters
   */
  discoverPasses: async (params: DiscoverPassesParams = {}): Promise<DiscoverPassesResponse> => {
    // Convert params object to URL query parameters
    const queryParams = new URLSearchParams();
    
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.tier) queryParams.append('tier', params.tier);
    if (params.price_min !== undefined) queryParams.append('price_min', params.price_min.toString());
    if (params.price_max !== undefined) queryParams.append('price_max', params.price_max.toString());
    if (params.platform) queryParams.append('platform', params.platform);
    if (params.channel_id) queryParams.append('channel_id', params.channel_id);
    if (params.sold_out !== undefined) queryParams.append('sold_out', params.sold_out.toString());
    
    const url = `/api/v1/passes/discover${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<DiscoverPassesResponse>(url);
    return response.data;
  }
};

/**
 * Creates a new content pass
 */
export const createContentPass = async (passData: CreatePassRequest): Promise<PassDetailsResponse> => {
  const executeCreate = async () => {
    const response = await api.post<PassDetailsResponse>('/api/v1/passes', passData);
    return response.data;
  };

  try {
    return await retryWithBackoff(executeCreate, 2, 1000);
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'create content pass',
      component: 'passAPI',
      additionalData: { 
        title: passData.title,
        price_cents: passData.price_cents
      }
    });

    // Handle specific pass creation errors
    if (userError.code === ErrorCode.VALIDATION_ERROR) {
      if (error instanceof Error && error.message.includes('price')) {
        userError.message = 'Invalid price. Please check the pricing format.';
      } else if (error instanceof Error && error.message.includes('title')) {
        userError.message = 'Pass title is required and must be unique.';
      }
    } else if (userError.code === ErrorCode.FORBIDDEN) {
      userError.message = 'You don\'t have permission to create passes for this channel.';
    }

    throw userError;
  }
};

/**
 * Purchases a content pass by creating checkout session
 */
export const purchaseContentPass = async (passId: string): Promise<CheckoutSessionResponse> => {
  const executePurchase = async () => {
    const response = await api.post<CheckoutSessionResponse>(`/api/v1/passes/${passId}/purchase`);
    return response.data;
  };

  try {
    // Don't retry purchases to avoid double charging
    return await executePurchase();
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'purchase content pass',
      component: 'passAPI',
      additionalData: { passId }
    });

    // Handle specific purchase errors
    if (userError.code === ErrorCode.NOT_FOUND) {
      userError.code = ErrorCode.PASS_NOT_FOUND;
      userError.message = 'Content pass not found or no longer available.';
    } else if (userError.code === ErrorCode.VALIDATION_ERROR) {
      if (error instanceof Error && error.message.includes('sold out')) {
        userError.message = 'This content pass is sold out.';
      }
    }

    throw userError;
  }
};

/**
 * Gets user's purchased passes
 */
export const getUserPasses = async (): Promise<Pass[]> => {
  const fetchUserPasses = async () => {
    const response = await api.get<{ data: Pass[] }>('/api/v1/passes/my');
    return response.data.data;
  };

  try {
    return await retryWithBackoff(fetchUserPasses, 2, 1000);
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'fetch user passes',
      component: 'passAPI'
    });

    throw userError;
  }
};

/**
 * Checks if user has access to specific content
 */
export const checkPassAccess = async (passId: string): Promise<boolean> => {
  const checkAccess = async () => {
    const response = await api.get<{ hasAccess: boolean }>(`/api/v1/passes/${passId}/access`);
    return response.data.hasAccess;
  };

  try {
    return await retryWithBackoff(checkAccess, 2, 1000);
  } catch (error) {
    const userError = handleApiError(error, {
      action: 'check pass access',
      component: 'passAPI',
      additionalData: { passId }
    });

    // Handle access check errors gracefully
    if (userError.code === ErrorCode.NOT_FOUND) {
      userError.code = ErrorCode.INSUFFICIENT_ACCESS;
      userError.message = 'You need to purchase a content pass to access this content.';
    } else if (userError.code === ErrorCode.UNAUTHORIZED) {
      userError.message = 'Please sign in to check your pass access.';
    }

    throw userError;
  }
}; 
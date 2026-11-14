import api from './index';
import {
  Pass,
  PassDetailsResponse,
  DiscoverPassesResponse,
  DiscoverPassesParams,
  CreatePassRequest,
  UpdateDraftPassRequest,
  PublishPassRequest,
  AddVideoRequest,
  CheckoutSessionResponse,
  SignedUrlResponse,
  PurchaseStatus,
  PlayTokenData,
  PlayTokenErrorCode
} from '../types/pass';
import { getPassErrorMessage, PassErrorResult } from '../utils/passErrorMessages';
import type { PassVideo } from '../types/pass';
import type {
  PassWatchEndBody,
  PassWatchProgressBody,
  PassWatchStartBody,
  PassWatchStartResult,
  PassWatchTransport,
} from '../utils/passWatchTracker';

export class PassApiError extends Error {
  readonly code: string | null;
  readonly action: PassErrorResult['action'];
  readonly canRetry: boolean;

  constructor(result: PassErrorResult) {
    super(result.message);
    this.name = 'PassApiError';
    this.code = result.code;
    this.action = result.action;
    this.canRetry = result.canRetry;
  }
}

/** POST /api/v1/passes — `data` is canonical; top-level fields are compat shim */
export interface PassCreateApiResponse {
  success: boolean;
  data?: Partial<Pass> & { checkout_url?: string; videos?: PassVideo[] };
  id?: string;
  slug?: string;
  checkout_url?: string;
  videos?: PassVideo[];
}

export function normalizePassCreateResponse(body: PassCreateApiResponse): Pass {
  if (body.success === false) {
    throw new PassApiError(getPassErrorMessage(body));
  }

  const fromData =
    body.data && typeof body.data === 'object' ? body.data : (body as Partial<Pass>);

  const id = fromData.id ?? body.id;
  if (!id) {
    throw new PassApiError({
      code: null,
      message: 'Invalid pass create response from server.',
      action: null,
      canRetry: false,
    });
  }

  const checkout_url =
    (fromData as { checkout_url?: string }).checkout_url ?? body.checkout_url;

  return {
    title: '',
    description: '',
    price_cents: 0,
    currency: 'USD',
    formatted_price: '',
    tier: 'bronze',
    channel: { name: '', user: { username: '' } },
    ...fromData,
    id,
    slug: fromData.slug ?? body.slug,
    videos: fromData.videos ?? body.videos ?? [],
    ...(checkout_url ? { checkout_url } : {}),
  } as Pass;
}

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
    passId: string,
    consent?: import('../constants/passConsent').SaleConsentPayload,
    quantity?: number
  ): Promise<CheckoutSessionResponse> => {
    const response = await api.post<CheckoutSessionResponse>(
      `/api/v1/passes/${passId}/checkout`,
      {
        ...(consent ?? {}),
        ...(quantity != null ? { quantity } : {}),
      }
    );
    return response.data;
  },

  /**
   * Count one view of a pass's public sales page (public, no auth → 204).
   * Fire-and-forget: `keepalive` so it survives a quick navigation away, no
   * credentials, and every failure is swallowed — it must never affect the page.
   */
  recordPassVisit: (
    passId: string,
    body: { visitorKey: string; attribution?: import('../utils/attribution').AttributionPayload }
  ): void => {
    if (typeof fetch !== 'function') return;
    try {
      const base = (api.defaults.baseURL ?? '').replace(/\/$/, '');
      void fetch(`${base}/api/v1/passes/${encodeURIComponent(passId)}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'omit',
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // never break the page for a visit count
    }
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
      // Backend shape: { success, data: { signed_url } }
      return response.data.data.signed_url;
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
    const payloadString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < payloadString.length; i++) {
      hash = (hash << 5) - hash + payloadString.charCodeAt(i);
      hash |= 0;
    }
    const idempotencyKey = `pass-create-${Math.abs(hash)}`;

    try {
      const response = await api.post<PassCreateApiResponse>('/api/v1/passes', data, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      return normalizePassCreateResponse(response.data);
    } catch (error: unknown) {
      throw new PassApiError(getPassErrorMessage(error));
    }
  },
  
  /**
   * Get all passes created by the current user
   * Requires authentication
   */
  getCreatorPasses: async (): Promise<Pass[]> => {
    const response = await api.get<Pass[]>('/api/v1/passes/creator/all');
    return response.data;
  },

  getStripeConnectStatus: async (channelId?: number | null): Promise<{
    accountId: string | null;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    ready: boolean;
    country?: string | null;
    onboardingUrl?: string;
  }> => {
    // No channelId = the account's first channel (the server default).
    const response = await api.get('/api/v1/passes/creator/stripe-connect', {
      params: channelId ? { channelId } : undefined,
    });
    return response.data;
  },

  startStripeConnectOnboarding: async (body: {
    /** ISO 3166-1 alpha-2; required the first time, fixed for the account's life. */
    country?: string;
    /** Drop a not-yet-live account and start again (wrong country). */
    restart?: boolean;
    /** Which of your channels (default: your first channel). */
    channelId?: number;
    /** Where Stripe sends you back (default: the pass list). */
    returnTo?: 'passes' | 'business' | 'payouts';
  } = {}): Promise<{
    accountId: string | null;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    ready: boolean;
    country?: string | null;
    onboardingUrl?: string;
  }> => {
    const response = await api.post('/api/v1/passes/creator/stripe-connect', body);
    return response.data;
  },

  updateDraftPass: async (passId: string, data: UpdateDraftPassRequest): Promise<Pass> => {
    try {
      const response = await api.patch<PassCreateApiResponse>(`/api/v1/passes/${passId}`, data);
      return normalizePassCreateResponse(response.data);
    } catch (error: unknown) {
      throw new PassApiError(getPassErrorMessage(error));
    }
  },

  publishPass: async (passId: string, data: PublishPassRequest = {}): Promise<Pass> => {
    try {
      const response = await api.post<PassCreateApiResponse>(`/api/v1/passes/${passId}/publish`, data);
      return normalizePassCreateResponse(response.data);
    } catch (error: unknown) {
      throw new PassApiError(getPassErrorMessage(error));
    }
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
export const createContentPass = async (
  passData: CreatePassRequest
): Promise<PassDetailsResponse> => {
  try {
    const pass = await passApi.createPass(passData);
    return { success: true, data: pass };
  } catch (error: unknown) {
    if (error instanceof PassApiError) {
      throw error;
    }
    throw new PassApiError(getPassErrorMessage(error));
  }
};

const passVideoWatchPath = (passVideoId: string): string =>
  `/api/v1/pass-videos/${encodeURIComponent(passVideoId)}/watch`;

/**
 * Opens a play session for a pass video (POST …/watch/start, signed in).
 * `passVideoId` is the PassVideo id (`pass.videos[].id`). 401 / 403 / 404 /
 * 429 reject with the axios error; src/utils/passWatchTracker.ts reads them.
 */
export const startPassVideoWatch = async (
  passVideoId: string,
  body: PassWatchStartBody
): Promise<PassWatchStartResult> => {
  const response = await api.post<{ success: boolean; data: PassWatchStartResult }>(
    `${passVideoWatchPath(passVideoId)}/start`,
    body
  );
  return response.data.data;
};

/**
 * Heartbeat of a play session (POST …/watch/progress, signed in).
 * `playedSeconds` is the cumulative time actually played in the session.
 * 404 WATCH_SESSION_NOT_FOUND: the session is gone, start a new one.
 */
export const sendPassVideoWatchProgress = async (
  passVideoId: string,
  body: PassWatchProgressBody
): Promise<void> => {
  await api.post(`${passVideoWatchPath(passVideoId)}/progress`, body);
};

/**
 * Closes a play session with `navigator.sendBeacon` (POST …/watch/end): a
 * normal request does not survive the page going away, and a beacon cannot
 * carry the Authorization header — the session id is the credential. The body
 * is text/plain JSON (no CORS preflight). Returns false when the browser did
 * not queue it.
 */
export const sendPassVideoWatchEndBeacon = (passVideoId: string, body: PassWatchEndBody): boolean => {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return false;
  }
  try {
    const base = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
    const blob = new Blob([JSON.stringify(body)], { type: 'text/plain;charset=UTF-8' });
    return navigator.sendBeacon(`${base}${passVideoWatchPath(passVideoId)}/end`, blob);
  } catch {
    return false;
  }
};

/** The network side of the pass player's watch tracker. */
export const passWatchTransport: PassWatchTransport = {
  start: startPassVideoWatch,
  progress: sendPassVideoWatchProgress,
  endBeacon: sendPassVideoWatchEndBeacon,
};

export interface PassVideo {
  id: string;
  thumbnail_url: string;
  platform: 'youtube' | 'twitch' | 'instagram' | 'tiktok' | 'vimeo' | 'other' | string;
  title?: string;
  duration?: number;
  storage_tier?: 'external' | 'standard' | 'premium' | 'cdn' | 'decentralised';
  has_access: boolean;  // Whether user can play this video
  // NOTE: src_url and platform_video_id are no longer returned by the API
  // Use getPlayToken() for external videos (YouTube, etc.)
  // Use getSignedVideoUrl() for S3/CDN hosted videos
}

export interface PassChannel {
  name: string;
  user: {
    username: string;
  };
}

/**
 * Request data for creating a new pass
 */
export interface CreatePassRequest {
  title: string;               // required
  description?: string;        // optional
  price_cents: number;         // required, minimum 100 (= $1.00)
  currency?: string;           // optional, defaults to EUR
  tier?: string;               // optional, defaults to bronze
  supply_cap?: number;         // optional, max number of purchases
  
  /**
   * Single video URL for the pass. Required if videos is not provided.
   * Accepts full URL from supported platforms (YouTube, Twitch, Instagram, TikTok, etc.)
   */
  src_url?: string;
  
  /**
   * Multiple video URLs for the pass. Required if src_url is not provided.
   * Array of objects with video details.
   */
  videos?: Array<{
    src_url: string;   // Required: URL to protect
    title?: string;    // Optional: Video title (fetched from platform or user-provided)
    duration?: number; // Optional: Video duration in seconds
  }>;
}

/**
 * Request data for adding a video to an existing pass
 */
export interface AddVideoRequest {
  src_url: string;             // required, URL to protect
  title?: string;              // optional, title for the video
  duration?: number;           // optional, duration in seconds
}

export interface Pass {
  id: string;
  /** SEO-friendly slug generated from title */
  slug?: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  formatted_price: string;
  tier: string;
  supply_cap?: number;  // Optional number for max supply, null/undefined means unlimited
  minted_count?: number; // Number of passes minted on-chain
  reserved_count?: number; // Number of passes reserved (Stripe purchases pending mint)
  has_access?: boolean;  // Whether user has access to this pass (purchaser or creator)
  channel: {
    name: string;
    user: {
      username: string;
    }
  };
  videos: PassVideo[];
}

// API response for fetching pass details
export interface PassDetailsResponse {
  success: boolean;
  data: Pass;
  message?: string;
}

// API response when creating a Stripe checkout session
export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
}

// API response for fetching a signed video URL
export interface SignedUrlResponse {
  signed_url: string;
}

/**
 * Purchase status response from the /passes/purchase/status/:sessionId endpoint
 */
export interface PurchaseStatus {
  status: 'completed' | 'processing' | 'open' | 'expired';
  purchase_id?: string;
  pass_id?: string;
}

/**
 * Parameters for discovering passes
 */
export interface DiscoverPassesParams {
  limit?: number;
  offset?: number;
  search?: string;
  tier?: 'bronze' | 'silver' | 'gold' | string;
  price_min?: number;
  price_max?: number;
  platform?: string;
  channel_id?: string;
  sold_out?: boolean;
}

/**
 * Response from the discover passes endpoint
 */
export interface DiscoverPassesResponse {
  data: Pass[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// ============================================
// Play Token Types (Secure Video URL System)
// ============================================

/**
 * Play token data returned when user initiates video playback
 */
export interface PlayTokenData {
  video_id: string;
  playback_url: string;
  embed_url: string | null;
  platform: string;
  token: string;
  expires_at: string;
  expires_in_seconds: number;
}

/**
 * Successful play token API response
 */
export interface PlayTokenResponse {
  success: true;
  data: PlayTokenData;
}

/**
 * Play token error codes
 */
export type PlayTokenErrorCode =
  | 'UNAUTHORIZED'
  | 'NO_ACCESS'
  | 'NOT_FOUND'
  | 'PLAY_TOKEN_RATE_LIMIT_EXCEEDED'
  | 'USE_PLAY_TOKEN'  // Returned when signed-url endpoint is called for external videos
  | 'SERVER_ERROR';

/**
 * Play token error response
 */
export interface PlayTokenErrorResponse {
  success: false;
  error: {
    code: PlayTokenErrorCode;
    message: string;
  };
} 
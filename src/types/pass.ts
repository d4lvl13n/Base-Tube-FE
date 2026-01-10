export interface PassVideo {
  id: string;
  thumbnail_url: string;
  platform: string;
  title?: string;     // Added title field
  duration?: number;  // Explicitly document duration field
  platform_video_id?: string; // Optional platform-specific ID
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
  channel: {
    name: string;
    user: {
      username: string;
    }
  };
  videos: {
    id: string;
    thumbnail_url: string;
    platform: string;
  }[];
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
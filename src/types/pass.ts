export interface PassVideo {
  id: string;
  thumbnail_url: string;
  platform: string;
}

export interface PassChannel {
  name: string;
  user: {
    username: string;
  };
}

export interface Pass {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  formatted_price: string;
  tier: string;
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
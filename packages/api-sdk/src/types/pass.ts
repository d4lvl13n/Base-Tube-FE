/**
 * Content-pass domain types. Mirrors the backend on `main` (Unlock): passes
 * expose `lock_address` / `payment_token`, access checks resolve via the Lock,
 * and video source URLs are never returned (use play-token / signed-url).
 */

export type PassStorageTier = 'external' | 'standard' | 'premium' | 'cdn' | 'decentralised';

export interface PassVideo {
  id: string;
  thumbnail_url: string;
  platform: string;
  title?: string;
  duration?: number;
  storage_tier?: PassStorageTier;
  has_access: boolean;
}

export type PurchaseBlockReasonCode = 'PASS_NOT_ONCHAIN' | 'PASS_SALE_INACTIVE' | 'PASS_SOLD_OUT' | string;

export interface Pass {
  id: string;
  slug?: string;
  onchain_pass_id?: number | null;
  /** Unlock Lock address (main/Unlock backend). */
  lock_address?: string | null;
  /** ERC-20 used to price the Lock (USDC). */
  payment_token?: string | null;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  formatted_price: string;
  tier: string;
  supply_cap?: number;
  minted_count?: number;
  has_access?: boolean;
  can_purchase?: boolean;
  purchase_block_reason_code?: PurchaseBlockReasonCode | null;
  purchase_block_reason?: string | null;
  channel: { name: string; user: { username: string } };
  videos: PassVideo[];
}

export interface PassDetailsResponse {
  success: boolean;
  data: Pass;
  message?: string;
}

/** `POST /api/v1/passes/:id/checkout` (Stripe). */
export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
  reservation_id?: string;
  expires_at?: string;
  purchase_id?: string;
}

/** `GET /api/v1/passes/videos/:id/signed-url` → `{ success, data: { signed_url } }`. */
export interface SignedUrlResponse {
  signed_url: string;
}

/** `POST /api/v1/passes/videos/:id/play-token` → `{ success, data }`. */
export interface PlayTokenData {
  video_id: string;
  playback_url: string;
  embed_url: string | null;
  platform: string;
  token: string;
  expires_at: string;
  expires_in_seconds: number;
}

export type PurchaseStatusValue =
  | 'reserved'
  | 'pending'
  | 'processing'
  | 'minting'
  | 'minted'
  | 'claiming'
  | 'claimed'
  | 'completed'
  | 'open'
  | 'expired'
  | 'failed';

export interface PurchaseStatus {
  status: PurchaseStatusValue;
  purchase_id?: string;
  pass_id?: string;
  reservation_id?: string;
  expires_at?: string;
}

export interface DiscoverPassesParams {
  limit?: number;
  offset?: number;
  search?: string;
  tier?: string;
  price_min?: number;
  price_max?: number;
  platform?: string;
  channel_id?: string;
  sold_out?: boolean;
}

export interface DiscoverPassesResponse {
  data: Pass[];
  pagination: { total: number; limit: number; offset: number; hasMore?: boolean };
}

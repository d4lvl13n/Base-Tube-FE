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

/** One tier of a price grid: how many passes exist at this price (minor units). */
export interface PassPriceTier {
  size: number;
  priceCents: number;
}

export type PassPricingState = 'on_sale' | 'all_reserved' | 'sold_out';

/**
 * `pricing` on every pass answer (additive, backend 2026-11-14). A creator
 * sells at one price (`mode: 'single'`) or at a price that rises by tiers
 * (`mode: 'tiered'`). `price_cents` keeps showing the price in force.
 */
export interface PassPricing {
  mode: 'single' | 'tiered';
  state: PassPricingState;
  currentPriceCents: number | null;
  leftAtCurrentPrice: number | null;
  nextPriceCents: number | null;
  /** Only when `all_reserved`. */
  retryAfterSeconds: number | null;
  /** [] for a single price. */
  tiers: Array<PassPriceTier & { state: 'sold' | 'current' | 'upcoming' }>;
}

/** `resale_eligibility` on `GET /passes/me` and `resale` on `GET /purchases/:id/status`. */
export interface PassResaleEligibility {
  eligible: boolean;
  eligibleAt: string | null;
  blockedBy: 'NOT_CLAIMED' | 'WAITING_PERIOD' | 'CARD_HOLD' | null;
  opensEarlierIfSoldOut: boolean;
}

/**
 * Checkout refusals of the tiered-pricing contract (409, `error.code`).
 * `CLIENT_UPDATE_REQUIRED`: a tiered pass bought without `expectedUnitPriceCents`.
 */
export type PassCheckoutPriceCode =
  | 'PRICE_CHANGED'
  | 'QUANTITY_SPANS_PRICE_TIERS'
  | 'PASS_ALL_RESERVED'
  | 'CLIENT_UPDATE_REQUIRED';

/**
 * True when the pass sells at a price that rises by tiers. A client that
 * cannot show a "the price is now …" confirmation must send buyers to the
 * website to buy such a pass (the API refuses CLIENT_UPDATE_REQUIRED otherwise).
 */
export const isTieredPricing = (pass: { pricing?: PassPricing | null } | null | undefined): boolean =>
  pass?.pricing?.mode === 'tiered';

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
  /** Remaining keys that can still be bought (null = no cap). Additive; do not send reserved_count. */
  available_count?: number | null;
  /** The pass's page on the website (always sent by the API). */
  checkout_url?: string;
  /** The price on offer, what is left at it and the grid (additive). */
  pricing?: PassPricing | null;
  /** The stored grid; null for one price (additive). */
  price_tiers?: PassPriceTier[] | null;
  /** `GET /passes/me`: when the holder can list this pass for resale (additive). */
  resale_eligibility?: PassResaleEligibility | null;
  has_access?: boolean;
  can_purchase?: boolean;
  purchase_block_reason_code?: PurchaseBlockReasonCode | null;
  purchase_block_reason?: string | null;
  channel: { name: string; user: { username: string } };
  videos: PassVideo[];
  purchased_at?: string | null;
  sale_consent?: {
    terms_version: string;
    terms_hash: string;
    terms_text: string;
    withdrawal_version: string;
    withdrawal_hash: string;
    withdrawal_text: string;
  };
}

export interface PassDetailsResponse {
  success: boolean;
  data: Pass;
  message?: string;
}

export interface CheckoutConsent {
  accepted_terms: boolean;
  accepted_withdrawal: boolean;
  terms_version: string;
  withdrawal_version: string;
  terms_hash?: string;
  withdrawal_hash?: string;
}

/** `POST /api/v1/passes/:id/checkout` (Stripe). */
export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
  reservation_id?: string;
  expires_at?: string;
  purchase_id?: string;
  /** What the checkout charges (additive). */
  unitPriceCents?: number;
  quantity?: number;
  totalCents?: number;
  reservationExpiresAt?: string;
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

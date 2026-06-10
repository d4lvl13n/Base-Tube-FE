import { StandardApiResponse } from '../types/error';

export type OnchainPurchaseStatus =
  | 'reserved'
  | 'pending'
  | 'processing'
  | 'minting'
  | 'minted'
  | 'claiming'
  | 'claimed'
  | 'completed'
  | 'expired'
  | 'failed'
  | 'refunded'
  | 'disputed';

export interface OnchainPurchasePassSummary {
  id: string;
  title: string;
  description?: string | null;
  supplyCap?: number | null;
  mintedCount: number;
  reservedCount?: number;
}

export interface OnchainPurchaseStatusData {
  status: OnchainPurchaseStatus;
  purchaseId: string;
  passId: string;
  priceCents: number;
  currency: string;
  paymentType: 'stripe' | 'crypto';
  stripePaymentId?: string | null;
  paymentHash?: string | null;
  txHash?: string | null;
  mintTxHash?: string | null;
  claimTxHash?: string | null;
  mintTxUrl?: string | null;
  claimTxUrl?: string | null;
  ownerAddress?: string | null;
  reservationExpiresAt?: string | null;
  lastStatusReason?: string | null;
  lastCheckedAt?: string | null;
  pass?: OnchainPurchasePassSummary | null;
}

export type OnchainPurchaseStatusResponse = StandardApiResponse<OnchainPurchaseStatusData>;

export interface OnchainAccessData {
  passId: string;
  hasAccess: boolean;
  ledgerBalance: string;
  vaultBalance: string;
  source: 'cache' | 'chain';
  timestamp: number; // ms since epoch
}

export type OnchainAccessResponse = StandardApiResponse<OnchainAccessData>;
export type OnchainAccessListResponse = StandardApiResponse<OnchainAccessData[]>;

export interface OnchainClaimRequest {
  purchaseId: string;
  walletAddress: string;
}

export interface OnchainClaimData {
  purchaseId: string;
  passId: string;
  status: 'success' | 'already_minted' | 'failed';
  txHash?: string | null;
}

export type OnchainClaimResponse = StandardApiResponse<OnchainClaimData>; 


// ---- Crypto purchase (optional quote flow) ----
// ---- Crypto purchase confirm (post-receipt finalization) ----

/**
 * UI phase state-machine for the client-side crypto purchase flow.
 * Kept in sync with persisted context in checkoutStorage.
 */
export type CryptoPurchasePhase =
  | 'idle'
  | 'reserving'            // Getting signed quote from backend
  | 'awaiting-signature'   // Wallet is prompting user to sign
  | 'tx-pending'           // Tx broadcast, waiting for receipt
  | 'confirming'           // POST /crypto/confirm in flight (with retries)
  | 'polling'              // Confirm exhausted / skipped — falling back to /status polling
  | 'completed'
  | 'failed';

export interface CryptoConfirmData {
  purchaseId: string;
  passId: string;
  status: OnchainPurchaseStatus;
  txHash: string;
  ownerAddress?: string | null;
  alreadyConfirmed?: boolean;
}

export type CryptoConfirmResponse = StandardApiResponse<CryptoConfirmData>;

// Quote returned by backend for onchain purchase
/**
 * Crypto checkout payload (Unlock flow). The backend reserves supply + creates a
 * pending purchase and returns the Lock address + USDC token + per-key price so the
 * client can approve() then Lock.purchase(). No signed price quote — the Lock
 * enforces price on-chain.
 */
export interface CryptoQuote {
  buyer: string;
  purchase_id: string;
  reservation_id?: string;
  expires_at?: string;
  lock_address: string;     // Unlock PublicLock for this pass
  payment_token: string;    // USDC address
  key_price: string;        // USDC raw units (6 decimals)
  chain_id: number;
}

// ---- Pending Purchases (Stripe purchases awaiting wallet mint) ----

export interface PendingPurchase {
  id: string;
  passId: string;
  status: 'pending' | 'minting' | 'claimed' | 'completed' | 'claiming';
  priceCents: number;
  currency: string;
  createdAt: string;
  reservationExpiresAt?: string | null;
  pass: {
    id: string;
    title: string;
    description?: string | null;
    tier: string;
    slug?: string;
  };
}

export interface PendingPurchasesData {
  purchases: PendingPurchase[];
}

export type PendingPurchasesResponse = StandardApiResponse<PendingPurchasesData>;

export interface MintPendingRequest {
  walletAddress: string;
}

export interface MintResult {
  purchaseId: string;
  passId: string;
  status: 'success' | 'failed' | 'already_minted';
  txHash?: string;
  error?: string;
}

export interface MintPendingData {
  minted: MintResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    alreadyMinted: number;
  };
}

export type MintPendingResponse = StandardApiResponse<MintPendingData>

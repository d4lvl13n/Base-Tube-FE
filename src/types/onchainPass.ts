import { StandardApiResponse } from '../types/error';

export type OnchainPurchaseStatus =
  | 'pending'
  | 'processing'
  | 'minting'
  | 'minted'
  | 'claiming'
  | 'claimed'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'disputed';

export interface OnchainPurchasePassSummary {
  id: string;
  title: string;
  description?: string | null;
  supplyCap?: number | null;
  mintedCount: number;
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
}

export type OnchainClaimResponse = StandardApiResponse<null | { success?: boolean }>; 


// ---- Crypto purchase (optional quote flow) ----
export interface CryptoQuoteData {
  // EIP-712 typed data or pre-hashed digest to sign
  typedData?: Record<string, any> | null;
  digest?: string | null;
  // Minimum price protection in wei (string to avoid JS precision issues)
  minPriceWei?: string | null;
  deadline?: number | null; // epoch ms or seconds depending on backend
  chainId?: number | null;
}

export type CryptoQuoteResponse = StandardApiResponse<CryptoQuoteData>;

export interface CryptoPurchaseRequest {
  address: string;
  // If backend expects typed data signature
  signature?: string;
  // Echo back to backend for verification
  digest?: string | null;
  typedData?: Record<string, any> | null;
  minPriceWei?: string | null;
}

export interface CryptoPurchaseData {
  // Backend may immediately return identifiers/tx info
  purchaseId?: string | null;
  purchase_id?: string | null;
  mintTxHash?: string | null;
  mint_tx_hash?: string | null;
  mintTxUrl?: string | null;
  mint_tx_url?: string | null;
}

export type CryptoPurchaseResponse = StandardApiResponse<CryptoPurchaseData>;

// Quote returned by backend for onchain purchase
export interface CryptoQuote {
  buyer: string;
  passId: number;
  quantity: number;
  minPriceWei: string;
  validUntil: number;
  nonce: string; // 0x…32
  signature: string; // 0x…65
  digest: string; // 0x…32
}

// ---- Pending Purchases (Stripe purchases awaiting wallet mint) ----

export interface PendingPurchase {
  id: string;
  passId: string;
  status: 'pending' | 'minting';
  priceCents: number;
  currency: string;
  createdAt: string;
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


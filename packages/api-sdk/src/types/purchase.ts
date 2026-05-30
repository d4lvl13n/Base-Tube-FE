/** Purchase / access / claim domain types (Brief §C.7–C.8). */

export interface AccessState {
  passId: string;
  hasAccess: boolean;
  ledgerBalance?: string;
  vaultBalance?: string;
  source?: 'cache' | 'chain' | 'db';
  timestamp?: number;
}

export interface PendingPurchase {
  purchaseId: string;
  passId: string;
  passTitle?: string;
  status: string;
  priceCents?: number;
  currency?: string;
  createdAt?: string;
}

export interface PurchaseStatusData {
  purchaseId: string;
  passId: string;
  status: string;
  txHash?: string | null;
  ownerAddress?: string | null;
  paymentType?: 'stripe' | 'crypto';
}

export interface ClaimResult {
  purchaseId: string;
  passId: string;
  status: 'success' | 'failed' | 'already_minted' | string;
  txHash?: string;
  error?: string;
}

export interface MintPendingSummary {
  total: number;
  successful: number;
  failed: number;
  alreadyMinted?: number;
}

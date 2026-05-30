import type { AxiosInstance } from 'axios';
import type { SuccessEnvelope } from '../types/common';
import type { AccessState, ClaimResult, MintPendingSummary, PendingPurchase, PurchaseStatusData } from '../types/purchase';

/** Access checks (Brief §C.7). */
export function createAccessApi(http: AxiosInstance) {
  return {
    /** `GET /api/v1/access?passId=` (auth) */
    async get(passId: string): Promise<AccessState> {
      const res = await http.get<SuccessEnvelope<AccessState>>('/api/v1/access', { params: { passId } });
      return res.data.data;
    },

    /** `GET /api/v1/access/list` (auth) */
    async list(): Promise<AccessState[]> {
      const res = await http.get<SuccessEnvelope<AccessState[]>>('/api/v1/access/list');
      const data = res.data?.data as any;
      return Array.isArray(data) ? data : (data?.passes ?? []);
    },
  };
}

/** Purchases / mint / claim (Brief §C.8). */
export function createPurchasesApi(http: AxiosInstance) {
  return {
    /** `GET /api/v1/purchases/pending` (auth) — Stripe purchases awaiting a wallet. */
    async pending(): Promise<PendingPurchase[]> {
      const res = await http.get<SuccessEnvelope<{ purchases: PendingPurchase[] }>>('/api/v1/purchases/pending');
      return res.data?.data?.purchases ?? [];
    },

    /** `GET /api/v1/purchases/:id/status` (auth) */
    async status(purchaseId: string): Promise<PurchaseStatusData> {
      const res = await http.get<SuccessEnvelope<PurchaseStatusData>>(`/api/v1/purchases/${purchaseId}/status`);
      return res.data.data;
    },

    /** `POST /api/v1/purchases/:id/claim` (auth) — claim a pending purchase to a wallet. */
    async claim(purchaseId: string, walletAddress: string): Promise<ClaimResult> {
      const res = await http.post<SuccessEnvelope<ClaimResult>>(
        `/api/v1/purchases/${purchaseId}/claim`,
        { walletAddress },
        { headers: { 'Idempotency-Key': `claim-${purchaseId}-${walletAddress}` } }
      );
      return res.data.data;
    },

    /** `POST /api/v1/purchases/mint-pending` (auth) — claim all pending to a wallet. */
    async mintPending(walletAddress: string): Promise<{ minted: ClaimResult[]; summary: MintPendingSummary }> {
      const res = await http.post<SuccessEnvelope<{ minted: ClaimResult[]; summary: MintPendingSummary }>>(
        '/api/v1/purchases/mint-pending',
        { walletAddress },
        { headers: { 'Idempotency-Key': `mint-pending-${walletAddress}-${Date.now()}` } }
      );
      return res.data.data;
    },
  };
}

export type AccessApi = ReturnType<typeof createAccessApi>;
export type PurchasesApi = ReturnType<typeof createPurchasesApi>;

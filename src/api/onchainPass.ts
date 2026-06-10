import api from './index';
import axios from 'axios';
import { handleApiError, retryWithBackoff } from '../utils/errorHandler';
import type {
  OnchainPurchaseStatusResponse,
  OnchainAccessResponse,
  OnchainAccessListResponse,
  OnchainClaimRequest,
  OnchainClaimResponse,
  CryptoConfirmResponse,
  PendingPurchasesResponse,
  MintPendingRequest,
  MintPendingResponse,
} from '../types/onchainPass';
import type { CryptoQuote } from '../types/onchainPass';
import { normalizePendingPurchase, normalizePurchaseStatusResponse } from '../utils/purchaseStatus';

export const onchainPassApi = {
  async resolvePurchaseStatusBySession(sessionId: string): Promise<any> {
    const exec = async () => {
      const res = await api.get(`/api/v1/passes/purchase/status/${sessionId}`);
      return res.data;
    };
    try {
      return await retryWithBackoff(exec, 2, 1000);
    } catch (error) {
      throw handleApiError(error, { action: 'Get purchase status by session', component: 'onchainPassApi', additionalData: { sessionId } });
    }
  },

  async getPurchaseStatus(purchaseId: string): Promise<OnchainPurchaseStatusResponse> {
    const exec = async () => {
      const res = await api.get(`/api/v1/purchases/${purchaseId}/status`);
      return normalizePurchaseStatusResponse(res.data);
    };
    try {
      return await retryWithBackoff(exec, 2, 1000);
    } catch (error) {
      throw handleApiError(error, { action: 'Get purchase status', component: 'onchainPassApi', additionalData: { purchaseId } });
    }
  },

  async getAccess(passId: string): Promise<OnchainAccessResponse> {
    const exec = async () => {
      const res = await api.get<OnchainAccessResponse>(`/api/v1/access`, { params: { passId } });
      return res.data;
    };
    try {
      return await retryWithBackoff(exec, 1, 800);
    } catch (error) {
      throw handleApiError(error, { action: 'Get access', component: 'onchainPassApi', additionalData: { passId } });
    }
  },

  async getAccessList(): Promise<OnchainAccessListResponse> {
    const exec = async () => {
      const res = await api.get<OnchainAccessListResponse>(`/api/v1/access/list`);
      return res.data;
    };
    try {
      return await retryWithBackoff(exec, 1, 800);
    } catch (error) {
      throw handleApiError(error, { action: 'Get access list', component: 'onchainPassApi' });
    }
  },

  async claim(request: OnchainClaimRequest): Promise<OnchainClaimResponse> {
    const exec = async () => {
      const idempotencyKey = `${request.purchaseId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await api.post<OnchainClaimResponse>(`/api/v1/purchases/${request.purchaseId}/claim`, {
        walletAddress: request.walletAddress,
      }, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      return res.data;
    };
    try {
      return await retryWithBackoff(exec, 0, 0);
    } catch (error) {
      throw handleApiError(error, { action: 'Claim', component: 'onchainPassApi', additionalData: { purchaseId: request.purchaseId } });
    }
  },
  
  // Optional quote step if backend exposes it
  async getCryptoQuote(passId: string, payload: { buyer: string }): Promise<CryptoQuote> {
    const exec = async () => {
      const res = await api.post(`/api/v1/passes/${passId}/crypto/quote`, payload);
      // Some backends wrap in { success, data }, others return raw object
      return (res.data?.data ?? res.data) as CryptoQuote;
    };
    try {
      // 4xx here is usually terminal (not on-chain / not found / validation),
      // so avoid automatic duplicate quote attempts.
      return await retryWithBackoff(exec, 0, 0);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const payload = error.response?.data as any;
        const rawMessage =
          payload?.error?.message ||
          payload?.error ||
          payload?.message;
        if (typeof rawMessage === 'string' && /not on-?chain/i.test(rawMessage)) {
          throw new Error('This pass is not available for crypto purchase yet.');
        }
      }
      throw handleApiError(error, { action: 'Get crypto quote', component: 'onchainPassApi', additionalData: { passId } });
    }
  },

  /**
   * Finalize a crypto purchase after the on-chain receipt has landed.
   *
   * Backend contract:
   * - 200 → { success: true, data: { purchaseId, passId, status, txHash, ownerAddress, alreadyConfirmed } }
   * - 409 → { success: false, error: "<message>" } — may be transient (retry) or hard conflict
   *
   * We deliberately do NOT wrap this in retryWithBackoff because:
   * - 409s need to be *classified* (transient vs hard conflict) before any retry.
   * - The retry/backoff lives in the caller (confirmWithRetry) so the UI can
   *   drive per-attempt phase updates.
   *
   * Idempotent on the server side for the same (purchaseId, txHash) pair.
   */
  async confirmCryptoPurchase(purchaseId: string, txHash: string): Promise<CryptoConfirmResponse> {
    const res = await api.post<CryptoConfirmResponse>(
      `/api/v1/purchases/${purchaseId}/crypto/confirm`,
      { txHash },
      {
        headers: {
          'Idempotency-Key': `crypto-confirm-${purchaseId}-${txHash}`,
        },
      },
    );
    return res.data;
  },

  /**
   * Get pending purchases awaiting wallet connection for minting
   * These are Stripe purchases that haven't been minted to a wallet yet
   */
  async getPendingPurchases(): Promise<PendingPurchasesResponse> {
    const exec = async () => {
      const res = await api.get('/api/v1/purchases/pending');
      const payload = res.data?.data?.purchases ? res.data.data.purchases : res.data?.purchases ?? [];
      return {
        success: true,
        data: {
          purchases: payload.map(normalizePendingPurchase),
        },
      } as PendingPurchasesResponse;
    };
    try {
      return await retryWithBackoff(exec, 2, 800);
    } catch (error) {
      throw handleApiError(error, { action: 'Get pending purchases', component: 'onchainPassApi' });
    }
  },

  /**
   * Mint all pending purchases to the connected wallet
   * @param walletAddress - The wallet address to mint passes to
   */
  async mintPendingPurchases(payload: MintPendingRequest): Promise<MintPendingResponse> {
    const exec = async () => {
      const idempotencyKey = `mint-pending-${payload.walletAddress}-${Date.now()}`;
      const res = await api.post<MintPendingResponse>('/api/v1/purchases/mint-pending', payload, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });
      return res.data;
    };
    try {
      // No retries for minting to avoid duplicate transactions
      return await retryWithBackoff(exec, 0, 0);
    } catch (error) {
      throw handleApiError(error, { action: 'Mint pending purchases', component: 'onchainPassApi', additionalData: { walletAddress: payload.walletAddress } });
    }
  },
};

export default onchainPassApi;

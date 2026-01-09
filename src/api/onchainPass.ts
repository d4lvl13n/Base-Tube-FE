import api from './index';
import { handleApiError, retryWithBackoff } from '../utils/errorHandler';
import type {
  OnchainPurchaseStatusResponse,
  OnchainAccessResponse,
  OnchainAccessListResponse,
  OnchainClaimRequest,
  OnchainClaimResponse,
  CryptoPurchaseRequest,
  CryptoPurchaseResponse,
  PendingPurchasesResponse,
  MintPendingRequest,
  MintPendingResponse,
} from '../types/onchainPass';
import type { CryptoQuote } from '../types/onchainPass';

export const onchainPassApi = {
  async getPurchaseStatusBySession(sessionId: string): Promise<OnchainPurchaseStatusResponse> {
    const exec = async () => {
      const res = await api.get<OnchainPurchaseStatusResponse>(`/api/v1/passes/purchase/status/${sessionId}`);
      return res.data;
    };
    try {
      return await retryWithBackoff(exec, 2, 1000);
    } catch (error) {
      throw handleApiError(error, { action: 'Get purchase status by session', component: 'onchainPassApi', additionalData: { sessionId } });
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
      const res = await api.post<OnchainClaimResponse>(`/api/v1/claim`, request, {
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
  async getCryptoQuote(passId: string, payload: { buyer: string; quantity: number; validSeconds?: number }): Promise<CryptoQuote> {
    const exec = async () => {
      const res = await api.post(`/api/v1/passes/${passId}/crypto/quote`, payload);
      // Some backends wrap in { success, data }, others return raw object
      return (res.data?.data ?? res.data) as CryptoQuote;
    };
    try {
      return await retryWithBackoff(exec, 1, 500);
    } catch (error) {
      throw handleApiError(error, { action: 'Get crypto quote', component: 'onchainPassApi', additionalData: { passId } });
    }
  },

  // Initiate crypto purchase via backend relayer (expects wallet address and optional signature)
  async buyWithCrypto(passId: string, payload: CryptoPurchaseRequest): Promise<CryptoPurchaseResponse> {
    const exec = async () => {
      const idempotencyKey = `crypto-purchase-${passId}-${Date.now()}`;
      const res = await api.post<CryptoPurchaseResponse>(`/api/v1/passes/${passId}/crypto`, payload, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });
      return res.data;
    };
    try {
      return await retryWithBackoff(exec, 0, 0);
    } catch (error) {
      throw handleApiError(error, { action: 'Buy with crypto', component: 'onchainPassApi', additionalData: { passId, address: payload.address } });
    }
  },

  /**
   * Get pending purchases awaiting wallet connection for minting
   * These are Stripe purchases that haven't been minted to a wallet yet
   */
  async getPendingPurchases(): Promise<PendingPurchasesResponse> {
    const exec = async () => {
      const res = await api.get<PendingPurchasesResponse>('/api/v1/purchases/pending');
      return res.data;
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



import api from './index';
import {
  CreditBalanceResponse,
  CreditCheckoutResponse,
  CreditCheckoutSession,
  CreditInfo,
  CreditLedgerEntry,
  CreditLedgerResponse,
  CreditPack,
  CreditPacksResponse,
  CreditPricingCatalog,
} from '../types/ctr';

const CREDITS_BASE_PATH = '/api/v1/credits';

export const creditsApi = {
  getCreditBalance: async (): Promise<{
    creditInfo: CreditInfo;
    pricing: CreditPricingCatalog | null;
  }> => {
    const response = await api.get<CreditBalanceResponse>(`${CREDITS_BASE_PATH}/balance`);
    // Backend shape: { data: { balance: { balance, reserved, available }, pricing } }
    return {
      creditInfo: response.data.data.balance,
      pricing: response.data.data.pricing ?? null,
    };
  },

  getCreditLedger: async (params?: { limit?: number; offset?: number }): Promise<CreditLedgerEntry[]> => {
    // Backend shape: { data: { balance, pricing, entries: [...], pagination } }, newest first; limit 1–100.
    const response = await api.get<CreditLedgerResponse>(`${CREDITS_BASE_PATH}/ledger`, params ? { params } : undefined);
    return response.data.data.entries;
  },

  // PUBLIC — the buyable credit pack catalog (prices are config-driven server-side).
  getPacks: async (): Promise<CreditPack[]> => {
    // Backend shape: { data: { packs: [{ id, label, credits, priceCents, currency }] } }
    const response = await api.get<CreditPacksResponse>(`${CREDITS_BASE_PATH}/packs`);
    return response.data.data.packs;
  },

  // AUTH — create a Stripe Checkout session for the chosen pack.
  // Returns { sessionId, url, pack }; caller redirects the browser to `url`.
  // `returnPath` (an /ai-thumbnails page) comes back on the success URL as `&return=`.
  createCheckout: async (packId: string, returnPath?: string): Promise<CreditCheckoutSession> => {
    const response = await api.post<CreditCheckoutResponse>(
      `${CREDITS_BASE_PATH}/checkout`,
      returnPath ? { packId, returnPath } : { packId }
    );
    return response.data.data;
  },
};

export default creditsApi;

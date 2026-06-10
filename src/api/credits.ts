import api from './index';
import {
  CreditBalanceResponse,
  CreditInfo,
  CreditLedgerEntry,
  CreditLedgerResponse,
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

  getCreditLedger: async (): Promise<CreditLedgerEntry[]> => {
    // Backend shape: { data: { balance, pricing, entries: [...], pagination } }
    const response = await api.get<CreditLedgerResponse>(`${CREDITS_BASE_PATH}/ledger`);
    return response.data.data.entries;
  },
};

export default creditsApi;

import api from './index';
import { retryWithBackoff, handleApiError } from '../utils/errorHandler';
import type { ContractAbiResponse } from '../types/contracts';

export const contractsApi = {
  async getContentLedgerAbi(): Promise<ContractAbiResponse> {
    const url = process.env.REACT_APP_CONTENT_LEDGER_ABI_URL || '/api/v1/contracts/content-ledger/abi';
    const exec = async () => {
      const res = await api.get(url);
      return (res.data?.data ?? res.data) as ContractAbiResponse;
    };
    try {
      return await retryWithBackoff(exec, 1, 500);
    } catch (error) {
      throw handleApiError(error, { action: 'Get content ledger ABI', component: 'contractsApi' });
    }
  },
};

export default contractsApi;



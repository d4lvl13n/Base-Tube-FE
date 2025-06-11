import { useQuery } from '@tanstack/react-query';
import { getMyWallet } from '../api/profile';
import { UserWallet } from '../types/user';
import { queryKeys } from '../utils/queryKeys';

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.user.wallet(),
    queryFn: async () => {
      const data = await getMyWallet();
      console.log('Wallet data received:', data); // Debug log
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds - wallet data can change frequently
    gcTime: 2 * 60 * 1000, // 2 minutes - shorter cache for financial data
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 (auth issues)
      if (error?.status === 401 || error?.status === 403 || 
          error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      console.error('Wallet fetch error:', error); // Debug log
      return failureCount < 2;
    },
  });
} 
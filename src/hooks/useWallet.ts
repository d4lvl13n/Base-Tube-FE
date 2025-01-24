import { useState, useEffect } from 'react';
import { getMyWallet } from '../api/profile';
import { UserWallet } from '../types/user';

export function useWallet() {
  const [wallet, setWallet] = useState<UserWallet | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setIsLoading(true);
        const data = await getMyWallet();
        console.log('Wallet data received:', data); // Debug log
        setWallet(data);
      } catch (err) {
        console.error('Wallet fetch error:', err); // Debug log
        setError(err instanceof Error ? err : new Error('Failed to fetch wallet'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallet();
  }, []);

  return { wallet, isLoading, error };
} 
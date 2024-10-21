// src/hooks/useFetchData.ts

import { useState, useEffect } from 'react';

interface UseFetchDataOptions<T> {
  apiCall: () => Promise<T>;
}

function useFetchData<T>({ apiCall }: UseFetchDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiCall();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

export default useFetchData;

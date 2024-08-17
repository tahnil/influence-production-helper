// hooks/useProcessesByProductId.ts

import { useState, useCallback } from 'react';
import { InfluenceProcess } from '@/types/influenceTypes';

const fetchProcessesByProductId = async (productId: string): Promise<InfluenceProcess[]> => {
  const response = await fetch(`/api/processes?outputProductId=${productId}`);
  if (response.status !== 200) {
    throw new Error('Failed to fetch processes');
  }
  return response.json();
};

const useProcessesByProductId = () => {
  const [processesByProductId, setProcesses] = useState<InfluenceProcess[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getProcessesByProductId = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProcessesByProductId(productId);
      setProcesses(data);
      return data; // Return the fetched data
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('Unexpected error occurred');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    processesByProductId,
    loading,
    error,
    getProcessesByProductId,
  };
};

export default useProcessesByProductId;

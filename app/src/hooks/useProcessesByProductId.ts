// src/hooks/useProcessesByProductId.ts

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
  const [processes, setProcesses] = useState<InfluenceProcess[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getProcesses = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProcessesByProductId(productId);
      setProcesses(data);
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('Unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    processes,
    loading,
    error,
    getProcesses,
  };
};

export default useProcessesByProductId;

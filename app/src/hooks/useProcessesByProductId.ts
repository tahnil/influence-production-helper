// src/hooks/useProcessesByProductId.ts

import { useState, useEffect } from 'react';
import { Process } from '../types/types';
import { handleApiError } from '../utils/errorHandler';

const useProcessesByProductId = (productId: string) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return; // Exit early if no productId

    const fetchProcessesByProductId = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/processes?outputProductId=${productId}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProcesses(data);
      } catch (error) {
        setError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchProcessesByProductId();
  }, [productId]);

  return { processes, loading, error };
};

export default useProcessesByProductId;

// src/hooks/useProcessesByProductId.ts

import { useState, useEffect } from 'react';
import { InfluenceProcess } from '@/types/influenceTypes';

const useProcessesByProductId = (productId: string) => {
  const [processes, setProcesses] = useState<InfluenceProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) {
      console.log('No productId provided');
      setProcesses([]);
      return; // Exit early if no productId
    }

    const fetchProcessesByProductId = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/processes?outputProductId=${productId}`);
        if (!response.ok) throw new Error('Failed to fetch processes');
        const data = await response.json();
        console.log(`[useProcessesByProductId] Fetched processes: `,data);
        setProcesses(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProcessesByProductId();
  }, [productId]);

  return { processes, loading, error };
};

export default useProcessesByProductId;

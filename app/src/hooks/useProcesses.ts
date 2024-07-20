// src/hooks/useProcesses.ts

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Process } from '../types/types';

// outputProductId = a product that is produced by this process => find processes that yield selected product 
// productId = this is the end product of the process
// inputProductId = maybe add later to retrieve processes that need this input
const useProcesses = (productId?: string, outputProductId?: string) => {
  const [processes, setProcesses] = useState<Process[]>([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let url = '/api/processes';
        if (outputProductId) {
          url += `?outputProductId=${outputProductId}`;
        } else if (productId) {
          url += `?id=${productId}`;
        }
        const response = await axios.get(url);
        setProcesses(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setError('Failed to fetch processes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, outputProductId]);

  return { processes, loading, error };
};

export default useProcesses;

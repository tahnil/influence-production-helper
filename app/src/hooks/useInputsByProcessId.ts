// src/hooks/useInputsByProcessId.ts

import { useState, useCallback } from 'react';
import axios from 'axios';
import { ProcessInput } from '@/types/influenceTypes';

const fetchInputsByProcessId = async (processId: string): Promise<ProcessInput[]> => {
  const response = await axios.get(`/api/processes`, { params: { processId } });
  if (response.status !== 200) {
    throw new Error('[useInputsByProcessId] Failed to fetch inputs');
  }
  return response.data;
};

const useInputsByProcessId = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getInputsByProcessId = useCallback(async (processId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInputsByProcessId(processId);
      // console.log('[useInputsByProcessId] Fetched inputs for ', processId, ': ', data);
      setLoading(false);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('[useInputsByProcessId] Unexpected error occurred');
      }
      setLoading(false);
      return [];
    }
  }, []);

  return {
    getInputsByProcessId,
    loading,
    error,
  };
};

export default useInputsByProcessId;

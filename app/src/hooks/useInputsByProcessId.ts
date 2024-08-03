// src/hooks/useInputsByProcessId.ts

import { useState, useCallback } from 'react';
import axios from 'axios';
import { Input } from '@/types/types';

const fetchInputsByProcessId = async (processId: string): Promise<Input[]> => {
  const response = await axios.get(`/api/processes`, { params: { processId } });
  if (response.status !== 200) {
    throw new Error('[useInputsByProcessId] Failed to fetch inputs');
  }
  return response.data;
};

const useInputsByProcessId = () => {
  const [inputs, setInputs] = useState<Input[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getInputsByProcessId = useCallback(async (processId: string) => {
        setLoading(true);
    setError(null);
    try {
      const data = await fetchInputsByProcessId(processId);
      console.log('[useInputsByProcessId] Fetched inputs for ', processId,': ', data);
      setInputs(data);
      } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('[useInputsByProcessId] Unexpected error occurred');
      }
      } finally {
        setLoading(false);
      }
  }, []);

  return {
    inputs,
    loading,
    error,
    getInputsByProcessId,
  };
};

export default useInputsByProcessId;

// src/hooks/useInputsByProcessId.ts

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from '../types/types';

const useInputsByProcessId = (processId?: string) => {
  const [inputs, setInputs] = useState<Input[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInputsByProcessId = async () => {
      if (!processId) return;

      try {
        setLoading(true);
        const response = await axios.get(`/api/processes`, { params: { processId } });
        setInputs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setError('Failed to fetch inputs');
      } finally {
        setLoading(false);
      }
    };

    fetchInputsByProcessId();
  }, [processId]);

  return { inputs, loading, error };
};

export default useInputsByProcessId;

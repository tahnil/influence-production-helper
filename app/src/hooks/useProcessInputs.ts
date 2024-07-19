// src/hooks/useProcessInputs.ts

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from '../types/types';

const useProcessInputs = (processId: string) => {
  const [inputs, setInputs] = useState<Input[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInputs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/processes/inputs?processId=${processId}`);
        setInputs(response.data);
      } catch (error) {
        setError('Failed to fetch inputs');
      } finally {
        setLoading(false);
      }
    };

    if (processId) {
      fetchInputs();
    } else {
      setInputs([]);
    }
  }, [processId]);

  return { inputs, loading, error };
};

export default useProcessInputs;

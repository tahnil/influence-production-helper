// src/hooks/useConfigureProductionChain.ts

import { useState } from 'react';
import axios from 'axios';
import { ProductionChain } from '../types/types';
import { handleApiError } from '../utils/errorHandler';

const useConfigureProductionChain = () => {
  const [productionChain, setProductionChain] = useState<ProductionChain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configureChain = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/configureProductionChain', data);
      setProductionChain(response.data);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return { productionChain, configureChain, loading, error };
};

export default useConfigureProductionChain;

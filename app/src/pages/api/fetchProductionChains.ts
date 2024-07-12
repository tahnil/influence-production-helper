// src/api/fetchProductionChains.ts

import { ProductionChain } from '../../types/types';

export const fetchProductionChains = async (): Promise<ProductionChain> => {
  const response = await fetch('/api/productionChains');
  if (!response.ok) {
    throw new Error('Error fetching production chains');
  }
  return response.json();
};

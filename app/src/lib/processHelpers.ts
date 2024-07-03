// src/lib/processHelpers.ts
import { Process } from '../types/types';
import { loadProductionChains } from './dataLoader';

export const findProcessesThatYieldProduct = (productId: string): Process[] => {
  const productionChains = loadProductionChains();
  return productionChains.processes.filter(process =>
    process.outputs.some(output => output.productId === productId)
  );
};

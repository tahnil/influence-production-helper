// ./app/src/lib/productUtils.ts

import { Product, Process, SpectralType, ProductWithSpectralTypes } from '../types/types';
import { loadProductionChains } from './dataLoader';

// Load the production chains data
const productionChains = loadProductionChains();

// Helper functions
const getProductById = (id: string): Product | undefined => {
  return productionChains.products.find(product => product.id === id);
};

const getProcessesByProductId = (productId: string): Process[] => {
  return productionChains.processes.filter(process =>
    process.outputs.some(output => output.productId === productId)
  );
};

const getSpectralTypesByProcessIds = (processIds: string[]): SpectralType[] => {
  return productionChains.spectralTypes.filter(spectralType =>
    spectralType.processes.some(processId => processIds.includes(processId))
  );
};

// Public API functions
export const fetchProductById = async (id: string): Promise<ProductWithSpectralTypes | undefined> => {
  const product = getProductById(id);
  if (!product) {
    return undefined;
  }

  if (product.type === 'Raw Material') {
    const processes = getProcessesByProductId(id);
    const processIds = processes.map(process => process.id);
    const spectralTypes = getSpectralTypesByProcessIds(processIds);
    return {
      ...product,
      spectralTypes: spectralTypes.map(st => ({ id: st.id, name: st.name }))
    };
  }

  return product;
};

export const fetchAllProducts = async () => {
  return productionChains.products;
};

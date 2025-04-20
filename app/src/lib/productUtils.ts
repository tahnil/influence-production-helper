// lib/productUtils.ts

import { loadProductionChains } from './dataLoader';
import { InfluenceProduct, InfluenceProcess, SpectralType, ProductWithSpectralTypes } from '@/types/influenceTypes';

// Load the production chains data
const productionChains = loadProductionChains();

// Helper functions
const getProductById = (id: string): InfluenceProduct => {
  const product = productionChains.products.find(product => product.id === id);
  if (!product) {
    throw new Error(`[productUtils.ts] Product with ID "${id}" not found.`);
  }
  return product;
};

const getProcessesByProductId = (productId: string): InfluenceProcess[] => {
  const process = productionChains.processes
    .filter(process =>
      process.outputs.some(output => output.productId === productId));
  if (!process) {
    throw new Error(`[productUtils.ts] Process with product ID "${productId}" not found.`);
  }
  return process;
};

const getSpectralTypesByProcessIds = (processIds: string[]): SpectralType[] => {
  if (!productionChains.spectralTypes) {
    throw new Error('[productUtils.ts] No spectral types found.');
  }
  const spectralTypes = productionChains.spectralTypes
    .filter(spectralType =>
      spectralType.processes.some(processId => processIds.includes(processId))
    )
  if (!spectralTypes) {
    throw new Error('[productUtils.ts] No spectral types found.');
  }
  return spectralTypes;
};

// Public API functions
export const fetchProductById = async (id: string): Promise<ProductWithSpectralTypes> => {
  const product = getProductById(id);
  if (!product) {
    throw new Error(`[productUtils.ts > fetchProductById] Product with ID "${id}" not found.`);
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
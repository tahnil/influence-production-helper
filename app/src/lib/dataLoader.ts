// src/lib/dataLoader.ts:

import path from 'path';
import fs from 'fs';
import { ProductionChain, Product, SpectralType, Process } from '../types/types';

const productionChainsPath = path.resolve(process.cwd(), 'src/sdk/productionChains.json'); // adjust path to correct path, e. g. ./sdk/productionChains.json (msl)

let productionChains: ProductionChain | undefined;

export const loadProductionChains = (): ProductionChain => {
  if (!productionChains) {
    try {
      const data = fs.readFileSync(productionChainsPath, 'utf8');
      productionChains = JSON.parse(data);
      console.log('Production chains data loaded successfully.');
    } catch (error) {
      console.error('Error reading or parsing productionChains.json:', error);
      throw new Error('Failed to load production chains data');
    }
  }

  if (!productionChains) {
    throw new Error('Production chains data is not available');
  }
  
  return productionChains;
};

export const productMap = new Map(
  loadProductionChains().products.map(product => [product.id, product.name])
);

export const processMap = new Map(
  loadProductionChains().processes.map(process => [process.id, process])
);

// Utility functions to get products, processes, and spectral types

export const getAllProducts = async () => {
  console.log('Loading production chains');
  const productionChains = loadProductionChains();
  console.log('Production chains loaded', productionChains.products);
  return productionChains.products;
};

export const getProductById = (id: string): Product | undefined => {
  return loadProductionChains().products.find(product => product.id === id);
};

export const getProcessesByProductId = (productId: string): Process[] => {
  return loadProductionChains().processes.filter(process =>
    process.outputs.some(output => output.productId === productId)
  );
};

export const getSpectralTypesByProcesses = (processIds: string[]): SpectralType[] => {
  return loadProductionChains().spectralTypes.filter(spectralType =>
    spectralType.processes.some(processId => processIds.includes(processId))
  );
};
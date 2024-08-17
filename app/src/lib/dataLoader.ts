// lib/dataLoader.ts

import path from 'path';
import fs from 'fs';
import { ProductionChain, Product, SpectralType, Process } from '../types/types';

const productionChainsPath = path.resolve(process.cwd(), 'src/sdk/productionChains.json');

let productionChains: ProductionChain | undefined;

export const loadProductionChains = (): ProductionChain => {
  if (!productionChains) {
    try {
      const data = fs.readFileSync(productionChainsPath, 'utf8');
      productionChains = JSON.parse(data);
      // console.log('Production chains data loaded successfully.');
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
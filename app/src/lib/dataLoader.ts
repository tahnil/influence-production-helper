import path from 'path';
import fs from 'fs';
import { ProductionChain } from '../types/types';

const productionChainsPath = path.resolve(process.cwd(), '/app/sdk/productionChains.json'); // adjust path to correct path, e. g. ./sdk/productionChains.json (msl)

let productionChains: ProductionChain;

export const loadProductionChains = (): ProductionChain => {
  if (!productionChains) {
    try {
      const data = fs.readFileSync(productionChainsPath, 'utf8');
      productionChains = JSON.parse(data);
      console.log('Production chains data loaded successfully.');
      // console.log('Production Chains:',productionChains);
    } catch (error) {
      console.error('Error reading or parsing productionChains.json:', error);
      throw new Error('Failed to load production chains data');
    }
  }
  return productionChains;
};

export const productMap = new Map(
  loadProductionChains().products.map(product => [product.id, product.name])
);

export const processMap = new Map(
  loadProductionChains().processes.map(process => [process.id, process])
);

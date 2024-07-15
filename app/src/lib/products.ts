// src/lib/products.ts
import { loadProductionChains } from './dataLoader';

export const getAllProducts = async () => {
  console.log('Loading production chains');
  const productionChains = loadProductionChains();
  console.log('Production chains loaded', productionChains.products);
  return productionChains.products;
};

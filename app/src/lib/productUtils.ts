// lib/productUtils.ts

import { Product, Process, SpectralType, ProductWithSpectralTypes } from '../types/types';
import { loadProductionChains } from './dataLoader';
import { InfluenceProduct } from '@/types/influenceTypes';

// Load the production chains data
const productionChains = loadProductionChains();

// Helper functions
const getProductById = (id: string): Product | undefined => {
  return productionChains.products.find(product => product.id === id);
};

// Utility function to convert Product to InfluenceProduct
const convertProductToInfluenceProduct = (product: Product): InfluenceProduct => {
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    category: product.category,
    quantized: product.quantized,
    massKilogramsPerUnit: product.massKilogramsPerUnit,
    volumeLitersPerUnit: product.volumeLitersPerUnit,
  };
};

// Utility function to convert InfluenceProduct to Product
const convertInfluenceProductToProduct = (influenceProduct: InfluenceProduct): Product => {
  return {
    id: influenceProduct.id,
    name: influenceProduct.name,
    type: influenceProduct.type,
    category: influenceProduct.category,
    quantized: influenceProduct.quantized,
    massKilogramsPerUnit: influenceProduct.massKilogramsPerUnit?.toString(),
    volumeLitersPerUnit: influenceProduct.volumeLitersPerUnit?.toString(),
  };
};

const getInfluenceProductById = (id: string): InfluenceProduct | undefined => {
  const product = productionChains.products.find(product => product.id === id);
  return product ? convertProductToInfluenceProduct(product) : undefined;
};

const getProcessesByProductId = (productId: string): Process[] => {
  return productionChains.processes.filter(process =>
    process.outputs.some(output => output.productId === productId)
  );
};

const getSpectralTypesByProcessIds = (processIds: string[]): SpectralType[] => {
  const spectralTypes = productionChains.spectralTypes ?? [];
  return spectralTypes.filter(spectralType =>
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

export const fetchInfluenceProductById = async (id: string): Promise<InfluenceProduct | undefined> => {
  const product = getProductById(id);
  return product ? convertProductToInfluenceProduct(product) : undefined;
};
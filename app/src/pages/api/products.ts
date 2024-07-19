// src/pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getProductById, getProcessesByProductId, getSpectralTypesByProcesses } from '../../lib/dataLoader';
import { ApiError } from '../../types/types';

const getProductWithSpectralTypes = (productId: string) => {
  const product = getProductById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  // Fetch processes that produce this product
  const processes = getProcessesByProductId(productId);
  const processIds = processes.map(process => process.id);

  // Fetch spectral types that support the processes
  const spectralTypes = getSpectralTypesByProcesses(processIds);

  return {
    ...product,
    spectralTypes: spectralTypes.map(st => ({
      id: st.id,
      name: st.name
    }))
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { productId } = req.query as { productId?: string };
    
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const product = getProductWithSpectralTypes(productId);

    res.status(200).json(product);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error loading product:', apiError.message);
    res.status(apiError.status || 500).json({ 
      error: 'Failed to load product', 
      message: apiError.message,
      code: apiError.code
    });
  }
}
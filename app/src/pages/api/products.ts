// src/pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllProducts } from '../../lib/products';
import { ApiError } from '../../types/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const products = await getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error loading products:', apiError.message);
    res.status(apiError.status || 500).json({ 
      error: 'Failed to load products', 
      message: apiError.message,
      code: apiError.code
    });
  }
}
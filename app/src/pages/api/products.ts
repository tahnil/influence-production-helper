// src/pages/api/products.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchProductById, fetchAllProducts } from '../../lib/productUtils';
import { ApiError } from '../../types/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if there's an ID query parameter
    const { id } = req.query;

    if (id) {
      // Fetch a single product by ID
      const productId = Array.isArray(id) ? id[0] : id;
      const product = await fetchProductById(productId);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.status(200).json(product);
    }

    // If no ID is provided, fetch all products
    const products = await fetchAllProducts();
    return res.status(200).json(products);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error loading products:', apiError.message);
    res.status(apiError.status || 500).json({
      error: 'Failed to load products',
      message: apiError.message,
      code: apiError.code,
    });
  }
}

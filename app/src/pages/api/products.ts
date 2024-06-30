// src/pages/api/products.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProductionChains } from '../../lib/dataLoader';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Loading production chains');
    const productionChains = loadProductionChains();
    console.log('Production chains loaded', productionChains.products);
    res.status(200).json(productionChains.products);
  } catch (error) {
    console.error('Error loading production chains:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProductionChains } from '../../lib/dataLoader';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const productionChains = loadProductionChains();
    res.status(200).json(productionChains.products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load products' });
  }
}

// src/pages/api/processes.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProductionChains } from '../../lib/dataLoader';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query;

  if (!productId || typeof productId !== 'string') {
    res.status(400).json({ error: 'Invalid product ID' });
    return;
  }

  try {
    const productionChains = loadProductionChains();
    const processes = productionChains.processes.filter(process =>
      process.outputs.some(output => output.productId === productId)
    );

    res.status(200).json(processes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load processes' });
  }
}

// src/pages/api/inputs.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProductionChains } from '../../lib/dataLoader';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { processId } = req.query;

  if (!processId || typeof processId !== 'string') {
    res.status(400).json({ error: 'Invalid process ID' });
    return;
  }

  try {
    const productionChains = loadProductionChains();
    const process = productionChains.processes.find(p => p.id === processId);

    if (!process) {
      res.status(404).json({ error: 'Process not found' });
      return;
    }

    const inputs = process.inputs.map(input => {
      const product = productionChains.products.find(p => p.id === input.productId);
      return {
        product,
        unitsPerSR: input.unitsPerSR,
      };
    });

    res.status(200).json(inputs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load inputs' });
  }
}

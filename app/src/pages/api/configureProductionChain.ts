// src/pages/api/configureProductionChain.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { configureProductionChain } from '../../lib/configureProductionChain';
import { logError } from '../../utils/logger';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { product, amount, selectedProcesses } = req.body;
  try {
    const productionChain = configureProductionChain(product, amount, selectedProcesses);
    res.status(200).json(productionChain);
  } catch (error) {
    logError('Error configuring production chain', error);
    res.status(500).send('Internal Server Error');
  }
}

// src/pages/api/productionChains.ts
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { ProductionChain } from '../../types/types';

const productionChainsPath = path.resolve(process.cwd(), 'src/sdk/productionChains.json');

let productionChains: ProductionChain;

const loadProductionChains = (): ProductionChain => {
  if (!productionChains) {
    try {
      const data = fs.readFileSync(productionChainsPath, 'utf8');
      productionChains = JSON.parse(data);
      console.log('Production chains data loaded successfully.');
    } catch (error) {
      console.error('Error reading or parsing productionChains.json:', error);
      throw new Error('Failed to load production chains data');
    }
  }
  return productionChains;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const productionChains = loadProductionChains();
    res.status(200).json(productionChains);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load production chains data' });
  }
}

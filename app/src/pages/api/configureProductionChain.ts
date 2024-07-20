// src/pages/api/configureProductionChain.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { configureProductionChain } from '../../lib/configureProductionChain';
import { Product, ProductionChain } from '../../types/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const data = req.body;

      // Validate the presence and type of required fields
      if (!data.product || typeof data.amount !== 'number' || typeof data.selectedProcesses !== 'object') {
        return res.status(400).json({ error: 'Invalid request data' });
      }

      const product: Product = data.product;
      const amount: number = data.amount;
      const selectedProcesses: { [key: string]: string } = data.selectedProcesses;

      const result: ProductionChain = configureProductionChain(product, amount, selectedProcesses);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error configuring production chain:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

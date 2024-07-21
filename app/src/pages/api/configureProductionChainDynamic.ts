import { NextApiRequest, NextApiResponse } from 'next';

interface LocalProduct {
    id: string;
    name: string;
    massKilogramsPerUnit?: number;
    volumeLitersPerUnit?: number;
    amount?: number;
}

interface LocalInput {
    product: LocalProduct;
    amount: number;
    process?: LocalProcess;
}

interface LocalProcess {
    id: string;
    name: string;
    buildingId: string;
    inputs: LocalInput[];
    requiredOutput: { product: LocalProduct; amount: number }[];
    otherOutput: { product: LocalProduct; amount: number }[];
    mAdalianHoursPerSR?: number;
    SR?: number;
}

interface LocalProductionChain {
    endProduct: LocalProduct;
    process: LocalProcess;
}

interface LocalTreeNode {
    name: string;
    type: 'product' | 'process';
    massKilogramsPerUnit?: number;
    volumeLitersPerUnit?: number;
    amount?: number;
    totalWeight?: number;
    totalVolume?: number;
    buildingId?: string;
    mAdalianHoursPerSR?: number;
    SR?: number;
    children?: LocalTreeNode[];
}

// Sample data structure using local types
const sampleProductionChain: LocalProductionChain = {
    endProduct: {
      id: '44',
      name: 'Cement',
      amount: 200000,
      massKilogramsPerUnit: 1.2,
      volumeLitersPerUnit: 1.0,
    },
    process: {
      id: '38',
      name: 'Salty Cement Mixing',
      buildingId: '3',
      inputs: [
        {
          product: { id: '1', name: 'Water', massKilogramsPerUnit: 1.0, volumeLitersPerUnit: 1.0 },
          amount: 142857,
          process: {
            id: '1',
            name: 'Water Mining',
            buildingId: '2',
            inputs: [],
            requiredOutput: [
              {
                product: { id: '1', name: 'Water', massKilogramsPerUnit: 1.0, volumeLitersPerUnit: 1.0 },
                amount: 142857
              }
            ],
            otherOutput: []
          }
        },
        {
          product: { id: '32', name: 'Quicklime', massKilogramsPerUnit: 0.8, volumeLitersPerUnit: 0.6 },
          amount: 85714,
          process: {
            id: '29',
            name: 'Calcite Calcination',
            buildingId: '3',
            inputs: [
              {
                product: { id: '11', name: 'Calcite', massKilogramsPerUnit: 2.5, volumeLitersPerUnit: 1.5 },
                amount: 153061,
                process: {
                  id: '11',
                  name: 'Calcite Mining',
                  buildingId: '2',
                  inputs: [],
                  requiredOutput: [
                    {
                      product: { id: '11', name: 'Calcite', massKilogramsPerUnit: 2.5, volumeLitersPerUnit: 1.5 },
                      amount: 153061
                    }
                  ],
                  otherOutput: []
                }
              }
            ],
            requiredOutput: [
              {
                product: { id: '32', name: 'Quicklime', massKilogramsPerUnit: 0.8, volumeLitersPerUnit: 0.6 },
                amount: 85714
              }
            ],
            otherOutput: [
              {
                product: { id: '6', name: 'Carbon Dioxide', massKilogramsPerUnit: 1.5, volumeLitersPerUnit: 1.0 },
                amount: 67347
              }
            ]
          }
        }
      ],
      requiredOutput: [
        {
          product: { id: '44', name: 'Cement', massKilogramsPerUnit: 1.2, volumeLitersPerUnit: 1.0 },
          amount: 200000
        }
      ],
      otherOutput: []
    }
  };

// Function to transform production chain to D3-compatible format
function transformProductionChain(data: LocalProductionChain): LocalTreeNode {
    function transformProcess(process: LocalProcess): LocalTreeNode {
      return {
        name: process.name,
        type: 'process',
        buildingId: process.buildingId,
        mAdalianHoursPerSR: process.mAdalianHoursPerSR || 0,
        SR: process.SR || 0,
        children: process.inputs.map(input => ({
          name: input.product.name,
          type: 'product',
          massKilogramsPerUnit: input.product.massKilogramsPerUnit || 0,
          volumeLitersPerUnit: input.product.volumeLitersPerUnit || 0,
          amount: input.amount,
          totalWeight: (input.amount * (input.product.massKilogramsPerUnit || 0)),
          totalVolume: (input.amount * (input.product.volumeLitersPerUnit || 0)),
          children: input.process ? [transformProcess(input.process)] : []
        }))
      };
    }
  
    return {
      name: data.endProduct.name,
      type: 'product',
      amount: data.endProduct.amount || 0,
      massKilogramsPerUnit: data.endProduct.massKilogramsPerUnit || 0,
      volumeLitersPerUnit: data.endProduct.volumeLitersPerUnit || 0,
      totalWeight: (data.endProduct.amount || 0) * (data.endProduct.massKilogramsPerUnit || 0),
      totalVolume: (data.endProduct.amount || 0) * (data.endProduct.volumeLitersPerUnit || 0),
      children: [transformProcess(data.process)]
    };
  }
  
  // API Handler
  export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
      const updatedData = req.body;
  
      // Transform the production chain data to D3-compatible format
      const transformedData = transformProductionChain(sampleProductionChain);
  
      res.status(200).json(transformedData);
    } else {
      res.status(405).end(); // Method Not Allowed
    }
  }
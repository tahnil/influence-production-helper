import { NextApiRequest, NextApiResponse } from 'next';
import { InfluenceProduct, InfluenceProcess } from '../../types/influenceTypes';
import { D3TreeNode, ProductNode, ProcessNode, SideProductNode } from '../../types/d3Types';
import { LegacyProduct, LegacyProcessInChain, LegacyProductionChain } from '../../types/intermediateTypes';
import { fetchProductById, fetchInfluenceProductById } from '../../lib/productUtils';
import { fetchProcessById, fetchInfluenceProcessById } from '../../lib/processUtils';

// Sample data structure using local types
const sampleProductionChain: LegacyProductionChain = {
  endProduct: {
    id: '44',
    name: 'Cement',
    amount: 200000
  },
  products: [
    { id: '1', name: 'Water' },
    { id: '32', name: 'Quicklime' },
    { id: '11', name: 'Calcite' }
  ],
  processes: [
    {
      id: '38',
      name: 'Salty Cement Mixing',
      buildingId: '3',
      inputs: [
        { productId: '1', unitsPerSR: '5' },
        { productId: '32', unitsPerSR: '3' }
      ],
      outputs: [
        { productId: '44', unitsPerSR: '7' }
      ]
    },
    {
      id: '1',
      name: 'Water Mining',
      buildingId: '2',
      inputs: [],
      outputs: [
        { productId: '1', unitsPerSR: '' }
      ]
    },
    {
      id: '29',
      name: 'Calcite Calcination',
      buildingId: '3',
      inputs: [
        { productId: '11', unitsPerSR: '100' }
      ],
      outputs: [
        { productId: '6', unitsPerSR: '44' },
        { productId: '32', unitsPerSR: '56' }
      ]
    },
    {
      id: '11',
      name: 'Calcite Mining',
      buildingId: '2',
      inputs: [],
      outputs: [
        { productId: '11', unitsPerSR: '' }
      ]
    }
  ],
  productionChain: {
    process: {
      id: '38',
      name: 'Salty Cement Mixing',
      buildingId: '3',
      inputs: [
        {
          product: { id: '1', name: 'Water' },
          amount: 142857.14285714287,
          process: {
            id: '1',
            name: 'Water Mining',
            buildingId: '2',
            inputs: [],
            requiredOutput: [
              {
                product: { id: '1', name: 'Water' },
                amount: 142857.14285714287
              }
            ],
            otherOutput: []
          }
        },
        {
          product: { id: '32', name: 'Quicklime' },
          amount: 85714.28571428571,
          process: {
            id: '29',
            name: 'Calcite Calcination',
            buildingId: '3',
            inputs: [
              {
                product: { id: '11', name: 'Calcite' },
                amount: 153061.22448979592,
                process: {
                  id: '11',
                  name: 'Calcite Mining',
                  buildingId: '2',
                  inputs: [],
                  requiredOutput: [
                    {
                      product: { id: '11', name: 'Calcite' },
                      amount: 153061.22448979592
                    }
                  ],
                  otherOutput: []
                }
              }
            ],
            requiredOutput: [
              {
                product: { id: '32', name: 'Quicklime' },
                amount: 85714.28571428571
              }
            ],
            otherOutput: [
              {
                product: { id: '6', name: 'Carbon Dioxide' },
                amount: 67346.9387755102
              }
            ]
          }
        }
      ],
      requiredOutput: [
        {
          product: { id: '44', name: 'Cement' },
          amount: 200000
        }
      ],
      otherOutput: []
    }
  }
};

// Function to transform legacy production chain to D3-compatible format
async function transformProductionChain(data: LegacyProductionChain): Promise<ProductNode> {
  async function transformProcess(process: LegacyProcessInChain): Promise<ProcessNode> {
    const processData = await fetchInfluenceProcessById(process.id);
    if (!processData) throw new Error(`Process with id ${process.id} not found`);

    const totalRuns = process.requiredOutput[0]?.amount || 0;
    const totalDuration = totalRuns * parseFloat(processData.mAdalianHoursPerSR || '0');

    const sideProducts: SideProductNode[] = await Promise.all((process.otherOutput || []).map(async (output) => {
      const influenceProduct = await fetchInfluenceProductById(output.product.id);
      if (!influenceProduct) throw new Error(`Product with id ${output.product.id} not found`);

      return {
      name: output.product.name,
      type: 'sideProduct',
        influenceProduct,
      amount: output.amount,
        totalWeight: output.amount * (influenceProduct.massKilogramsPerUnit || 0),
        totalVolume: output.amount * (influenceProduct.volumeLitersPerUnit || 0),
      };
    }));

    const children: ProductNode[] = await Promise.all((process.inputs || []).map(async (input) => {
      const influenceProduct = await fetchInfluenceProductById(input.product.id);
      if (!influenceProduct) throw new Error(`Product with id ${input.product.id} not found`);

      return {
      name: input.product.name,
      type: 'product',
        influenceProduct,
      amount: input.amount,
        totalWeight: input.amount * (influenceProduct.massKilogramsPerUnit || 0),
        totalVolume: input.amount * (influenceProduct.volumeLitersPerUnit || 0),
        children: input.process ? [await transformProcess(input.process)] : undefined,
      };
    }));

    return {
      name: process.name,
      type: 'process',
      influenceProcess: processData,
      totalDuration,
      totalRuns,
      sideProducts,
      children: children.length > 0 ? children : undefined, // Ensure children is undefined if empty
    };
  }

  const endProduct = await fetchInfluenceProductById(data.endProduct.id);
  if (!endProduct) throw new Error(`End product with id ${data.endProduct.id} not found`);

  return {
    name: endProduct.name,
    type: 'product',
    influenceProduct: endProduct,
    amount: data.endProduct.amount!,
    totalWeight: data.endProduct.amount! * (endProduct.massKilogramsPerUnit || 0),
    totalVolume: data.endProduct.amount! * (endProduct.volumeLitersPerUnit || 0),
    children: [await transformProcess(data.productionChain.process)], // Ensure children is an array
  };
}

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const updatedData = req.body;
      // Transform the production chain data to D3-compatible format
      const transformedData = await transformProductionChain(sampleProductionChain);
      res.status(200).json(transformedData);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}

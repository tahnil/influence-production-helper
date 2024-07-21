import { NextApiRequest, NextApiResponse } from 'next';
import { InfluenceProduct, InfluenceProcess } from '../../types/influenceTypes';
import { ProductionChainProduct, ProductionChainProcess } from '../../types/productionChainTypes';
import { D3TreeNode, ProductNode, ProcessNode, SideProductNode } from '../../types/d3Types';
import { LegacyProduct, LegacyProcessInputsRequiredOutputsOtherOutputs, LegacyProcessShortInput, LegacyProcessList, LegacyProcessInChain, LegacyProductionChain } from '../../types/intermediateTypes';

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

// Helper function to convert LegacyProduct to InfluenceProduct
const convertLegacyProductToInfluenceProduct = (legacyProduct: LegacyProduct): InfluenceProduct => {
  return {
    ...legacyProduct,
    category: '', // Placeholder, update with actual data if available
    massKilogramsPerUnit: 0, // Placeholder, update with actual data if available
    quantized: false, // Placeholder, update with actual data if available
    type: '', // Placeholder, update with actual data if available
    volumeLitersPerUnit: 0 // Placeholder, update with actual data if available
  };
};

// Function to transform legacy production chain to D3-compatible format
function transformProductionChain(data: LegacyProductionChain): ProductNode {
  function transformProcess(process: LegacyProcessInChain): ProcessNode {
    const totalRuns = process.requiredOutput[0]?.amount || 0;
    const totalDuration = totalRuns * parseFloat('0.0000825'); // Placeholder, adjust as needed

    const sideProducts: SideProductNode[] = (process.otherOutput || []).map(output => ({
      name: output.product.name,
      type: 'sideProduct',
      influenceProduct: convertLegacyProductToInfluenceProduct(output.product),
      amount: output.amount,
      totalWeight: output.amount * 0, // Placeholder, update with actual data if available
      totalVolume: output.amount * 0 // Placeholder, update with actual data if available
    }));

    const children: ProductNode[] = (process.inputs || []).map(input => ({
      name: input.product.name,
      type: 'product',
      influenceProduct: convertLegacyProductToInfluenceProduct(input.product),
      amount: input.amount,
      totalWeight: input.amount * 0, // Placeholder, update with actual data if available
      totalVolume: input.amount * 0, // Placeholder, update with actual data if available,
      children: input.process ? [transformProcess(input.process)] : undefined // Ensure children is an array
    }));

    return {
      name: process.name,
      type: 'process',
      influenceProcess: {
        id: process.id,
        name: process.name,
        buildingId: process.buildingId,
        bAdalianHoursPerAction: '0', // Placeholder, update with actual data if available
        mAdalianHoursPerSR: '0.0000825', // Placeholder, update with actual data if available
        inputs: (process.inputs || []).map(input => ({
          productId: input.product.id,
          unitsPerSR: input.amount.toString()
        })),
        outputs: (process.requiredOutput || []).concat(process.otherOutput || []).map(output => ({
          productId: output.product.id,
          unitsPerSR: output.amount.toString()
        }))
      },
      totalDuration,
      totalRuns,
      sideProducts,
      children: children.length > 0 ? children : undefined // Ensure children is undefined if empty
    };
  }

  const endProduct: InfluenceProduct = convertLegacyProductToInfluenceProduct(data.endProduct);

  return {
    name: endProduct.name,
    type: 'product',
    influenceProduct: endProduct,
    amount: data.endProduct.amount!,
    totalWeight: data.endProduct.amount! * endProduct.massKilogramsPerUnit,
    totalVolume: data.endProduct.amount! * endProduct.volumeLitersPerUnit,
    children: [transformProcess(data.productionChain.process)] // Ensure children is an array
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

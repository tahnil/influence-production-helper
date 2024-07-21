import { NextApiRequest, NextApiResponse } from 'next';

interface Product {
  id: string;
  name: string;
}

interface Input {
  product: Product;
  amount: number;
  process?: Process;
}

interface Process {
  id: string;
  name: string;
  buildingId: string;
  inputs: Input[];
  requiredOutput: { product: Product; amount: number }[];
  otherOutput: { product: Product; amount: number }[];
}

interface ProductionChain {
  process: Process;
}

interface ProductionData {
  endProduct: Product & { amount: number };
  products: Product[];
  processes: Process[];
  productionChain: ProductionChain;
}

interface TreeNode {
  name: string;
  id: string;
  amount: number;
  buildingId?: string;
  children: TreeNode[];
}

// Sample data structure
const sampleProductionChain: ProductionData = {
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
        { product: { id: '1', name: 'Water' }, amount: 142857.14285714287 },
        { product: { id: '32', name: 'Quicklime' }, amount: 85714.28571428571 }
      ],
      requiredOutput: [{ product: { id: '44', name: 'Cement' }, amount: 200000 }],
      otherOutput: []
    },
    {
      id: '1',
      name: 'Water Mining',
      buildingId: '2',
      inputs: [],
      requiredOutput: [{ product: { id: '1', name: 'Water' }, amount: 142857.14285714287 }],
      otherOutput: []
    },
    {
      id: '29',
      name: 'Calcite Calcination',
      buildingId: '3',
      inputs: [{ product: { id: '11', name: 'Calcite' }, amount: 153061.22448979592 }],
      requiredOutput: [{ product: { id: '32', name: 'Quicklime' }, amount: 85714.28571428571 }],
      otherOutput: [{ product: { id: '6', name: 'Carbon Dioxide' }, amount: 67346.9387755102 }]
    },
    {
      id: '11',
      name: 'Calcite Mining',
      buildingId: '2',
      inputs: [],
      requiredOutput: [{ product: { id: '11', name: 'Calcite' }, amount: 153061.22448979592 }],
      otherOutput: []
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
            requiredOutput: [{ product: { id: '1', name: 'Water' }, amount: 142857.14285714287 }],
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
                  requiredOutput: [{ product: { id: '11', name: 'Calcite' }, amount: 153061.22448979592 }],
                  otherOutput: []
                }
              }
            ],
            requiredOutput: [{ product: { id: '32', name: 'Quicklime' }, amount: 85714.28571428571 }],
            otherOutput: [{ product: { id: '6', name: 'Carbon Dioxide' }, amount: 67346.9387755102 }]
          }
        }
      ],
      requiredOutput: [{ product: { id: '44', name: 'Cement' }, amount: 200000 }],
      otherOutput: []
    }
  }
};

// Function to transform production chain to D3-compatible format
function transformProductionChain(data: ProductionData): TreeNode {
    function transformProcess(process: Process): TreeNode {
      return {
        name: `${process.name} (Process)`,
        id: process.id,
        amount: process.requiredOutput?.[0]?.amount || 0,
        buildingId: process.buildingId,
        children: process.inputs.map(input => ({
          name: `${input.product.name} (Product)`,
          id: input.product.id,
          amount: input.amount,
          children: input.process ? [transformProcess(input.process)] : []
        }))
      };
    }
  
    return {
      name: `${data.endProduct.name} (Product)`,
      id: data.endProduct.id,
      amount: data.endProduct.amount,
      children: [transformProcess(data.productionChain.process)]
    };
  }
  
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

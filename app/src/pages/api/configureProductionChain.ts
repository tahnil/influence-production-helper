// src/pages/api/configureProductionChain.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProductionChains, productMap, processMap } from '../../lib/dataLoader';

function findProcessesThatYieldProduct(productId: string) {
  const productionChains = loadProductionChains();
  return productionChains.processes.filter(process =>
    process.outputs.some(output => output.productId === productId)
  );
}

function calculateInputAmount(process, amount, input) {
  const correspondingInput = process.inputs.find(p => p.productId === input.product.id);
  if (!correspondingInput || !correspondingInput.unitsPerSR) {
    throw new Error(`Invalid process input data for productId: ${input.product.id}, process: ${JSON.stringify(process)}`);
  }
  return (amount * correspondingInput.unitsPerSR) / process.outputs[0].unitsPerSR;
}

function calculateOutputAmount(process, amount, output) {
  return (amount * output.unitsPerSR) / process.outputs[0].unitsPerSR;
}

function getOutputsForProcess(process, amount) {
  return process.outputs.map(output => ({
    product: {
      id: output.productId,
      name: productMap.get(output.productId)
    },
    amount: calculateOutputAmount(process, amount, output)
  }));
}

function getInputsForProcess(process) {
  return process.inputs.map(input => ({
    product: {
      id: input.productId,
      name: productMap.get(input.productId)
    },
    unitsPerSR: input.unitsPerSR
  }));
}

function configureProcess(productId, amount, selectedProcesses, requiredProducts, requiredProcesses) {
  const processes = findProcessesThatYieldProduct(productId);

  if (processes.length === 0) {
    requiredProducts.add(productId);
    return {
      product: {
        id: productId,
        name: productMap.get(productId)
      },
      process: null,
      inputs: [],
      requiredOutput: [
        {
          product: {
            id: productId,
            name: productMap.get(productId)
          },
          amount: amount
        }
      ],
      otherOutput: []
    };
  }

  const selectedProcessId = selectedProcesses[productId];
  const userPreferredProcess = selectedProcessId
    ? processes.find(process => process.id === selectedProcessId)
    : processes[0];

  if (!userPreferredProcess) {
    throw new Error(`Process with ID ${selectedProcessId} not found for product ${productId}`);
  }

  requiredProcesses.add(userPreferredProcess.id);
  const outputs = getOutputsForProcess(userPreferredProcess, amount);
  const processNode = {
    id: userPreferredProcess.id,
    name: userPreferredProcess.name,
    buildingId: userPreferredProcess.buildingId,
    inputs: [],
    requiredOutput: outputs.filter(output => output.product.id === productId),
    otherOutput: outputs.filter(output => output.product.id !== productId)
  };

  const inputs = getInputsForProcess(userPreferredProcess);

  for (const input of inputs) {
    requiredProducts.add(input.product.id);
    try {
      const inputAmount = calculateInputAmount(userPreferredProcess, amount, input);
      const inputNode = configureProcess(input.product.id, inputAmount, selectedProcesses, requiredProducts, requiredProcesses);
      processNode.inputs.push({
        product: input.product,
        amount: inputAmount,
        process: inputNode.process
      });

      if (inputNode.process) {
        inputNode.process.requiredOutput[0].amount = inputAmount;
      }
    } catch (error) {
      console.error(`Error configuring input process for productId: ${input.product.id}, amount: ${amount}`, error);
    }
  }

  return {
    product: {
      id: productId,
      name: productMap.get(productId)
    },
    process: processNode,
    inputs: processNode.inputs,
    requiredOutput: [
      {
        product: {
          id: productId,
          name: productMap.get(productId)
        },
        amount: amount
      }
    ],
    otherOutput: []
  };
}

function configureProductionChain(product, amount, selectedProcesses) {
  const requiredProducts = new Set();
  const requiredProcesses = new Set();
  const productionChain = configureProcess(product.id, amount, selectedProcesses, requiredProducts, requiredProcesses);
  const productionData = {
    endProduct: {
      id: product.id,
      name: product.name,
      amount: amount
    },
    products: Array.from(requiredProducts).map(productId => {
      const product = productionChains.products.find(p => p.id === productId);
      return {
        id: product.id,
        name: product.name
      };
    }),
    processes: Array.from(requiredProcesses).map(processId => {
      const process = processMap.get(processId);
      return {
        id: process.id,
        name: process.name,
        buildingId: process.buildingId,
        inputs: process.inputs,
        outputs: process.outputs
      };
    }),
    productionChain: {
      process: productionChain.process
    }
  };
  return productionData;
}

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
    console.error('Error configuring production chain:', error);
    res.status(500).send('Internal Server Error');
  }
}

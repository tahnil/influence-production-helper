// src/pages/api/configureProductionChain.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProductionChains, productMap, processMap } from '../../lib/dataLoader';
import { Process, Product, InputOutput, ProductionChain, ProductionChainProduct, ProductionChainProcess } from '../../types/types';
import { createProductionChainProcess, createProductionChainProduct } from '../../lib/constructors';

function findProcessesThatYieldProduct(productId: string): Process[] {
  const productionChains = loadProductionChains();
  return productionChains.processes.filter(process =>
    process.outputs.some(output => output.productId === productId)
  );
}

function calculateInputAmount(process: Process, amount: number, input: InputOutput): number {
  const correspondingInput = process.inputs.find(p => p.productId === input.productId);
  if (!correspondingInput || !correspondingInput.unitsPerSR) {
    throw new Error(`Invalid process input data for productId: ${input.productId}, process: ${JSON.stringify(process)}`);
  }
  return (amount * parseFloat(correspondingInput.unitsPerSR)) / parseFloat(process.outputs[0].unitsPerSR);
}

function calculateOutputAmount(process: Process, amount: number, output: InputOutput): number {
  return (amount * parseFloat(output.unitsPerSR)) / parseFloat(process.outputs[0].unitsPerSR);
}

function getOutputsForProcess(process: Process, amount: number): ProductionChainProduct[] {
  return process.outputs.map(output => {
    const productName = productMap.get(output.productId);
    if (!productName) {
      throw new Error(`Product with ID ${output.productId} not found in productMap.`);
    }
    return createProductionChainProduct({ id: output.productId, name: productName }, calculateOutputAmount(process, amount, output));
  });
}

function getInputsForProcess(process: Process): InputOutput[] {
  return process.inputs.map(input => ({
    productId: input.productId,
    unitsPerSR: input.unitsPerSR,
  }));
}

function configureProcess(
  productId: string,
  amount: number,
  selectedProcesses: { [key: string]: string },
  requiredProducts: Set<string>,
  requiredProcesses: Set<string>,
  level: number
): ProductionChainProduct {
  const processes = findProcessesThatYieldProduct(productId);

  if (processes.length === 0) {
    requiredProducts.add(productId);
    return createProductionChainProduct(
      { id: productId, name: productMap.get(productId) || 'Unknown Product' },
      amount,
      undefined
    );
  }

  const uniqueId = `${productId}-${level}`;
  const selectedProcessId = selectedProcesses[uniqueId];
  const userPreferredProcess = selectedProcessId
    ? processes.find(process => process.id === selectedProcessId)
    : processes[0];

  if (!userPreferredProcess) {
    throw new Error(`Process with ID ${selectedProcessId} not found for product ${productId}`);
  }

  requiredProcesses.add(userPreferredProcess.id);
  const outputs = getOutputsForProcess(userPreferredProcess, amount);
  const processNode: ProductionChainProcess = createProductionChainProcess(
    userPreferredProcess.id,
    userPreferredProcess.name,
    userPreferredProcess.buildingId,
    [],
    outputs.filter(output => output.product.id === productId),
    outputs.filter(output => output.product.id !== productId)
  );

  const inputs = getInputsForProcess(userPreferredProcess);

  for (const input of inputs) {
    requiredProducts.add(input.productId);
    try {
      const inputAmount = calculateInputAmount(userPreferredProcess, amount, input);
      const inputNode = configureProcess(input.productId, inputAmount, selectedProcesses, requiredProducts, requiredProcesses, level + 1);
      processNode.inputs.push(createProductionChainProduct(inputNode.product, inputAmount, inputNode.process));

      if (inputNode.process) {
        inputNode.process.requiredOutput[0].amount = inputAmount;
      }
    } catch (error) {
      console.error(`Error configuring input process for productId: ${input.productId}, amount: ${amount}`, error);
    }
  }

  return createProductionChainProduct(
    { id: productId, name: productMap.get(productId) || 'Unknown Product' },
    amount,
    processNode
  );
}

function configureProductionChain(product: Product, amount: number, selectedProcesses: { [key: string]: string }): ProductionChain {
  const productionChains = loadProductionChains();
  const requiredProducts = new Set<string>();
  const requiredProcesses = new Set<string>();
  const productionChain = configureProcess(product.id, amount, selectedProcesses, requiredProducts, requiredProcesses, 0);

  if (!productionChain.process) {
    throw new Error(`No process configured for product ${product.id}`);
  }

  const productionData: ProductionChain = {
    endProduct: {
      id: product.id,
      name: product.name,
      amount,
    },
    products: Array.from(requiredProducts).map(productId => {
      const product = productionChains.products.find(p => p.id === productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      return {
        id: product.id,
        name: product.name,
      };
    }),
    processes: Array.from(requiredProcesses).map(processId => {
      const process = processMap.get(processId);
      if (!process) {
        throw new Error(`Process with ID ${processId} not found`);
      }
      return {
        id: process.id,
        name: process.name,
        buildingId: process.buildingId,
        inputs: process.inputs,
        outputs: process.outputs,
      };
    }),
    productionChain: {
      process: productionChain.process, // This is now guaranteed to be a ProductionChainProcess
    },
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

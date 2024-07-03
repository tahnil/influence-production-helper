// src/pages/api/configureProductionChain.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProductionChains, productMap, processMap } from '../../lib/dataLoader';
import { Product, Process, InputOutput, ProductionChain, ProductionChainProcess, ProductionChainProduct } from '../../types/types';
import { generateUniqueId } from '../../lib/uniqueId';
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

  // Find the correct primary output for the process that matches the productId we are producing
  const primaryOutput = process.outputs.find(output => output.productId === process.outputs[0].productId);
  if (!primaryOutput) {
    throw new Error(`Primary output for productId: ${input.productId} not found in process outputs`);
  }

  const outputUnitsPerSR = parseFloat(primaryOutput.unitsPerSR);
  const inputUnitsPerSR = parseFloat(correspondingInput.unitsPerSR);
  const result = (amount * inputUnitsPerSR) / outputUnitsPerSR;
  console.log(`calculateInputAmount - process: ${process.id}, amount: ${amount}, input: ${input.productId}`);
  console.log(`outputUnitsPerSR: ${outputUnitsPerSR}, inputUnitsPerSR: ${inputUnitsPerSR}`);
  console.log(`Resulting input amount: ${result}`);
  return result;
}

function calculateOutputAmount(process: Process, amount: number, output: InputOutput): number {
  // Find the correct primary output for the process that matches the productId we are producing
  const primaryOutput = process.outputs.find(o => o.productId === output.productId);
  if (!primaryOutput) {
    throw new Error(`Primary output for productId: ${output.productId} not found in process outputs`);
  }

  const outputUnitsPerSR = parseFloat(output.unitsPerSR);
  const primaryOutputUnitsPerSR = parseFloat(primaryOutput.unitsPerSR);
  const result = (amount * outputUnitsPerSR) / primaryOutputUnitsPerSR;
  console.log(`calculateOutputAmount - process: ${process.id}, amount: ${amount}, output: ${output.productId}`);
  console.log(`primaryOutputUnitsPerSR: ${primaryOutputUnitsPerSR}, outputUnitsPerSR: ${outputUnitsPerSR}`);
  console.log(`Resulting output amount: ${result}`);
  return result;
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
  level: number,
  parentId: string | null = null
): ProductionChainProduct {
  console.log(`\nConfiguring process for productId: ${productId}, amount: ${amount}, level: ${level}, parentId: ${parentId}`);
  const processes = findProcessesThatYieldProduct(productId);

  if (processes.length === 0) {
    requiredProducts.add(productId);
    console.log(`No process found for productId: ${productId}, required amount: ${amount}`);
    return createProductionChainProduct(
      { id: productId, name: productMap.get(productId) || 'Unknown Product' },
      amount,
      undefined
    );
  }

  const uniqueId = generateUniqueId(productId, level, parentId);
  const selectedProcessId = selectedProcesses[uniqueId];
  const userPreferredProcess = selectedProcessId
    ? processes.find(process => process.id === selectedProcessId)
    : processes[0];

  if (!userPreferredProcess) {
    throw new Error(`Process with ID ${selectedProcessId} not found for product ${productId}`);
  }

  requiredProcesses.add(userPreferredProcess.id);
  const requiredOutput = userPreferredProcess.outputs.find(output => output.productId === productId);
  if (!requiredOutput) {
    throw new Error(`Required output for productId: ${productId} not found in process outputs`);
  }

  const processNode: ProductionChainProcess = createProductionChainProcess(
    userPreferredProcess.id,
    userPreferredProcess.name,
    userPreferredProcess.buildingId,
    [],
    [{ product: { id: productId, name: productMap.get(productId) || 'Unknown Product' }, amount }],
    userPreferredProcess.outputs
      .filter(output => output.productId !== productId)
      .map(output => createProductionChainProduct(
        { id: output.productId, name: productMap.get(output.productId) || 'Unknown Product' },
        calculateOutputAmount(userPreferredProcess, amount, output)
      ))
  );

  const inputs = getInputsForProcess(userPreferredProcess);

  for (const input of inputs) {
    requiredProducts.add(input.productId);
    const inputAmount = calculateInputAmount(userPreferredProcess, amount, input);
    console.log(`Input required for productId: ${input.productId}, input amount: ${inputAmount}`);
    const inputNode = configureProcess(input.productId, inputAmount, selectedProcesses, requiredProducts, requiredProcesses, level + 1, uniqueId);
    processNode.inputs.push(createProductionChainProduct(inputNode.product, inputAmount, inputNode.process));
  }

  console.log(`Configured process node: ${JSON.stringify(processNode, null, 2)}`);
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
  console.log(`Starting configuration for product: ${product.id}, amount: ${amount}`);
  const productionChain = configureProcess(product.id, amount, selectedProcesses, requiredProducts, requiredProcesses, 0, null);

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

  console.log(`Completed configuration: ${JSON.stringify(productionData, null, 2)}`);
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

// src/lib/configureProcess.ts
import { ProductionChainProcess, ProductionChainProduct, Product } from '../types/types';
import { getInputsForProcess } from './inputHelpers';
import { getProcessById } from './processUtils'; // Ensure this function is implemented correctly
import { calculateInputAmount } from './calculationHelpers';

// Function to create ProductionChainProduct
const createProductionChainProduct = (product: Product, amount: number, process?: ProductionChainProcess | null): ProductionChainProduct => {
  return {
    product,
    amount,
    process,
  };
};

// Recursive function to configure the process
const configureProcess = (
  productId: string,
  amount: number,
  selectedProcesses: { [key: string]: string },
  requiredProducts: Set<string>,
  requiredProcesses: Set<string>,
  level: number,
  parentId: string | null
): ProductionChainProcess => {
  console.log(`Configuring process for productId ${productId} at level ${level}`);
  const userPreferredProcessId = selectedProcesses[`${productId}-${level}`];

  if (!userPreferredProcessId) {
    console.error(`No selected process for productId ${productId} at level ${level}`);
    throw new Error(`No selected process for productId ${productId} at level ${level}`);
  }

  const userPreferredProcess = getProcessById(userPreferredProcessId);

  if (!userPreferredProcess) {
    console.error(`Process with id ${userPreferredProcessId} not found`);
    throw new Error(`Process with id ${userPreferredProcessId} not found`);
  }

  console.log(`Using process ${userPreferredProcess.name} for productId ${productId} at level ${level}`);

  const uniqueId = `${productId}-${level}-${parentId}`;
  const processNode: ProductionChainProcess = {
    id: userPreferredProcess.id,
    name: userPreferredProcess.name,
    buildingId: userPreferredProcess.buildingId,
    inputs: [],
    requiredOutput: [],
    otherOutput: [],
  };

  const inputs = getInputsForProcess(userPreferredProcess);
  for (const input of inputs) {
    requiredProducts.add(input.productId);
    const inputAmount = calculateInputAmount(userPreferredProcess, amount, input, productId);
    const inputNode = configureProcess(input.productId, inputAmount, selectedProcesses, requiredProducts, requiredProcesses, level + 1, uniqueId);
    processNode.inputs.push(createProductionChainProduct(inputNode.product, inputAmount, inputNode.process));
  }

  requiredProcesses.add(userPreferredProcess.id);

  return processNode;
};

// Exporting the configureProcess function for use
export const configureProductionChain = (data: any) => {
  const { product, amount, selectedProcesses } = data;
  const requiredProducts = new Set<string>();
  const requiredProcesses = new Set<string>();

  const rootProcessNode = configureProcess(
    product.id,
    amount,
    selectedProcesses,
    requiredProducts,
    requiredProcesses,
    0,
    null
  );

  return {
    endProduct: {
      ...product,
      amount,
    },
    productionChain: {
      process: rootProcessNode,
    },
    requiredProducts: Array.from(requiredProducts),
    requiredProcesses: Array.from(requiredProcesses),
  };
};

export { configureProcess };
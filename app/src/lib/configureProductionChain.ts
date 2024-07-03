// src/lib/configureProductionChain.ts
import { configureProcess } from './configureProcess';
import { Product, ProductionChain } from '../types/types';
import { loadProductionChains } from './dataLoader';
import { logInfo, logError } from '../utils/logger';
import { processMap } from './dataLoader';

export const configureProductionChain = (product: Product, amount: number, selectedProcesses: { [key: string]: string }): ProductionChain => {
  const productionChains = loadProductionChains();
  const requiredProducts = new Set<string>();
  const requiredProcesses = new Set<string>();
  logInfo('Starting configuration', { product, amount });
  const productionChain = configureProcess(product.id, amount, selectedProcesses, requiredProducts, requiredProcesses, 0, null);

  if (!productionChain.process) {
    logError('No process configured', product);
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
        logError('Product not found', productId);
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
        logError('Process not found', processId);
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

  logInfo('Completed configuration', productionData);
  return productionData;
};

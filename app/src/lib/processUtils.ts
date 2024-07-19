// lib/processUtils.ts

import { Process } from '../types/types';
import { loadProductionChains } from './dataLoader';

// Load the production chains data
const productionChains = loadProductionChains();

// Helper functions
const getProcessById = (id: string): Process | undefined => {
  return productionChains.processes.find(process => process.id === id);
};

const getProcessesByProductIdAsOutput = (productId: string): Process[] => {
  return productionChains.processes.filter(process =>
    process.outputs.some(output => output.productId === productId)
  );
};

// Public API functions
export const fetchProcessById = async (id: string): Promise<Process | undefined> => {
  return getProcessById(id);
};

export const fetchAllProcesses = async () => {
  return productionChains.processes;
};

export const fetchProcessesByProductId = async (productId: string): Promise<Process[]> => {
  return getProcessesByProductIdAsOutput(productId);
};

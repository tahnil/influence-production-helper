// lib/processUtils.ts

import { loadProductionChains } from './dataLoader';
import { fetchProductById } from './productUtils';
import {
  InfluenceProduct,
  InfluenceProcess,
  InfluenceProcessInput,
  InfluenceProcessInputOutput,
} from '@/types/influenceTypes';

// Load the production chains data
const productionChains = loadProductionChains();

// Helper functions
export const getProcessById = (id: string): InfluenceProcess => {
  const process = productionChains.processes.find(process => process.id === id);
  if (!process) {
    throw new Error(`[processUtils.ts] Process with ID "${id}" not found.`);
  }
  return process;
};

const getProcessesByProductIdAsOutput = (productId: string): InfluenceProcess[] => {
  const processes = productionChains.processes
    .filter(process =>
      process.outputs.some(output => output.productId === productId)
    );
  if (!processes) {
    throw new Error(`[processUtils.ts] No processes found for product ID "${productId}".`);
  }
  return processes;
};

const getInputsByProcessId = async (processId: string): Promise<InfluenceProcessInput[]> => {
  try {
    // Fetch the process by ID
    const process = getProcessById(processId);
    if (!process) {
      throw new Error(`[processUtils.ts] Process with ID "${processId}" not found.`);
    }

    // Map the inputs
    return await mapInputOutputsToInputs(process.inputs);
  } catch (error) {
    console.error(`[processUtils.ts] Failed to get inputs for process ID "${processId}":`, error);
    throw new Error(`[processUtils.ts] Failed to fetch inputs for process ID "${processId}".`);
  }
};

const mapInputOutputsToInputs = async (inputOutputs: InfluenceProcessInputOutput[]): Promise<InfluenceProcessInput[]> => {
  try {
    // Use map to handle asynchronous fetches
    const inputPromises = inputOutputs.map(async (io) => {
      try {
        const product = await fetchProductById(io.productId);
        return {
          product,
          unitsPerSR: io.unitsPerSR,
        };
      } catch (error) {
        console.error(`[processUtils.ts] Failed to fetch product with ID "${io.productId}":`, error);
        throw new Error(`[processUtils.ts] Failed to map input-output to input for product ID "${io.productId}".`);
      }
    });

    // Wait for all promises to resolve
    return await Promise.all(inputPromises);
  } catch (error) {
    console.error(`[processUtils.ts] Error in mapInputOutputsToInputs:`, error);
    throw new Error(`[processUtils.ts] Failed to map input-outputs to inputs.`);
  }
};

// Public API functions
export const fetchProcessById = async (id: string): Promise<InfluenceProcess> => {
  try {
    const process = getProcessById(id);
    return process;
  } catch (error) {
    console.error(`[processUtils.ts > fetchProcessById] Failed to fetch process with ID "${id}":`, error);
    throw new Error(`[processUtils.ts > fetchProcessById] Failed to fetch process with ID "${id}".`);
  }
};

export const fetchAllProcesses = async (): Promise<InfluenceProcess[]> => {
  try {
    if (!productionChains.processes) {
      throw new Error('[processUtils.ts > fetchAllProcesses] No processes found in production chains.');
    }
    return productionChains.processes;
  } catch (error) {
    console.error('[processUtils.ts > fetchAllProcesses] Failed to fetch all processes:', error);
    throw new Error('[processUtils.ts > fetchAllProcesses] Failed to fetch all processes.');
  }
};

export const fetchProcessesByProductId = async (productId: string): Promise<InfluenceProcess[]> => {
  try {
    const processes = getProcessesByProductIdAsOutput(productId);
    if (processes.length === 0) {
      throw new Error(`[processUtils.ts > fetchProcessesByProductId] No processes found for product ID "${productId}".`);
    }
    return processes;
  } catch (error) {
    console.error(`[processUtils.ts > fetchProcessesByProductId] Failed to fetch processes for product ID "${productId}":`, error);
    throw new Error(`[processUtils.ts > fetchProcessesByProductId] Failed to fetch processes for product ID "${productId}".`);
  }
};

export const fetchInputsByProcessId = async (processId: string): Promise<InfluenceProcessInput[]> => {
  try {
    return await getInputsByProcessId(processId);
  } catch (error) {
    console.error(`[processUtils.ts > fetchInputsByProcessId] Failed to fetch inputs for process ID "${processId}":`, error);
    throw new Error(`[processUtils.ts > fetchInputsByProcessId] Failed to fetch inputs for process ID "${processId}".`);
  }
};
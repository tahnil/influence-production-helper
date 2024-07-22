// lib/processUtils.ts

import { Input, InputOutput, Process, Product } from '../types/types';
import { loadProductionChains } from './dataLoader';
import { fetchProductById } from './productUtils';
import { InfluenceProcess } from '@/types/influenceTypes';

// Load the production chains data
const productionChains = loadProductionChains();

// Helper functions
export const getProcessById = (id: string): Process | undefined => {
  return productionChains.processes.find(process => process.id === id);
};

// Utility function to convert Process to InfluenceProcess
const convertProcessToInfluenceProcess = (process: Process): InfluenceProcess => {
  return {
    ...process,
    bAdalianHoursPerAction: process.bAdalianHoursPerAction ? parseFloat(process.bAdalianHoursPerAction).toString() : '0',
    mAdalianHoursPerSR: process.mAdalianHoursPerSR ? parseFloat(process.mAdalianHoursPerSR).toString() : '0',
    inputs: process.inputs.map(input => ({
      productId: input.productId,
      unitsPerSR: parseFloat(input.unitsPerSR).toString(),
    })),
    outputs: process.outputs.map(output => ({
      productId: output.productId,
      unitsPerSR: parseFloat(output.unitsPerSR).toString(),
    })),
  };
};

const getProcessesByProductIdAsOutput = (productId: string): Process[] => {
  return productionChains.processes.filter(process =>
    process.outputs.some(output => output.productId === productId)
  );
};

const getInputsByProcessId = async (processId: string): Promise<Input[]> => {
  const process = getProcessById(processId);
  if (process) {
    return await mapInputOutputsToInputs(process.inputs);
  }
  return [];
};

const mapInputOutputsToInputs = async (inputOutputs: InputOutput[]): Promise<Input[]> => {
  // Use map to handle asynchronous fetches
  const inputPromises = inputOutputs.map(async (io) => {
    const product = await fetchProductById(io.productId);
    return {
      product: product || { id: io.productId, name: 'Unknown Product' } as Product,
      unitsPerSR: io.unitsPerSR,
    };
  });

  // Wait for all promises to resolve
  return Promise.all(inputPromises);
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

export const fetchInputsByProcessId = async (processId: string): Promise<Input[]> => {
  return await getInputsByProcessId(processId);
};

export const fetchInfluenceProcessById = async (id: string): Promise<InfluenceProcess | undefined> => {
  const process = getProcessById(id);
  return process ? convertProcessToInfluenceProcess(process) : undefined;
};
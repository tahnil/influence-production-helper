// src/lib/inputHelpers.ts
import { Process, InputOutput } from '../types/types';

export const getInputsForProcess = (process: Process): InputOutput[] => {
  return process.inputs.map(input => ({
    productId: input.productId,
    unitsPerSR: input.unitsPerSR,
  }));
};

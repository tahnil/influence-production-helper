// src/lib/calculationHelpers.ts
import { Process, InputOutput } from '../types/types';
import { logInfo, logError } from '../utils/logger';

export const calculateInputAmount = (process: Process, amount: number, input: InputOutput, requiredProductId: string): number => {
  const correspondingInput = process.inputs.find(p => p.productId === input.productId);
  if (!correspondingInput || !correspondingInput.unitsPerSR) {
    logError(`Invalid process input data for productId: ${input.productId}`, process);
    throw new Error(`Invalid process input data for productId: ${input.productId}, process: ${JSON.stringify(process)}`);
  }

  const primaryOutput = process.outputs.find(output => output.productId === requiredProductId);
  if (!primaryOutput) {
    logError(`Primary output for productId: ${requiredProductId} not found`, process.outputs);
    throw new Error(`Primary output for productId: ${requiredProductId} not found in process outputs`);
  }

  const outputUnitsPerSR = parseFloat(primaryOutput.unitsPerSR);
  const inputUnitsPerSR = parseFloat(correspondingInput.unitsPerSR);
  const result = (amount * inputUnitsPerSR) / outputUnitsPerSR;

  logInfo('Calculated input amount', { process, input, primaryOutput, result });

  return result;
};

export const calculateOutputAmount = (process: Process, amount: number, output: InputOutput, requiredProductId: string): number => {
  const primaryOutput = process.outputs.find(o => o.productId === requiredProductId);
  if (!primaryOutput) {
    logError(`Primary output for productId: ${requiredProductId} not found`, process.outputs);
    throw new Error(`Primary output for productId: ${requiredProductId} not found in process outputs`);
  }

  const outputUnitsPerSR = parseFloat(output.unitsPerSR);
  const primaryOutputUnitsPerSR = parseFloat(primaryOutput.unitsPerSR);
  const result = (amount * outputUnitsPerSR) / primaryOutputUnitsPerSR;

  logInfo('Calculated output amount', { process, output, primaryOutput, result });

  return result;
};

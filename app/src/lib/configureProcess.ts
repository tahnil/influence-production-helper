// src/lib/configureProcess.ts
import { findProcessesThatYieldProduct } from './processHelpers';
import { calculateInputAmount, calculateOutputAmount } from './calculationHelpers';
import { getInputsForProcess } from './inputHelpers';
import { generateUniqueId } from './uniqueId';
import { createProductionChainProcess, createProductionChainProduct } from './constructors';
import { Product, ProductionChainProduct, ProductionChainProcess } from '../types/types';
import { logInfo, logError } from '../utils/logger';
import { productMap } from './dataLoader';

export const configureProcess = (
  productId: string,
  amount: number,
  selectedProcesses: { [key: string]: string },
  requiredProducts: Set<string>,
  requiredProcesses: Set<string>,
  level: number,
  parentId: string | null = null
): ProductionChainProduct => {
  logInfo('Configuring process', { productId, amount, level, parentId });
  const processes = findProcessesThatYieldProduct(productId);

  if (processes.length === 0) {
    requiredProducts.add(productId);
    logInfo('No process found', { productId, amount });
    return createProductionChainProduct(
      { id: productId, name: productMap.get(productId) || 'Unknown Product' },
      amount,
      undefined
    );
  }

  const uniqueId = generateUniqueId(productId, level, parentId);
  logInfo('Generated unique ID', { productId, level, uniqueId });

  const selectedProcessId = selectedProcesses[uniqueId];
  const userPreferredProcess = selectedProcessId
    ? processes.find(process => process.id === selectedProcessId)
    : processes[0];

  if (!userPreferredProcess) {
    logError('Process not found', { selectedProcessId, productId });
    throw new Error(`Process with ID ${selectedProcessId} not found for product ${productId}`);
  }

  requiredProcesses.add(userPreferredProcess.id);
  const requiredOutput = userPreferredProcess.outputs.find(output => output.productId === productId);
  if (!requiredOutput) {
    logError('Required output not found', { productId, outputs: userPreferredProcess.outputs });
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
        calculateOutputAmount(userPreferredProcess, amount, output, productId)
      ))
  );

  const inputs = getInputsForProcess(userPreferredProcess);
  for (const input of inputs) {
    requiredProducts.add(input.productId);
    const inputAmount = calculateInputAmount(userPreferredProcess, amount, input, productId);
    const inputNode = configureProcess(input.productId, inputAmount, selectedProcesses, requiredProducts, requiredProcesses, level + 1, uniqueId);
    processNode.inputs.push(createProductionChainProduct(inputNode.product, inputAmount, inputNode.process));
  }

  logInfo('Configured process node', processNode);
  return createProductionChainProduct(
    { id: productId, name: productMap.get(productId) || 'Unknown Product' },
    amount,
    processNode
  );
};

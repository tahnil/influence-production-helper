import {
  Product,
  EndProduct,
  InputOutput,
  Process,
  ProductionChainProduct,
  ProductionChainProcess,
  ProductionChain
} from '../types/types';

export const createProduct = (id: string, name: string): Product => {
  return { id, name };
};

export const createEndProduct = (id: string, name: string, amount: number): EndProduct => {
  return { id, name, amount };
};

export const createInputOutput = (productId: string, unitsPerSR: string): InputOutput => {
  return { productId, unitsPerSR };
};

export const createProcess = (
  id: string,
  name: string,
  buildingId: string,
  inputs: InputOutput[],
  outputs: InputOutput[]
): Process => {
  return { id, name, buildingId, inputs, outputs };
};

export const createProductionChainProduct = (
  product: { id: string; name: string },
  amount: number,
  process?: ProductionChainProcess | null
): ProductionChainProduct => {
  return { product, amount, process };
};

export const createProductionChainProcess = (
  id: string,
  name: string,
  buildingId: string, // Add buildingId parameter here
  inputs: ProductionChainProduct[],
  requiredOutput: ProductionChainProduct[],
  otherOutput: ProductionChainProduct[]
): ProductionChainProcess => {
  return { id, name, buildingId, inputs, requiredOutput, otherOutput };
};

export const createProductionChain = (
  endProduct: EndProduct,
  products: Product[],
  processes: Process[],
  productionChainProcess: ProductionChainProcess
): ProductionChain => {
  return {
    endProduct,
    products,
    processes,
    productionChain: {
      process: productionChainProcess,
    },
  };
};

// src/types/types.ts

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface Product {
  id: string;
  name: string;
  type: string;
  massKilogramsPerUnit: string;
  volumeLitersPerUnit: string;
  category: string;
  quantized: boolean;
}

export interface SpectralType {
  id: number;
  name: string;
  processes: string[];
}

export interface Process {
  id: string;
  name: string;
  inputs: InputOutput[];
  outputs: InputOutput[];
  buildingId: string;
}

export interface EndProduct extends Product {
  amount: number;
}

export interface InputOutput {
  productId: string;
  unitsPerSR: string;
}


export interface ProductionChainProduct {
  product: Product;
  amount: number;
  process?: ProductionChainProcess | null;
}

export interface ProductionChainProcess {
  id: string;
  name: string;
  buildingId: string;
  inputs: ProductionChainProduct[];
  requiredOutput: ProductionChainProduct[];
  otherOutput: ProductionChainProduct[];
}

export interface ProductionChain {
  endProduct: EndProduct;
  products: Product[];
  processes: Process[];
  productionChain: {
    process: ProductionChainProcess;
  };
  spectralTypes: SpectralType[];
}

export interface Input {
  product: Product;
  unitsPerSR: string;
}

export interface ProcessConfiguratorProps {
  product: Product;
  amount: number;
  selectedProcesses: { [key: string]: string };
  onProcessSelect: (uniqueId: string, processId: string) => void;
  level?: number;
  parentId?: string | null;
}

export interface ProductionChainState {
  selectedProduct: Product | null;
  selectedProcesses: { [key: string]: string };
  productionChain: any;
  loading: boolean;
  error: string | null;
  setSelectedProduct: (product: Product) => void;
  setSelectedProcess: (uniqueId: string, processId: string) => void;
  configureChain: (amount: number) => Promise<void>;
}
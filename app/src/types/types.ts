// src/types/types.ts
import * as d3 from 'd3';

// used by
// src/pages/api/processes.ts
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface Product {
  id: string;
  name: string;
  type?: string;
  massKilogramsPerUnit?: string;
  volumeLitersPerUnit?: string;
  category?: string;
  quantized?: boolean;
}

// Define types for the enriched products
export interface EndProduct extends Product {
  amount: number;
}

export interface ProductWithSpectralTypes extends Product {
  spectralTypes?: { id: string; name: string }[];
}

export interface Process {
  id: string;
  name: string;
  inputs: InputOutput[];
  outputs: InputOutput[];
  buildingId: string;
  bAdalianHoursPerAction?: string;
  mAdalianHoursPerSR?: string;
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

export interface SpectralType {
  id: string;
  name: string;
  processes: string[];
}

export interface ProductionChain {
  endProduct: EndProduct;
  products: Product[];
  processes: Process[];
  productionChain: {
    process: ProductionChainProcess;
  };
  spectralTypes?: SpectralType[];
}

// used by
// components/ProcessConfigurator.tsx
// components/ProcessInputs.tsx
// lib/processUtils.ts
export interface Input {
  product: Product;
  unitsPerSR: string;
}

// used by
// components/ProcessConfigurator.tsx
export interface ProcessConfiguratorProps {
  product: Product;
  amount: number;
  selectedProcesses: { [key: string]: string };
  onProcessSelect: (uniqueId: string, processId: string) => void;
  level?: number;
  parentId?: string | null;
}

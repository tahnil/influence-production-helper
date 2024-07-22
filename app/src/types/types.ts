// src/types/types.ts
import * as d3 from 'd3';

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

// Define a new type for the enriched product
export interface ProductWithSpectralTypes extends Product {
  spectralTypes?: { id: string; name: string }[];
}

export interface SpectralType {
  id: string;
  name: string;
  processes: string[];
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
  spectralTypes?: SpectralType[];
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
  processes: Process[];
  setSelectedProduct: (product: Product) => void;
  setSelectedProcess: (uniqueId: string, processId: string) => void;
  configureChain: (amount: number) => Promise<void>;
  fetchProcesses: () => Promise<void>;
}

export interface TreeNode {
  type: string;
  name: string;
  amount?: number;
  children?: TreeNode[];
  inputs?: TreeNode[];
  outputs?: TreeNode[];
  selectableProcesses?: Process[];
  selectedProcessId?: string;
  isExpanded?: boolean;
}

export interface HierarchyNode {
  id: string;
  name: string;
  amount: number;
  children?: HierarchyNode[];
  _children?: HierarchyNode[];
  selectableProcesses?: Process[];
  selectedProcessId?: string;
  inputs?: HierarchyNode[];
}

export interface ExtendedHierarchyNode extends d3.HierarchyNode<HierarchyNode> {
  x0?: number;
  y0?: number;
  _children?: this[];
  id: string | undefined;
  selectableProcesses?: Process[];
  selectedProcessId?: string;
}
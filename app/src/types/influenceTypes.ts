// types/influenceTypes.ts
// types for influence entities
export interface InfluenceProduct {
    id: string;
    name: string;
    massKilogramsPerUnit?: string;
    volumeLitersPerUnit?: string;
    type?: string;
    category?: string;
    quantized?: boolean;
}

export interface InfluenceProcess {
    id: string;
    name: string;
    inputs: InfluenceProcessInputOutput[];
    outputs: InfluenceProcessInputOutput[];
    buildingId: string;
    bAdalianHoursPerAction: string;
    mAdalianHoursPerSR: string;
}

export interface InfluenceProcessInputOutput {
    productId: string;
    unitsPerSR: string;
}

export interface ProcessInput {
    product: InfluenceProduct;
    unitsPerSR: string;
}

export interface ProcessOutput {
    product: InfluenceProduct;
    unitsPerSR: string;
}

export interface EndProduct extends InfluenceProduct {
    amount: number;
}

export interface ProductWithSpectralTypes extends InfluenceProduct {
  spectralTypes?: { id: string; name: string }[];
}

export interface SpectralType {
    id: string;
    name: string;
    processes: string[];
}

export interface ProductionChainProduct {
    product: InfluenceProduct;
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
    products: InfluenceProduct[];
    processes: InfluenceProcess[];
    productionChain: {
        process: ProductionChainProcess;
    };
    spectralTypes?: SpectralType[];
}

// used by
// src/pages/api/processes.ts
// src/pages/api/products.ts
export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

// used by
// components/ProcessConfigurator.tsx
// components/ProcessInputs.tsx
// lib/processUtils.ts
export interface Input {
  product: InfluenceProduct;
  unitsPerSR: string;
}
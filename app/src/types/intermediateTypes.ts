// types/intermediateTypes.ts

// Intermediate types to bridge the legacy structure and our new types

export interface LegacyProduct {
    id: string;
    name: string;
    amount?: number; // Only used in endProduct and intermediate steps
}

export interface LegacyProcessInputsRequiredOutputsOtherOutputs {
    product: LegacyProduct;
    amount: number;
    process?: LegacyProcessInChain; // Recursive reference to the process that produces this product
}

export interface LegacyProcessShortInput {
    productId: string;
    unitsPerSR: string;
}

export interface LegacyProcessList {
    id: string;
    name: string;
    buildingId: string;
    inputs?: LegacyProcessShortInput[];
    outputs?: LegacyProcessShortInput[];
}

export interface LegacyProcessInChain {
    id: string;
    name: string;
    buildingId: string;
    inputs?: LegacyProcessInputsRequiredOutputsOtherOutputs[];
    requiredOutput: LegacyProcessInputsRequiredOutputsOtherOutputs[];
    otherOutput?: LegacyProcessInputsRequiredOutputsOtherOutputs[];
}

export interface LegacyProductionChain {
    endProduct: LegacyProduct;
    products: LegacyProduct[];
    processes: LegacyProcessList[];
    productionChain: {
        process: LegacyProcessInChain;
    };
}

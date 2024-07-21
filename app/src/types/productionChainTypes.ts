import { InfluenceProduct, InfluenceProcess } from './influenceTypes';

// Define the type for a product used in the production chain
export interface ProductionChainProduct {
    product: InfluenceProduct;
    amount: number;
    process?: ProductionChainProcess; // Recursive reference to the process that produces this product
}

// Define the type for a process used in the production chain
export interface ProductionChainProcess {
    id: string;
    name: string;
    buildingId: string;
    inputs: ProductionChainProduct[];
    requiredOutput: ProductionChainProduct[];
    otherOutput: ProductionChainProduct[];
}

// Define the type for the entire production chain
export interface ProductionChain {
    endProduct: ProductionChainProduct;
    process: ProductionChainProcess;
}

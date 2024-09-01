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
    buildingId: string;
    inputs: InfluenceProcessInputOutput[];
    outputs: InfluenceProcessInputOutput[];
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
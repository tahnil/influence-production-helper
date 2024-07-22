// type for influence entities
export interface InfluenceProduct {
    category?: string;
    id: string;
    massKilogramsPerUnit?: number;
    name: string;
    quantized?: boolean;
    type?: string;
    volumeLitersPerUnit?: number;
}

export interface InfluenceProcess {
    bAdalianHoursPerAction: string;
    buildingId: string;
    id: string;
    inputs: InfluenceProcessInputOutput[];
    mAdalianHoursPerSR: string;
    name: string;
    outputs: InfluenceProcessInputOutput[];
}

export interface InfluenceProcessInputOutput {
    productId: string;
    unitsPerSR: string;
}
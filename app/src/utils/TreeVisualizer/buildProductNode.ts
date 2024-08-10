// components/TreeVisualizer/buildProductNode.ts

import { ProductNode } from '@/types/d3Types';
import { InfluenceProduct, InfluenceProcess } from '@/types/influenceTypes';
import { generateUniqueId } from '@/utils/generateUniqueId';

export const buildProductNode = (
    productData: InfluenceProduct,
    processes: InfluenceProcess[],
    desiredAmount: number | 0
): ProductNode => {
    // console.log('[buildProductNode] Product data: ',productData,'\nMassKgPerUnit: ',productData.massKilogramsPerUnit,'\nVolPerUnit: ',productData.volumeLitersPerUnit);
    const amount = desiredAmount;
    const totalWeight = amount * parseFloat(productData.massKilogramsPerUnit || '0');
    const totalVolume = amount * parseFloat(productData.volumeLitersPerUnit || '0');
    // console.log('[buildProductNode]\nTotal weight: ',totalWeight,'\nTotal volume: ',totalVolume);

    if (!productData) {
        throw new Error('[buildProductNode] productData is undefined');
    }
    return {
        id: generateUniqueId(),
        name: productData.name,
        nodeType: 'product',
        productData: productData,
        amount: amount,
        totalWeight,
        totalVolume,
        children: [],
        _children: [],
        processes: processes
    };
};

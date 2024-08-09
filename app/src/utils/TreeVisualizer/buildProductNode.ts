// components/TreeVisualizer/buildProductNode.ts

import { ProductNode } from '@/types/d3Types';
import { InfluenceProduct, InfluenceProcess } from '@/types/influenceTypes';
import { generateUniqueId } from '@/utils/generateUniqueId';

export const buildProductNode = (
    productData: InfluenceProduct,
    processes: InfluenceProcess[]
): ProductNode => {
    if (!productData) {
        throw new Error('[buildProductNode] productData is undefined');
    }
    return {
        id: generateUniqueId(),
        name: productData.name,
        nodeType: 'product',
        productData: productData,
        amount: 0,
        totalWeight: 0,
        totalVolume: 0,
        children: [],
        _children: [],
        processes: processes
    };
};

// utils/TreeVisualizer/buildProductNode.ts

import { Node } from '@xyflow/react';
import { ProductNodeData } from '@/types/reactFlowTypes';
import { InfluenceProduct, InfluenceProcess } from '@/types/influenceTypes';
import { generateUniqueId } from '@/utils/generateUniqueId';

export const buildProductNode = (
    productData: InfluenceProduct,
    processes: InfluenceProcess[],
    desiredAmount: number = 0,
    imageBase64: string = '',
    buildProcessNodeCallback?: (processId: string, productNodeData: ProductNodeData) => void
): InfluenceFlowNode => {
    // Calculate amount, total weight, and total volume
    // console.log('[buildProductNode] Product data: ',productData,'\nMassKgPerUnit: ',productData.massKilogramsPerUnit,'\nVolPerUnit: ',productData.volumeLitersPerUnit);
    const amount = desiredAmount;
    const totalWeight = amount * parseFloat(productData.massKilogramsPerUnit || '0');
    const totalVolume = amount * parseFloat(productData.volumeLitersPerUnit || '0');
    // console.log('[buildProductNode]\nTotal weight: ',totalWeight,'\nTotal volume: ',totalVolume);

    if (!productData) {
        throw new Error('[buildProductNode] productData is undefined');
    }

    // Construct the ProductNodeData for React Flow
    const productNodeData: ProductNodeData = {
        name: productData.name,
        productData: productData,
        amount: amount,
        totalWeight,
        totalVolume,
        processes: processes,
        imageBase64: imageBase64,
        buildProcessNodeCallback: buildProcessNodeCallback,
    };

    // Return the React Flow node
    return {
        id: generateUniqueId(),
        type: 'productNode', // Custom node type that corresponds to the React Flow node type definition
        data: productNodeData,
        position: { x: 0, y: 0 }, // Initial position, can be adjusted later
    };
};

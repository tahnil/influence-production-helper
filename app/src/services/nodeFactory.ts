// services/nodeFactory.ts
import { generateUniqueId } from '@/utils/generateUniqueId';
import { Node } from '@xyflow/react';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { ProductNode } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNode } from '@/components/TreeVisualizer/ProcessNode';
import { SideProductCompoundNode } from '@/components/TreeVisualizer/SideProductCompoundNode';
import { ProductData } from '@/types/influenceTypes';
import { SideProductNode } from '@/components/TreeVisualizer/SideProductNode';

export function createProcessNode(
    processData: any,
    logicalParentId: string
): ProcessNode {
    console.log('[nodeFactory | createProcessNode] processData:', processData);
    return {
        id: generateUniqueId(),
        type: 'processNode',
        position: { x: 0, y: 0 },
        data: {
            totalDuration: processData.totalDuration,
            totalRuns: processData.totalRuns,
            image: processData.buildingIcon,
            processDetails: processData.processDetails,
            inputProducts: processData.inputProducts,
            logicalParentId,
            inflowIds: [],
            outflowIds: [logicalParentId],
        }
    };
}

export function createProductNode(
    productData: ProductData,
    amount: number,
    logicalParentId?: string
): ProductNode {
    return {
        id: generateUniqueId(),
        type: 'productNode',
        position: { x: 0, y: 0 },
        data: {
            amount,
            totalWeight: parseFloat(productData.productDetails.massKilogramsPerUnit || '0') * amount,
            totalVolume: parseFloat(productData.productDetails.volumeLitersPerUnit || '0') * amount,
            image: productData.image,
            productDetails: productData.productDetails,
            processesByProductId: productData.processesByProductId,
            inflowIds: [],
            outflowIds: [],
            logicalParentId,
            handleSelectProcess: undefined, // Will be added later in the flow
            handleSerialize: undefined, // Will be added later in the flow
        }
    };
}

export function createSideProductNode(
    productData: ProductData,
    amount: number,
    processNodeId: string,
    compoundNodeId: string
): SideProductNode {
    return {
        id: generateUniqueId(),
        type: 'sideProductNode',
        position: { x: 0, y: 0 },
        data: {
            amount,
            totalWeight: parseFloat(productData.productDetails.massKilogramsPerUnit || '0') * amount,
            totalVolume: parseFloat(productData.productDetails.volumeLitersPerUnit || '0') * amount,
            image: productData.image,
            productDetails: productData.productDetails,
            ancestorIds: [processNodeId],
            inflowIds: [],
            outflowIds: [processNodeId],
            logicalParentId: compoundNodeId,
        }
    };
}

export function createSideProductCompoundNode(
    processNodeId: string
): SideProductCompoundNode {
    return {
        id: generateUniqueId(),
        type: 'sideProductCompoundNode',
        position: { x: 0, y: 0 },
        data: {
            id: '',
            width: 400,
            height: 250,
            inflowIds: [],
            outflowIds: [],
            logicalParentId: '', // This will be set later to the id of the outflowsCompoundNode
        }
    }
}
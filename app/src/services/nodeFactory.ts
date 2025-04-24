// services/nodeFactory.ts
import { generateUniqueId } from '@/utils/generateUniqueId';
import { Node } from '@xyflow/react';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { ProductNode } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNode } from '@/components/TreeVisualizer/ProcessNode';
import { SideProductCompoundNode } from '@/components/TreeVisualizer/SideProductCompoundNode';

export function createProcessNode(
    processData: any,
    logicalParentId: string
): ProcessNode {
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
    productData: any,
    amount: number,
    logicalParentId?: string
): ProductNode {
    return {
        id: generateUniqueId(),
        type: 'productNode',
        position: { x: 0, y: 0 },
        data: {
            amount,
            totalWeight: productData.weight * amount,
            totalVolume: productData.volume * amount,
            image: productData.image,
            productDetails: productData,
            processesByProductId: productData.processesByProductId,
            inflowIds: [],
            outflowIds: [],
            logicalParentId,
        }
    }
}

export function createSideProductNode(
    productData: any,
    amount: number,
    processNodeId: string,
    compoundNodeId: string
): ProductNode {
    return {
        id: generateUniqueId(),
        type: 'sideProductNode',
        position: { x: 0, y: 0 },
        data: {
            amount,
            totalWeight: productData.weight * amount,
            totalVolume: productData.volume * amount,
            image: productData.image,
            productDetails: productData,
            processesByProductId: [],
            inflowIds: [],
            outflowIds: [processNodeId],
            logicalParentId: compoundNodeId,
        }
    }
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
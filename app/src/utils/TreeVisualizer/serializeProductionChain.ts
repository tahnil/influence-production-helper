// utils/TreeVisualizer/serializeProductionChain.ts

import { ProcessNode, ProductNode } from '@/types/reactFlowTypes';
import { Node } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

type SerializedNode = {
    id: string;
    type: string;
    data: any;  // We'll keep all data from the original node
};

export const serializeProductionChain = (focalNodeId: string, nodes: Node[]): { doc: any, attachment: Blob } | null => {
    const serializedNodes: SerializedNode[] = [];
    const visitedNodes = new Set<string>();

    const traverseAncestors = (nodeId: string, isRoot: boolean = false) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || visitedNodes.has(nodeId)) {
            return;
        }
        visitedNodes.add(nodeId);

        const serializedNode: SerializedNode = {
            id: node.id,
            type: node.type || 'unknown',
            data: {
                ...node.data,
                isRoot,
            }
        };

        serializedNodes.push(serializedNode);

        // Traverse ancestors
        if (Array.isArray(node.data.ancestorIds)) {
            node.data.ancestorIds.forEach((ancestorId: string) => {
                traverseAncestors(ancestorId);
            });
        }
    };

    // Find the focal node
    const focalNode = nodes.find(node => node.id === focalNodeId);

    if (!focalNode) {
        console.error('Focal node not found');
        return null;
    }

    // Start traversal from the focal node
    traverseAncestors(focalNode.id, true);

    const serializedChain = {
        _id: uuidv4(),
        focalProductId: isProductNode(focalNode) ? focalNode.data.productDetails.id : undefined,
        createdAt: new Date().toISOString(),
        nodeCount: serializedNodes.length,
        rootProductId: serializedNodes.find(node => node.data.isRoot)?.data.productId,
        nodes: serializedNodes,
    };

    const fullDataAttachment = new Blob([JSON.stringify(serializedNodes)], { type: 'application/json' });

    return {
        doc: serializedChain,
        attachment: fullDataAttachment
    };
};

// Type guard for ProductNode
function isProductNode(node: Node): node is ProductNode {
    return node.type === 'productNode' && node.data && 'productDetails' in node.data;
}

// Type guard for ProcessNode
function isProcessNode(node: Node): node is ProcessNode {
    return node.type === 'processNode' && node.data && 'processDetails' in node.data;
}
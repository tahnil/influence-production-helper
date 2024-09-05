// utils/TreeVisualizer/serializeProductionChain.ts

import { ProductNode } from '@/types/reactFlowTypes';
import { Node } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

type SerializedNode = {
    id: string;
    type: string;
    data: any;  // We'll keep all data from the original node
};

export const serializeProductionChain = async (
    focalNodeId: string, 
    nodes: Node[], 
    db: PouchDB.Database
): Promise<void> => {
    if (!db) {
        console.error('PouchDB instance is not available');
        return;
    }
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
        return;
    }

    // Start traversal from the focal node
    traverseAncestors(focalNode.id, true);

    const serializedChain = {
        _id: uuidv4(),
        focalProductId: isProductNode(focalNode) ? focalNode.data.productDetails.id : undefined,
        createdAt: new Date().toISOString(),
        nodeCount: serializedNodes.length,
        rootProductId: serializedNodes.find(node => node.data.isRoot)?.data.productDetails.id,
        nodes: serializedNodes,
    };

    console.log('Attempting to save serialized chain:', JSON.stringify(serializedChain));

    try {
        const response = await db.put(serializedChain);
        console.log('Successfully saved configuration:', response);

        const attachment = new Blob([JSON.stringify(serializedNodes)], { type: 'application/json' });
        await db.putAttachment(serializedChain._id, 'nodes', response.rev, attachment, 'application/json');
        console.log('Successfully saved attachment');

        // Log all documents after saving
        const allDocs = await db.allDocs();
        console.log('All document IDs in PouchDB after saving:', allDocs.rows.map(row => row.id));
    } catch (error) {
        console.error('Error saving configuration:', error);
        // You might want to throw the error here if you want to handle it in the calling function
        // throw error;
    }
};

// Type guard for ProductNode
function isProductNode(node: Node): node is ProductNode {
    return (
        node.type === 'productNode' &&
        node.data !== null &&
        typeof node.data === 'object' &&
        'productDetails' in node.data &&
        typeof node.data.productDetails === 'object' &&
        node.data.productDetails !== null &&
        'id' in node.data.productDetails
    );
}
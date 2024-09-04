// utils/TreeVisualizer/serializeProductionChain.ts

import { Node } from '@xyflow/react';
import { generateUniqueId } from '../generateUniqueId';

interface SerializedNode {
    id: string;
    data: any;
    type?: string;
    parentId?: string;
}

function serializeProductionChain(focalProductId: string, nodes: Node[]): SerializedNode[] {
    const serializedNodes: SerializedNode[] = [];
    const visitedNodes = new Set<string>();

    function traverseAncestors(nodeId: string, isRoot: boolean = false) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || visitedNodes.has(nodeId)) {
            return;
        }

        visitedNodes.add(nodeId);

        const serializedNode: SerializedNode = {
            id: node.id,
            data: { ...node.data, isRoot }, // Store isRoot in data
            type: node.type,
            parentId: node.parentId,
        };
        serializedNodes.push(serializedNode);

        if (Array.isArray(node.data.ancestorIds)) {
            node.data.ancestorIds.forEach((ancestorId: string) => {
                traverseAncestors(ancestorId);
            });
        } else {
            console.error(`Expected ancestorIds to be an array, but got:`, node.data.ancestorIds);
        }
    }

    // Start traversal from the focal product node
    traverseAncestors(focalProductId, true); // Mark the initial node as the root

    return serializedNodes;
}

export default serializeProductionChain;
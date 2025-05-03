import { InfluenceNode } from "@/types/reactFlowTypes";

/**
 * Establishes bidirectional logical relationships between nodes
 * @param nodes Array of nodes to process
 * @returns Updated nodes with proper inflowIds and outflowIds
 */
export function establishLogicalRelationships(nodes: InfluenceNode[]): InfluenceNode[] {
    // Create a copy of nodes to avoid mutating the originals
    const updatedNodes = [...nodes];

    // For each node with a logicalParentId, update the parent's inflowIds
    nodes.forEach((node, index) => {
        if (node.data.logicalParentId) {
            // Skip compound nodes - they shouldn't participate in logical relationships
            if (node.type === 'outflowsCompoundNode' || node.type === 'sideProductCompoundNode') {
                return;
            }
            // Find the logical parent
            const parentIndex = updatedNodes.findIndex(
                n => n.id === node.data.logicalParentId
            );

            if (parentIndex !== -1) {
                // Add this node's ID to the parent's inflowIds if not already there
                updatedNodes[parentIndex].data.inflowIds =
                    updatedNodes[parentIndex].data.inflowIds || [];

                if (!(updatedNodes[parentIndex].data.inflowIds as string[]).includes(node.id)) {
                    (updatedNodes[parentIndex].data.inflowIds as string[]).push(node.id);
                }

                // Add the parent's ID to this node's outflowIds if not already there
                updatedNodes[index].data.outflowIds =
                    updatedNodes[index].data.outflowIds || [];

                if (!(updatedNodes[index].data.outflowIds as string[]).includes(updatedNodes[parentIndex].id)) {
                    (updatedNodes[index].data.outflowIds as string[]).push(updatedNodes[parentIndex].id);
                }
            }
        }
    });

    return updatedNodes;
}
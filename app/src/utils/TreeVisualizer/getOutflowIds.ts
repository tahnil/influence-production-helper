import { Node } from '@xyflow/react';

/**
 * Utility function to get all outflow ids of a given node id
 * @param nodeId - The ID of the node for which to find all outflows
 * @param nodes - The array of nodes in which to search for outflows
 * @returns An array of IDs for all outflow nodes
 */

// Utility function to get all outflow ids of a given node id
export const getOutflowIds = (nodeId: string, nodes: Node[]): string[] => {
    // Find all direct children (ProductNodes)
    const directChildren = nodes.filter((node) => node.parentId === nodeId);

    // Recursively find all outflows for each direct child
    const allOutflows = directChildren.reduce<string[]>((acc, child) => {
        const childOutflows = getOutflowIds(child.id, nodes);
        return [...acc, child.id, ...childOutflows];
    }, []);

    // Return the list of all outflow IDs
    return allOutflows;
};
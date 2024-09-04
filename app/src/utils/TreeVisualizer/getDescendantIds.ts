import { Node } from '@xyflow/react';

/**
 * Utility function to get all descendant ids of a given node id
 * @param nodeId - The ID of the node for which to find all descendants
 * @param nodes - The array of nodes in which to search for descendants
 * @returns An array of IDs for all descendant nodes
 */

// Utility function to get all descendant ids of a given node id
export const getDescendantIds = (nodeId: string, nodes: Node[]): string[] => {
    // Find all direct children (ProductNodes)
    const directChildren = nodes.filter((node) => node.parentId === nodeId);

    // Recursively find all descendants for each direct child
    const allDescendants = directChildren.reduce<string[]>((acc, child) => {
        const childDescendants = getDescendantIds(child.id, nodes);
        return [...acc, child.id, ...childDescendants];
    }, []);

    // Return the list of all descendant IDs
    return allDescendants;
};
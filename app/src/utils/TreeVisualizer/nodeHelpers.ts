// utils/nodeManipulationHelpers.ts

import { Node } from '@xyflow/react';
import { InfluenceNode } from '@/types/reactFlowTypes';

// ### Part 1 ###
// Generic Node Manipulation Functions
// 
export const updateNode = (
    nodes: Node[],
    updatedNode: Node
): Node[] => {
    return nodes.map(node => node.id === updatedNode.id ? { ...node, ...updatedNode } : node);
};

export const updateInfluenceNode = (nodes: InfluenceNode[], updatedNode: InfluenceNode): InfluenceNode[] => {
    return nodes.map(node => node.id === updatedNode.id ? updatedNode : node);
};

export const removeNode = (
    nodes: Node[],
    nodeId: string
): Node[] => {
    return nodes.filter(node => node.id !== nodeId);
};

export const addNode = (
    nodes: Node[],
    newNode: Node
): Node[] => {
    return [...nodes, newNode];
};

// find and return from all nodes the node with the given id
export const findNodeById = (
    nodes: Node[],
    id: string
): Node | undefined => {
    return nodes.find(node => node.id === id);
};

// ### Part 2 ###
// Influence Node Inspection, Traversal, and Manipulation Functions

// Get direct parent nodes (outflows)
export const getDirectParentNodes = (
    nodes: InfluenceNode[],
    nodeId: string
): InfluenceNode[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    return nodes.filter(n => Array.isArray(node.data.outflowIds) && node.data.outflowIds.includes(n.id));
};

// Get direct child nodes (inflows)
export const getDirectChildNodes = (
    nodes: InfluenceNode[],
    nodeId: string
): InfluenceNode[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    return nodes.filter(n => Array.isArray(node.data.inflowIds) && node.data.inflowIds.includes(n.id));
};

// Add a node id to outflows
export const addOutflow = (
    node: InfluenceNode,
    outflowId: string
): InfluenceNode => {
    if (!node.data.outflowIds) {
        node.data.outflowIds = [];
    }
    if (Array.isArray(node.data.outflowIds) && !node.data.outflowIds.includes(outflowId)) {
        node.data.outflowIds.push(outflowId);
    }
    return { ...node };
};

// Remove a node id from outflows
export const removeOutflow = (
    node: InfluenceNode,
    outflowId: string
): InfluenceNode => {
    if (node.data.outflowIds) {
        node.data.outflowIds = Array.isArray(node.data.outflowIds)
            ? node.data.outflowIds.filter(id => id !== outflowId)
            : [];
    }
    return { ...node };
};

// Add a node id to inflows
export const addInflow = (
    node: InfluenceNode,
    inflowId: string
): InfluenceNode => {
    if (!node.data.inflowIds) {
        node.data.inflowIds = [];
    }
    if (Array.isArray(node.data.inflowIds) && !node.data.inflowIds.includes(inflowId)) {
        node.data.inflowIds.push(inflowId);
    }
    return { ...node };
};

// Remove a node id from inflows
export const removeInflow = (
    node: InfluenceNode,
    inflowId: string
): InfluenceNode => {
    if (node.data.inflowIds) {
        node.data.inflowIds = Array.isArray(node.data.inflowIds)
            ? node.data.inflowIds.filter(id => id !== inflowId)
            : [];
    }
    return { ...node };
};

// Traverse all inflows or outflows of a given node
export const traverseNodes = (
    nodes: InfluenceNode[],
    startNodeId: string,
    direction: 'inflows' | 'outflows'
): InfluenceNode[] => {
    const result: InfluenceNode[] = [];
    const visited = new Set<string>();

    const traverse = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        result.push(node);

        const idsToTraverse: string[] = direction === 'inflows'
            ? (Array.isArray(node.data.inflowIds) ? node.data.inflowIds : [])
            : (Array.isArray(node.data.outflowIds) ? node.data.outflowIds : []);
        if (idsToTraverse) {
            idsToTraverse.forEach(id => traverse(id));
        }
    };

    traverse(startNodeId);

    // Remove the start node from the result
    return result.filter(node => node.id !== startNodeId);
};

// Helper function to get all inflows of a node
export const getAllInflows = (nodes: InfluenceNode[], nodeId: string): InfluenceNode[] => {
    return traverseNodes(nodes, nodeId, 'inflows');
};

// Helper function to get all outflows of a node
export const getAllOutflows = (nodes: InfluenceNode[], nodeId: string): InfluenceNode[] => {
    return traverseNodes(nodes, nodeId, 'outflows');
};

// Sort nodes by hierarchy
export const sortNodesByHierarchy = (nodes: InfluenceNode[]): InfluenceNode[] => {
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const sorted: InfluenceNode[] = [];
    const visited = new Set<string>();

    const visit = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = nodeMap.get(nodeId);
        if (!node) return;

        if (typeof node.data.logicalParentId === 'string'
            && node.data.logicalParentId
            && !visited.has(node.data.logicalParentId)) {
            visit(node.data.logicalParentId);
        } else {
            console.error(`Node ${nodeId} has no logical parent ID or is not a string.`);
            throw new Error(`Node ${nodeId} has no logical parent ID or is not a string.`);
        }

        sorted.push(node);
    };

    nodes.forEach(node => visit(node.id));

    return sorted;
};

/**
 * Utility function to get all outflow ids of a given node id
 * @param nodeId - The ID of the node for which to find all outflows
 * @param nodes - The array of nodes in which to search for outflows
 * @returns An array of IDs for all outflow nodes
 */

// Utility function to get all outflow ids of a given node id
export const getOutflowIds = (nodeId: string, nodes: Node[]): string[] => {
    // Find all direct children (ProductNodes)
    const directChildren = nodes.filter((node) => node.data.logicalParentId === nodeId);

    // Recursively find all outflows for each direct child
    const allOutflows = directChildren.reduce<string[]>((acc, child) => {
        const childOutflows = getOutflowIds(child.id, nodes);
        return [...acc, child.id, ...childOutflows];
    }, []);

    // Return the list of all outflow IDs
    return allOutflows;
};

// Helper function to get measured width of nodes that are not compound nodes
export function getNodeWidth(node: Node, nodes: InfluenceNode[]): number {
    if (node.data.isCompound) {
        return getCompoundNodeWidth(node, nodes);
    } else {
        return node.measured?.width || 800;
    }
}

// Helper function to get measured height of nodes that are not compound nodes
export function getNodeHeight(node: Node, nodes: InfluenceNode[]): number {
    if (node.data.isCompound) {
        return getCompoundNodeHeight(node, nodes);
    } else {
        return node.measured?.height || 800;
    }
}

// Helper function to calculate width of compound nodes based on children
export function getCompoundNodeWidth(node: Node, nodes: InfluenceNode[]): number {
    const outflowsCompoundChildren = nodes.filter(child => child.parentId === node.id);
    const outflowsCompoundTotalWidth = outflowsCompoundChildren.reduce((acc, child) => {
        const childWidth = child.measured?.width || 800;
        return acc + childWidth;
    }, 0);
    console.log("[applyDagreLayout | Dagre] Compound node width:", outflowsCompoundTotalWidth);
    return outflowsCompoundTotalWidth;
}

// Helper function to calculate height of compound nodes based on children
export function getCompoundNodeHeight(node: Node, nodes: InfluenceNode[]): number {
    const outflowsCompoundChildren = nodes.filter(child => child.parentId === node.id);
    const outflowsCompoundTotalHeight = outflowsCompoundChildren.reduce((acc, child) => {
        const childHeight = child.measured?.height || 800;
        return acc + childHeight;
    }, 0);
    console.log("[applyDagreLayout | Dagre] Compound node height:", outflowsCompoundTotalHeight);
    return outflowsCompoundTotalHeight;
}

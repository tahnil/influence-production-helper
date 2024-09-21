// utils/nodeManipulationHelpers.ts

import { Node, Edge } from '@xyflow/react';
import { InfluenceNode, ProductNode, ProcessNode } from '@/types/reactFlowTypes';

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

// Get direct parent nodes (descendants)
export const getDirectParentNodes = (
    nodes: InfluenceNode[], 
    nodeId: string
): InfluenceNode[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    return nodes.filter(n => node.data.descendantIds?.includes(n.id));
};

// Get direct child nodes (ancestors)
export const getDirectChildNodes = (
    nodes: InfluenceNode[], 
    nodeId: string
): InfluenceNode[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    return nodes.filter(n => node.data.ancestorIds?.includes(n.id));
};

// Add a node id to descendants
export const addDescendant = (
    node: InfluenceNode, 
    descendantId: string
): InfluenceNode => {
    if (!node.data.descendantIds) {
        node.data.descendantIds = [];
    }
    if (!node.data.descendantIds.includes(descendantId)) {
        node.data.descendantIds.push(descendantId);
    }
    return { ...node };
};

// Remove a node id from descendants
export const removeDescendant = (
    node: InfluenceNode, 
    descendantId: string
): InfluenceNode => {
    if (node.data.descendantIds) {
        node.data.descendantIds = node.data.descendantIds.filter(id => id !== descendantId);
    }
    return { ...node };
};

// Add a node id to ancestors
export const addAncestor = (
    node: InfluenceNode, 
    ancestorId: string
): InfluenceNode => {
    if (!node.data.ancestorIds) {
        node.data.ancestorIds = [];
    }
    if (!node.data.ancestorIds.includes(ancestorId)) {
        node.data.ancestorIds.push(ancestorId);
    }
    return { ...node };
};

// Remove a node id from ancestors
export const removeAncestor = (
    node: InfluenceNode, 
    ancestorId: string
): InfluenceNode => {
    if (node.data.ancestorIds) {
        node.data.ancestorIds = node.data.ancestorIds.filter(id => id !== ancestorId);
    }
    return { ...node };
};

// Traverse all ancestors or descendants of a given node
export const traverseNodes = (
    nodes: InfluenceNode[],
    startNodeId: string,
    direction: 'ancestors' | 'descendants'
): InfluenceNode[] => {
    const result: InfluenceNode[] = [];
    const visited = new Set<string>();

    const traverse = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        result.push(node);

        const idsToTraverse = direction === 'ancestors' ? node.data.ancestorIds : node.data.descendantIds;
        if (idsToTraverse) {
            idsToTraverse.forEach(id => traverse(id));
        }
    };

    traverse(startNodeId);

    // Remove the start node from the result
    return result.filter(node => node.id !== startNodeId);
};

// Helper function to get all ancestors of a node
export const getAllAncestors = (nodes: InfluenceNode[], nodeId: string): InfluenceNode[] => {
    return traverseNodes(nodes, nodeId, 'ancestors');
};

// Helper function to get all descendants of a node
export const getAllDescendants = (nodes: InfluenceNode[], nodeId: string): InfluenceNode[] => {
    return traverseNodes(nodes, nodeId, 'descendants');
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

        if (node.parentId && !visited.has(node.parentId)) {
            visit(node.parentId);
        }

        sorted.push(node);
    };

    nodes.forEach(node => visit(node.id));

    return sorted;
};
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

// Get direct parent nodes (outflows)
export const getDirectParentNodes = (
    nodes: InfluenceNode[], 
    nodeId: string
): InfluenceNode[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    return nodes.filter(n => node.data.outflowIds?.includes(n.id));
};

// Get direct child nodes (inflows)
export const getDirectChildNodes = (
    nodes: InfluenceNode[], 
    nodeId: string
): InfluenceNode[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    return nodes.filter(n => node.data.inflowIds?.includes(n.id));
};

// Add a node id to outflows
export const addOutflow = (
    node: InfluenceNode, 
    outflowId: string
): InfluenceNode => {
    if (!node.data.outflowIds) {
        node.data.outflowIds = [];
    }
    if (!node.data.outflowIds.includes(outflowId)) {
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
        node.data.outflowIds = node.data.outflowIds.filter(id => id !== outflowId);
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
    if (!node.data.inflowIds.includes(inflowId)) {
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
        node.data.inflowIds = node.data.inflowIds.filter(id => id !== inflowId);
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

        const idsToTraverse = direction === 'inflows' ? node.data.inflowIds : node.data.outflowIds;
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

        if (node.parentId && !visited.has(node.parentId)) {
            visit(node.parentId);
        }

        sorted.push(node);
    };

    nodes.forEach(node => visit(node.id));

    return sorted;
};
// utils/TreeVisualizer/applyDagreLayout.ts

import { DagreConfig } from '@/hooks/useDagreConfig';
import { Node, Edge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { getNodeHeight, getNodeWidth } from './nodeHelpers';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    console.log("[applyDagreLayout | Dagre] Applying layout with config:", config);

    // First, handle compound nodes and position their children
    // Instead of modifying nodes in-place, get new nodes with updated positions
    let updatedNodes = positionCompoundChildren(nodes);

    // Create a new dagre graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Set graph properties from config
    dagreGraph.setGraph({
        align: config.align,
        rankdir: config.rankdir,
        nodesep: config.nodesep,
        ranksep: config.ranksep,
        edgesep: config.edgesep,
        marginx: config.marginx,
        marginy: config.marginy,
        acyclicer: config.acyclicer !== 'undefined' ? config.acyclicer : undefined,
        ranker: config.ranker,
    });

    // Log the graph settings
    console.log("[applyDagreLayout | Dagre] Dagre graph settings:", dagreGraph.graph());

    // Get top-level nodes (no parentId)
    const topLevelNodes = updatedNodes.filter(node => !node.parentId);
    console.log("[applyDagreLayout | Dagre] Top level nodes for layout:", topLevelNodes.length);

    // Add nodes to the graph with appropriate dimensions
    topLevelNodes.forEach(node => {
        // Set node dimensions based on type or measured values
        const width = getNodeDimensions(node, updatedNodes).width;
        const height = getNodeDimensions(node, updatedNodes).height;

        console.log(`[applyDagreLayout | Dagre] Setting dimensions for node ${node.id} (${node.type}): ${width}x${height}`);
        dagreGraph.setNode(node.id, { width, height });
    });

    // Add all edges to the graph that connect top-level nodes
    let topLevelEdges = 0;
    edges.forEach(edge => {
        const sourceNode = updatedNodes.find(n => n.id === edge.source);
        const targetNode = updatedNodes.find(n => n.id === edge.target);

        // Only add edges between top-level nodes to dagre
        if (sourceNode && targetNode && !sourceNode.parentId && !targetNode.parentId) {
            dagreGraph.setEdge(edge.source, edge.target, {
                minlen: config.minlen,
                weight: config.weight,
                width: config.width,
                height: config.height,
                labelpos: config.labelpos,
                labeloffset: config.labeloffset,
            });
            topLevelEdges++;
        }
    });
    console.log(`[applyDagreLayout | Dagre] Added ${topLevelEdges} top-level edges to dagre`);

    // Run the layout algorithm
    dagre.layout(dagreGraph);

    // Apply the calculated layout to the nodes
    const layoutedNodes = updatedNodes.map(node => {
        // Position top-level nodes according to dagre
        if (!node.parentId) {
            const dagreNode = dagreGraph.node(node.id);

            if (dagreNode) {
                console.log(`[applyDagreLayout | Dagre] Node ${node.id} positioned at:`, dagreNode.x, dagreNode.y);
                return {
                    ...node,
                    position: {
                        x: dagreNode.x - dagreNode.width / 2,
                        y: dagreNode.y - dagreNode.height / 2
                    }
                };
            }
        }

        // Keep position for child nodes
        return node;
    });

    return {
        layoutedNodes,
        layoutedEdges: edges // Return edges unchanged
    };
}

/**
 * Get the dimensions for a node based on its type or measured values
 */
function getNodeDimensions(node: Node, allNodes: Node[]): { width: number; height: number } {
    // Check if node has measured values
    if (node.measured?.width && node.measured?.height) {
        return {
            width: node.measured.width,
            height: node.measured.height
        };
    }

    // Use type-specific dimensions as fallback
    switch (node.type) {
        case 'productNode':
            return { width: 300, height: 290 };
        case 'processNode':
            return { width: 250, height: 185 };
        case 'sideProductNode':
            return { width: 218, height: 115 };
        case 'sideProductCompoundNode': {
            // Calculate based on children
            const dimensions = getSideProductCompoundDimensions(node, allNodes);
            return dimensions;
        }
        case 'outflowsCompoundNode': {
            // Calculate based on children
            const dimensions = getOutflowsCompoundDimensions(node, allNodes);
            return dimensions;
        }
        default:
            return { width: 200, height: 100 };
    }
}

/**
 * Calculate dimensions for a side product compound node based on its children
 */
function getSideProductCompoundDimensions(compoundNode: Node, allNodes: Node[]): { width: number; height: number } {
    // Find all children of this compound node
    const children = allNodes.filter(node => node.parentId === compoundNode.id);

    if (children.length === 0) {
        return { width: 300, height: 200 }; // Default size for empty compound
    }

    // Use 3 columns for 6 or fewer children, 4 columns for more
    const columns = children.length <= 6 ? 3 : 4;
    const rows = Math.ceil(children.length / columns);

    // Use consistent size for side product nodes
    const childWidth = 218; // Expected width for side product nodes
    const childHeight = 115; // Expected height for side product nodes

    // Add padding between nodes and on the edges
    const padding = 15;

    // Calculate total dimensions
    const width = (childWidth * columns) + (padding * (columns + 1));
    const height = (childHeight * rows) + (padding * (rows + 1));

    console.log(`[getSideProductCompoundDimensions] Compound ${compoundNode.id} with ${children.length} children: ${width}x${height}`);

    return { width, height };
}

/**
 * Calculate dimensions for an outflows compound node based on its children
 */
function getOutflowsCompoundDimensions(compoundNode: Node, allNodes: Node[]): { width: number; height: number } {
    // Find all children of this compound node
    const children = allNodes.filter(node => node.parentId === compoundNode.id);

    if (children.length === 0) {
        return { width: 350, height: 200 }; // Default size for empty compound
    }

    // For simplicity, we'll use a horizontal layout for outflows compound
    let totalWidth = 0;
    let maxHeight = 0;

    // Calculate total width and max height
    children.forEach(child => {
        const { width, height } = getNodeDimensions(child, allNodes);
        totalWidth += width;
        maxHeight = Math.max(maxHeight, height);
    });

    // Add padding between nodes and on the edges
    const padding = 20;
    totalWidth += padding * (children.length + 1);
    maxHeight += padding * 2;

    console.log(`[getOutflowsCompoundDimensions] Compound ${compoundNode.id} with ${children.length} children: ${totalWidth}x${maxHeight}`);

    return { width: totalWidth, height: maxHeight };
}

/**
 * Position all children of compound nodes
 * @returns New array of nodes with updated positions for children
 */
function positionCompoundChildren(nodes: Node[]): Node[] {
    // Start with a copy of all nodes
    let updatedNodes = [...nodes];

    // First position children in side product compound nodes
    const sideProductCompounds = nodes.filter(node => node.type === 'sideProductCompoundNode');
    sideProductCompounds.forEach(compound => {
        updatedNodes = positionSideProductNodes(compound, updatedNodes);
    });

    // Then position children in outflows compound nodes
    const outflowsCompounds = nodes.filter(node => node.type === 'outflowsCompoundNode');
    outflowsCompounds.forEach(compound => {
        updatedNodes = positionOutflowsNodes(compound, updatedNodes);
    });

    return updatedNodes;
}

/**
 * Position side product nodes within their compound parent in a grid layout
 * @returns New array of nodes with updated positions for side product children
 */
function positionSideProductNodes(compoundNode: Node, allNodes: Node[]): Node[] {
    // Find all side product nodes that are children of this compound
    const childrenIndices = allNodes.reduce((indices, node, index) => {
        if (node.parentId === compoundNode.id && node.type === 'sideProductNode') {
            indices.push(index);
        }
        return indices;
    }, [] as number[]);

    if (childrenIndices.length === 0) return allNodes;

    // Use 3 columns for 6 or fewer children, 4 columns for more
    const childCount = childrenIndices.length;
    const columns = childCount <= 6 ? 3 : 4;
    const rows = Math.ceil(childCount / columns);

    // Use consistent size for side product nodes
    const childWidth = 218;
    const childHeight = 115;

    // Add padding between nodes and on the edges
    const padding = 15;

    // Create a new nodes array with updated positions
    return allNodes.map((node, index) => {
        const childIndex = childrenIndices.indexOf(index);

        if (childIndex !== -1) {
            // This is a child node that needs positioning
            const row = Math.floor(childIndex / columns);
            const col = childIndex % columns;

            const x = padding + (col * (childWidth + padding));
            const y = padding + (row * (childHeight + padding));

            console.log(`[positionSideProductNodes] Positioning node ${node.id} at (${x}, ${y}) in compound ${compoundNode.id}`);

            // Return a new node object with updated position
            return {
                ...node,
                position: { x, y }
            };
        }

        // Not a child of this compound, return unchanged
        return node;
    });
}

/**
 * Position nodes within an outflows compound parent
 * @returns New array of nodes with updated positions for outflow children
 */
function positionOutflowsNodes(compoundNode: Node, allNodes: Node[]): Node[] {
    // Find all nodes that are children of this compound
    const childrenIndices = allNodes.reduce((indices, node, index) => {
        if (node.parentId === compoundNode.id) {
            indices.push(index);
        }
        return indices;
    }, [] as number[]);

    if (childrenIndices.length === 0) return allNodes;

    // For simplicity, we'll use a horizontal layout
    let currentX = 20; // Starting padding
    const updatedPositions: { [index: number]: { x: number, y: number } } = {};

    // Calculate positions for each child
    childrenIndices.forEach(childIndex => {
        const node = allNodes[childIndex];
        const { width, height } = getNodeDimensions(node, allNodes);

        // Center vertically in parent
        const compoundHeight = getNodeDimensions(compoundNode, allNodes).height;
        const y = Math.max(0, (compoundHeight - height) / 2);

        // Store the position
        updatedPositions[childIndex] = { x: currentX, y };

        // Move currentX for the next node
        currentX += width + 20; // 20px padding between nodes

        console.log(`[positionOutflowsNodes] Calculated position for node ${node.id} at (${currentX}, ${y}) in compound ${compoundNode.id}`);
    });

    // Create a new nodes array with updated positions
    return allNodes.map((node, index) => {
        if (index in updatedPositions) {
            // Return a new node object with updated position
            return {
                ...node,
                position: updatedPositions[index]
            };
        }

        // Not a child of this compound, return unchanged
        return node;
    });
}

export default applyDagreLayout;
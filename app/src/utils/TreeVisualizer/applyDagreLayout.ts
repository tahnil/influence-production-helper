// utils/TreeVisualizer/applyDagreLayout.ts

import { DagreConfig } from '@/hooks/useDagreConfig';
import { Node, Edge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    // console.log("[applyDagreLayout | Dagre] Applying layout with config:", config);

    // Step 1: Position and update compound nodes
    let updatedNodes = positionCompoundChildren(nodes);

    // Step 2: Create a new Dagre graph
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

    // Step 3: Filter top-level nodes (no parentId)
    const topLevelNodes = updatedNodes.filter(node => !node.parentId);
    console.log("[applyDagreLayout | Dagre] Top-level nodes for layout:", topLevelNodes);

    // Step 4: Add top-level nodes to the graph
    topLevelNodes.forEach(node => {
        const { width, height } = getNodeDimensions(node, updatedNodes);
        // console.log(`[applyDagreLayout | Dagre] Setting dimensions for top-level node ${node.id} (${node.type}): ${width}x${height}`);
        dagreGraph.setNode(node.id, { width, height });
    });

    // Step 5: Add edges between top-level nodes
    edges.forEach(edge => {
        const sourceNode = updatedNodes.find(n => n.id === edge.source);
        const targetNode = updatedNodes.find(n => n.id === edge.target);

        if (sourceNode && targetNode && !sourceNode.parentId && !targetNode.parentId) {
            dagreGraph.setEdge(edge.source, edge.target, {
                minlen: config.minlen,
                weight: config.weight,
                width: config.width,
                height: config.height,
                labelpos: config.labelpos,
                labeloffset: config.labeloffset,
            });
        }
    });

    // console.log("[applyDagreLayout | Dagre] Added edges to Dagre graph");

    // Step 6: Run the layout algorithm
    dagre.layout(dagreGraph);

    // Step 7: Apply the calculated layout to the top-level nodes
    const layoutedNodes = updatedNodes.map(node => {
        if (!node.parentId) {
            const dagreNode = dagreGraph.node(node.id);

            if (dagreNode) {
                // console.log(`[applyDagreLayout | Dagre] Node ${node.id} positioned at:`, dagreNode.x, dagreNode.y);
                return {
                    ...node,
                    position: {
                        x: dagreNode.x - dagreNode.width / 2,
                        y: dagreNode.y - dagreNode.height / 2
                    }
                };
            }
        }

        // Keep position for other nodes
        return node;
    });

    console.log("[applyDagreLayout | Dagre] layoutedNodes:", layoutedNodes);

    // Step 8: Update Side Product Compound Nodes
    const finalNodes = layoutedNodes.map(node => {
        if (node.type === 'sideProductCompoundNode') {
            const { width, height } = getSideProductCompoundDimensions(node, layoutedNodes);
            // console.log(`[applyDagreLayout | Dagre] Updating dimensions for Side Product Compound Node ${node.id}: ${width}x${height}`);
            return {
                ...node,
                measured: { width, height },
            };
        }

        if (node.type === 'outflowsCompoundNode') {
            const { width, height } = getOutflowsCompoundDimensions(node, layoutedNodes);
            // console.log(`[applyDagreLayout | Dagre] Updating dimensions for Outflows Compound Node ${node.id}: ${width}x${height}`);
            return {
                ...node,
                measured: { width, height },
            };
        }

        return node;
    });

    return {
        layoutedNodes: finalNodes,
        layoutedEdges: edges, // Return edges unchanged
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
            // console.log(`[getNodeDimensions | Side Product Compound Node] Calculating dimensions for node ${node.id}`);
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

    // Use the adjusted column logic
    const childCount = children.length;
    const columns = childCount < 3 ? childCount : childCount <= 6 ? 3 : 4; // Adjusted column logic
    const rows = Math.ceil(childCount / columns); // Calculate the number of rows needed

    // Use consistent size for side product nodes
    const childWidth = 218; // Expected width for side product nodes
    const childHeight = 115; // Expected height for side product nodes

    // Add padding between nodes and on the edges
    const padding = 15;

    // Calculate total dimensions
    const width = (childWidth * columns) + (padding * (columns + 1));
    const height = (childHeight * rows) + (padding * (rows + 1));

    // console.log(`[getSideProductCompoundDimensions] Compound ${compoundNode.id} with ${children.length} children: ${width}x${height}, grid: ${columns}x${rows}`);

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

    // Find the Product Node and Side Product Compound Node (SPCN)
    const productNode = children.find(node => node.type === 'productNode');
    const spcn = children.find(node => node.type === 'sideProductCompoundNode');

    // Calculate dimensions for the Product Node
    const productDimensions = productNode
        ? getNodeDimensions(productNode, allNodes)
        : { width: 0, height: 0 };

    // Calculate dimensions for the SPCN (if present)
    const spcnDimensions = spcn
        ? getSideProductCompoundDimensions(spcn, allNodes)
        : { width: 0, height: 0 };

    // Add padding between children and around the edges
    const padding = 20;

    // Calculate total width (Product Node + SPCN + padding)
    const width = productDimensions.width + spcnDimensions.width + (spcn ? padding : 0) + padding * 2;

    // Calculate total height (max of Product Node and SPCN heights + padding)
    const height = Math.max(productDimensions.height, spcnDimensions.height) + padding * 2;

    // console.log(`[getOutflowsCompoundDimensions] Compound ${compoundNode.id} with children: Product Node (${productDimensions.width}x${productDimensions.height}), SPCN (${spcnDimensions.width}x${spcnDimensions.height}): ${width}x${height}`);

    return { width, height };
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

            // console.log(`[positionSideProductNodes] Positioning node ${node.id} at (${x}, ${y}) in compound ${compoundNode.id}`);

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

        // console.log(`[positionOutflowsNodes] Calculated position for node ${node.id} at (${currentX}, ${y}) in compound ${compoundNode.id}`);
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
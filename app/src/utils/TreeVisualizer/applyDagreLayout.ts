// utils/TreeVisualizer/applyDagreLayout.ts

import { DagreConfig } from '@/hooks/useDagreConfig';
import { Node, Edge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { getNodeHeight, getNodeWidth } from './nodeHelpers';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    // console.log("[applyDagreLayout | Dagre] Applying layout with config:", config);
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
    // console.log("[applyDagreLayout | Dagre] Dagre graph settings:", dagreGraph.graph());

    // Get top-level nodes (no parentId)
    const topLevelNodes = nodes.filter(node => !node.parentId);
    // console.log("[applyDagreLayout | Dagre] Top level nodes for layout:", topLevelNodes);

    // Add nodes to the graph with appropriate dimensions
    topLevelNodes.forEach(node => {
        // Set node dimensions based on type
        const width = getNodeWidth(node, nodes as InfluenceNode[]);
        const height = getNodeHeight(node, nodes as InfluenceNode[]);

        dagreGraph.setNode(node.id, { width, height });
    });

    // Add all edges to the graph
    edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target, {
            minlen: config.minlen,
            weight: config.weight,
            width: config.width,
            height: config.height,
            labelpos: config.labelpos,
            labeloffset: config.labeloffset,
        });
    });

    // Run the layout algorithm
    dagre.layout(dagreGraph);

    // Find compound nodes
    const outflowsCompoundNodes = nodes.filter(node =>
        node.type === 'outflowsCompoundNode'
    );

    const sideProductCompoundNodes = nodes.filter(node =>
        node.type === 'sideProductCompoundNode'
    );

    // Apply the calculated layout to the nodes
    const layoutedNodes = nodes.map(node => {
        // Position top-level nodes according to dagre
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

        // Keep position for child nodes
        return node;
    });

    // Apply grid layouts to compound node children
    let layoutedNodesWithGridChildren = positionOutflowsCompoundChildren(layoutedNodes, outflowsCompoundNodes);
    layoutedNodesWithGridChildren = positionSideProductCompoundChildren(layoutedNodesWithGridChildren, sideProductCompoundNodes);

    return {
        layoutedNodes: layoutedNodesWithGridChildren,
        layoutedEdges: edges // Return edges unchanged
    };
}

/**
 * Positions children of outflows compound nodes in a grid layout
 * @param nodes All nodes with top-level nodes already positioned
 * @param outflowsCompoundNodes List of outflows compound nodes
 * @returns Nodes with outflows compound children positioned in a grid
 */
function positionOutflowsCompoundChildren(nodes: Node[], outflowsCompoundNodes: Node[]): Node[] {
    return nodes.map(node => {
        // Skip nodes that are not children of outflows compound nodes
        if (!node.parentId) return node;

        // Check if this node is a child of an outflows compound node
        const parentNode = outflowsCompoundNodes.find(compoundNode =>
            compoundNode.id === node.parentId
        );

        if (!parentNode) return node;

        // Find all children of this parent, including this node
        const siblings = nodes.filter(n => n.parentId === parentNode.id);

        // If there's only one child, center it within the parent
        if (siblings.length === 1) {
            const childWidth = node.measured?.width || 300;
            const childHeight = node.measured?.height || 200;
            const parentWidth = parentNode.measured?.width || 600;
            const parentHeight = parentNode.measured?.height || 400;

            return {
                ...node,
                position: {
                    x: (parentWidth - childWidth) / 2,
                    y: (parentHeight - childHeight) / 2
                }
            };
        }

        // If there are two children, arrange them in a 2-column grid
        if (siblings.length === 2) {
            const childWidth = node.measured?.width || 300;
            const childHeight = node.measured?.height || 200;
            const parentWidth = parentNode.measured?.width || 600;
            const parentHeight = parentNode.measured?.height || 400;

            // Calculate the column index for this node (0 or 1)
            const columnIndex = siblings.indexOf(node);

            // Position in a 2-column, 1-row grid with padding
            const padding = 20;
            const columnWidth = (parentWidth - (padding * 3)) / 2; // Divide available space by 2
            const x = padding + (columnIndex * (columnWidth + padding));
            const y = (parentHeight - childHeight) / 2; // Center vertically

            return {
                ...node,
                position: { x, y }
            };
        }

        // For more than 2 children (unlikely but handled for completeness)
        if (siblings.length > 2) {
            const childWidth = node.measured?.width || 300;
            const childHeight = node.measured?.height || 200;
            const parentWidth = parentNode.measured?.width || 600;
            const parentHeight = parentNode.measured?.height || 400;

            const columns = Math.min(siblings.length, 2); // Max 2 columns
            const rows = Math.ceil(siblings.length / columns);

            // Calculate indices
            const index = siblings.indexOf(node);
            const row = Math.floor(index / columns);
            const col = index % columns;

            // Position in the grid with padding
            const padding = 20;
            const columnWidth = (parentWidth - (padding * (columns + 1))) / columns;
            const rowHeight = (parentHeight - (padding * (rows + 1))) / rows;

            const x = padding + (col * (columnWidth + padding));
            const y = padding + (row * (rowHeight + padding));

            return {
                ...node,
                position: { x, y }
            };
        }

        return node;
    });
}

/**
 * Positions children of side product compound nodes in a grid layout
 * with 3 columns for 6 or fewer children, 4 columns for 7 or more
 * @param nodes All nodes after outflows compound children positioning
 * @param sideProductCompoundNodes List of side product compound nodes
 * @returns Nodes with side product compound children positioned in a grid
 */
function positionSideProductCompoundChildren(nodes: Node[], sideProductCompoundNodes: Node[]): Node[] {
    return nodes.map(node => {
        // Skip nodes that are not children of side product compound nodes
        if (!node.parentId) return node;

        // Check if this node is a child of a side product compound node
        const parentNode = sideProductCompoundNodes.find(compoundNode =>
            compoundNode.id === node.parentId
        );

        if (!parentNode) return node;

        // Find all children of this parent, including this node
        const siblings = nodes.filter(n => n.parentId === parentNode.id);

        // If there's only one child, center it within the parent
        if (siblings.length === 1) {
            const childWidth = node.measured?.width || 200;
            const childHeight = node.measured?.height || 100;
            const parentWidth = parentNode.measured?.width || 400;
            const parentHeight = parentNode.measured?.height || 300;

            return {
                ...node,
                position: {
                    x: (parentWidth - childWidth) / 2,
                    y: (parentHeight - childHeight) / 2
                }
            };
        }

        // For multiple children, arrange in a grid
        const childWidth = node.measured?.width || 200;
        const childHeight = node.measured?.height || 100;
        const parentWidth = parentNode.measured?.width || 600;
        const parentHeight = parentNode.measured?.height || 400;

        // Determine number of columns based on child count
        // 3 columns for 6 or fewer children, 4 columns for 7 or more
        const columns = siblings.length <= 6 ? 3 : 4;
        const rows = Math.ceil(siblings.length / columns);

        // Calculate indices
        const index = siblings.indexOf(node);
        const row = Math.floor(index / columns);
        const col = index % columns;

        // Position in the grid with padding
        const padding = 15; // Slightly smaller padding for side products
        const columnWidth = (parentWidth - (padding * (columns + 1))) / columns;
        const rowHeight = (parentHeight - (padding * (rows + 1))) / rows;

        const x = padding + (col * (columnWidth + padding));
        const y = padding + (row * (rowHeight + padding));

        return {
            ...node,
            position: { x, y }
        };
    });
}

export default applyDagreLayout;
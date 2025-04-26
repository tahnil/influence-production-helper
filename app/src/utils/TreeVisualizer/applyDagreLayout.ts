// utils/TreeVisualizer/applyDagreLayout.ts
import { DagreConfig } from '@/hooks/useDagreConfig';
import { Node, Edge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { InfluenceNode } from '@/types/reactFlowTypes';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    console.log("[applyDagreLayout | Dagre] Applying layout with config:", config);
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
    const topLevelNodes = nodes.filter(node => !node.parentId);
    console.log("[applyDagreLayout | Dagre] Top level nodes for layout:", topLevelNodes);

    // Add nodes to the graph with appropriate dimensions
    topLevelNodes.forEach(node => {
        // Set node dimensions based on type
        const width = getNodeWidth(node, nodes as InfluenceNode[]);
        console.log("[applyDagreLayout | Dagre] Final node width:", width);
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

    // Apply the calculated layout to the nodes
    const layoutedNodes = nodes.map(node => {
        // Only reposition top-level nodes
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

// Helper function to get node width based on type
function getNodeWidth(node: Node, nodes: InfluenceNode[]): number {
    switch (node.type) {
        case 'outflowsCompoundNode':
            console.log(`[applyDagreLayout | Dagre] Outflows Compound Node: width = `, node.measured?.width, ` height = `, node.measured?.height);
            // We want to determine the compound width of the node based on the sum of its children's widths
            // Get all children of this node
            const outflowsCompoundChildren = nodes.filter(child => child.parentId === node.id);
            const outflowsCompoundTotalWidth = outflowsCompoundChildren.reduce((acc, child) => {
                const childWidth = getNodeWidth(child, nodes);
                return acc + childWidth;
            }, 0);
            console.log(`[applyDagreLayout | Dagre] Total width for children of outflows node ${node.id}:`, outflowsCompoundTotalWidth);

        case 'sideProductCompoundNode':
            console.log(`[applyDagreLayout | Dagre] Side Products Compound Node: width = `, node.measured?.width, ` height = `, node.measured?.height);
            const sideProductCompoundChildren = nodes.filter(child => child.parentId === node.id);
            const sideProductCompoundTotalWidth = sideProductCompoundChildren.reduce((acc, child) => {
                const childWidth = getNodeWidth(child, nodes);
                return acc + childWidth;
            }, 0);
            console.log(`[applyDagreLayout | Dagre] Total width for children of side products node ${node.id}:`, sideProductCompoundTotalWidth);

        case 'processNode':
            return 250;
        case 'productNode':
            return 300;
        case 'sideProductNode':
            return 200;
        default:
            return 150;
    }
}

// Helper function to get node height based on type
function getNodeHeight(node: Node, nodes: InfluenceNode[]): number {
    switch (node.type) {
        case 'outflowsCompoundNode':
            // Analogous to width, we want to determine the compound height of the node based on the sum of its children's heights
            const outflowsCompoundChildren = nodes.filter(child => child.parentId === node.id);
            const outflowsCompoundTotalHeight = outflowsCompoundChildren.reduce((acc, child) => {
                const childHeight = getNodeHeight(child, nodes);
                return acc + childHeight;
            }, 0);
            console.log(`[applyDagreLayout | Dagre] Total height for children of outflows node ${node.id}:`, outflowsCompoundTotalHeight);
        case 'sideProductCompoundNode':
            // Analogous to width, we want to determine the compound height of the node based on the sum of its children's heights
            const sideProductCompoundChildren = nodes.filter(child => child.parentId === node.id);
            const sideProductCompoundTotalHeight = sideProductCompoundChildren.reduce((acc, child) => {
                const childHeight = getNodeHeight(child, nodes);
                return acc + childHeight;
            }, 0);
            console.log(`[applyDagreLayout | Dagre] Total height for children of side products node ${node.id}:`, sideProductCompoundTotalHeight);
        case 'processNode':
            return 185;
        case 'productNode':
            return 290;
        case 'sideProductNode':
            return 100;
        default:
            return 80;
    }
}

export default applyDagreLayout;
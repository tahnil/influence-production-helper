// utils/TreeVisualizer/applyDagreLayout.ts
import { DagreConfig } from '@/hooks/useDagreConfig';
import { Node, Edge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { getCompoundNodeHeight, getCompoundNodeWidth, getNodeHeight, getNodeWidth } from './nodeHelpers';

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
        console.log("[applyDagreLayout | Dagre] Final node height:", height);

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

export default applyDagreLayout;
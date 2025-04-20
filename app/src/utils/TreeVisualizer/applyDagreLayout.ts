import { DagreConfig } from '@/hooks/useDagreConfig';
import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    // Create a new dagre graph instance
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Set graph direction and other configurations
    dagreGraph.setGraph({
        rankdir: config.rankdir, // 'TB' (top to bottom) for your outflow->inflow hierarchy
        nodesep: config.nodesep,
        ranksep: config.ranksep,
        edgesep: config.edgesep,
        marginx: config.marginx,
        marginy: config.marginy,
        align: config.align,
        acyclicer: config.acyclicer !== 'undefined' ? config.acyclicer : undefined,
        ranker: config.ranker,
    });

    // Add nodes to the graph
    nodes.forEach(node => {
        // Use node width/height from measurement or provide defaults based on node type
        const width = node.measured?.width ||
            (node.type === 'processNode' ? 250 :
                node.type === 'sideProductNode' ? 200 : 300);

        const height = node.measured?.height ||
            (node.type === 'processNode' ? 120 :
                node.type === 'sideProductNode' ? 100 : 150);

        dagreGraph.setNode(node.id, { width, height });
    });

    // Add edges to the graph
    edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Run the dagre layout algorithm
    dagre.layout(dagreGraph);

    // Apply the calculated layout to the nodes
    const layoutedNodes = nodes.map(node => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Apply position if node was found in the dagre graph
        if (nodeWithPosition) {
            return {
                ...node,
                // Offset the position by half the width/height to center node at position
                position: {
                    x: nodeWithPosition.x - nodeWithPosition.width / 2,
                    y: nodeWithPosition.y - nodeWithPosition.height / 2
                }
            };
        }
        // Return node with original position if not found
        return node;
    });

    return {
        layoutedNodes,
        layoutedEdges: edges
    };
}

export default applyDagreLayout;
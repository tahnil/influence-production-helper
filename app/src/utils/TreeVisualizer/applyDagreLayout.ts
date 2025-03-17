import { DagreConfig } from '@/hooks/useDagreConfig';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from '@xyflow/react';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig): { layoutedNodes: Node[]; layoutedEdges: Edge[] } {

    const nodeFallbackWidth = 200;
    const nodeFallbackHeight = 100;

    const allNodesHaveDimensions = nodes.every(node => node.measured?.width && node.measured?.height);

    if (!allNodesHaveDimensions) {
        console.warn("Not all nodes have dimensions. Delaying Dagre layout.");
        return { layoutedNodes: nodes, layoutedEdges: edges };
    }

    const dagreGraph = new Dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: config.rankdir,
        align: config.align,
        nodesep: config.nodesep,
        edgesep: config.edgesep,
        ranksep: config.ranksep,
        marginx: config.marginx,
        marginy: config.marginy,
        acyclicer: config.acyclicer,
        ranker: config.ranker,
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: node.measured?.width || nodeFallbackWidth, height: node.measured?.height || nodeFallbackHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    Dagre.layout(dagreGraph);

    // Map the positions from Dagre back to React Flow nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        let relativeX = nodeWithPosition.x - (node.measured?.width || nodeFallbackWidth) / 2;
        let relativeY = nodeWithPosition.y - (node.measured?.height || nodeFallbackHeight) / 2;

        if (node.parentId) {
            const parentNode = dagreGraph.node(node.parentId);
            if (parentNode) {
                relativeX = nodeWithPosition.x - parentNode.x + (parentNode.width - (node.measured?.width || nodeFallbackWidth)) / 2;
                relativeY = nodeWithPosition.y - parentNode.y + (parentNode.height - (node.measured?.height || nodeFallbackHeight)) / 2;
            }
        }

        return {
            ...node,
            position: {
                x: relativeX,
                y: relativeY,
            },
            targetPosition: config.rankdir === 'LR' ? Position.Left : Position.Top,
            sourcePosition: config.rankdir === 'LR' ? Position.Right : Position.Bottom,
        };
    });

    const layoutedEdges = edges.map((edge) => ({
        ...edge,
        type: 'custom',
    }));

    return { layoutedNodes, layoutedEdges };
}

export default applyDagreLayout;

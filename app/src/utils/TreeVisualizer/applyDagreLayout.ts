import { DagreConfig } from '@/hooks/useDagreConfig';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from '@xyflow/react';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    const nodeFallbackWidth = 200;
    const nodeFallbackHeight = 100;

    // Use measurements if available, otherwise use fallback dimensions
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
        dagreGraph.setNode(node.id, {
            width: node.measured?.width || nodeFallbackWidth,
            height: node.measured?.height || nodeFallbackHeight
        });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    Dagre.layout(dagreGraph);

    // Map the positions from Dagre back to React Flow nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Skip nodes that dagre couldn't position
        if (!nodeWithPosition) {
            console.warn(`No position calculated for node ${node.id}`);
            return node;
        }

        // Determine handle positions based on rankdir
        let sourcePosition = Position.Bottom;
        let targetPosition = Position.Top;

        if (config.rankdir === 'LR') {
            sourcePosition = Position.Right;
            targetPosition = Position.Left;
        } else if (config.rankdir === 'RL') {
            sourcePosition = Position.Left;
            targetPosition = Position.Right;
        } else if (config.rankdir === 'BT') {
            sourcePosition = Position.Top;
            targetPosition = Position.Bottom;
        }

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - (nodeWithPosition.width / 2),
                y: nodeWithPosition.y - (nodeWithPosition.height / 2),
            },
            sourcePosition,
            targetPosition
        };
    });

    const layoutedEdges = edges.map((edge) => ({
        ...edge,
        type: 'custom',
    }));

    return { layoutedNodes, layoutedEdges };
}

export default applyDagreLayout;

import { DagreConfig } from '@/types/dagreTypes';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from '@xyflow/react';

function useDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    const dagreGraph = new Dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = config.rankdir === 'LR';
    const nodeWidth = 172;
    const nodeHeight = 66;

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
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    Dagre.layout(dagreGraph);

    // Map the positions from Dagre back to React Flow nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Calculate relative position if the node has a parent
        let relativeX = nodeWithPosition.x - nodeWidth / 2;
        let relativeY = nodeWithPosition.y - nodeHeight / 2;

        if (node.parentId) {
            const parentNode = dagreGraph.node(node.parentId);
            if (parentNode) {
                relativeX -= parentNode.x - nodeWidth / 2;
                relativeY -= parentNode.y - nodeHeight / 2;
            }
        }

        return {
            ...node,
            position: {
                x: relativeX,
                y: relativeY,
            },
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        };
    });

    return { nodes: layoutedNodes, edges };
};

export default useDagreLayout;
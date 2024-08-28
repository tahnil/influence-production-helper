import { useEffect } from 'react';
import Dagre from '@dagrejs/dagre';
import { useReactFlow, useNodesInitialized, Node, Edge } from '@xyflow/react';

function useDagreLayout(dagreConfig, nodes: Node[], edges: Edge[], setNodes, setEdges) {
    const nodesInitialized = useNodesInitialized();

    const getLayoutedElements = (nodes: Node[], edges: Edge[], config) => {
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

        const layoutedNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);

            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - nodeWidth / 2,
                    y: nodeWithPosition.y - nodeHeight / 2,
                },
                targetPosition: isHorizontal ? 'left' : 'top',
                sourcePosition: isHorizontal ? 'right' : 'bottom',
            };
        });

        return { nodes: layoutedNodes, edges };
    };

    useEffect(() => {
        if (nodesInitialized) {
            const layouted = getLayoutedElements(nodes, edges, dagreConfig);
            setNodes(layouted.nodes);
            setEdges(layouted.edges);
        }
    }, [nodesInitialized, nodes, edges, dagreConfig, setNodes, setEdges]);
}

export default useDagreLayout;
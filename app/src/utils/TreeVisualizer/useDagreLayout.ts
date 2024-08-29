import { DagreConfig } from '@/types/dagreTypes';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from '@xyflow/react';

function useDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    const dagreGraph = new Dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeFallbackWidth = 200;
    const nodeFallbackHeight = 100;

    const allNodesHaveDimensions = nodes.every(node => node.measured?.width && node.measured?.height);

    if (!allNodesHaveDimensions) {
        console.warn("Not all nodes have dimensions. Delaying Dagre layout.");
        return { nodes, edges };
    } else {
        console.log("All nodes have dimensions. Proceeding with Dagre layout.");
    }

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
                // Adjust the child’s position relative to the parent’s top-left corner
                // centerOfNodeWithPosition ==> (nodeWithPosition.x + nodeWithPosition.width / 2)
                // centerOfParentNode ==> (parentNode.x + parentNode.width / 2)

                // (parentNode.measured.width - node.measured.width) / 2

                relativeX = nodeWithPosition.x - parentNode.x + (parentNode.width - (node.measured?.width || nodeFallbackWidth)) / 2;
                console.log(`Calculation as formula: ${nodeWithPosition.x} - ${parentNode.x} - (${parentNode.width} - (${node.measured?.width} || ${nodeFallbackWidth}) / 2 = ${relativeX}`);
                relativeY = nodeWithPosition.y - parentNode.y + (parentNode.height - (node.measured?.height || nodeFallbackHeight)) / 2;

                console.log('Adjusted relativeX:', relativeX);
                console.log('Adjusted relativeY:', relativeY);
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

    return { nodes: layoutedNodes, edges };
}

export default useDagreLayout;

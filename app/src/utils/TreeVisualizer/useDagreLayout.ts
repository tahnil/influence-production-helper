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
        const nodeWidth = node.measured?.width || nodeFallbackWidth;
        const nodeHeight = node.measured?.height || nodeFallbackHeight;

        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    Dagre.layout(dagreGraph);

    // Map the positions from Dagre back to React Flow nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        console.log(`node:`,node,`\nnodeWithPosition`,nodeWithPosition);

        // Start with absolute positioning
        let relativeX = nodeWithPosition.x - (node.measured?.width || nodeFallbackWidth) / 2;
        let relativeY = nodeWithPosition.y - (node.measured?.height || nodeFallbackHeight) / 2;

        if (node.parentId) {
            const parentNode = dagreGraph.node(node.parentId);
            if (parentNode) {
                // Adjust the child's position relative to the parent's center
                relativeX = (nodeWithPosition.x - nodeWithPosition.x) + (parentNode.width || nodeFallbackWidth) / 2 - (node.measured?.width || nodeFallbackWidth) / 2;
                console.log('Adjusted relativeX:', nodeWithPosition.x ,'-', parentNode.x ,') + (', parentNode.width ,'||', nodeFallbackWidth ,') / 2 - (',node.measured?.width, '||', nodeFallbackWidth ,') / 2');
                relativeY = (nodeWithPosition.y - nodeWithPosition.y) + (parentNode.height || nodeFallbackHeight);
                console.log('Adjusted relativeY:', nodeWithPosition.y ,'-', nodeWithPosition.y ,' + ', parentNode.height ,'||', nodeFallbackHeight);
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

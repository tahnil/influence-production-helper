import { DagreConfig } from '@/hooks/useDagreConfig';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from '@xyflow/react';

// Define a type for the side product node data
interface SideProductNodeData {
    ancestorIds?: string[];
    [key: string]: any;
}

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    // Configure the graph
    const dagreGraph = new Dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Use network simplex ranker explicitly
    dagreGraph.setGraph({
        ...config,
        ranker: 'network-simplex'
    });

    // Add all nodes to dagre
    nodes.forEach(node => {
        dagreGraph.setNode(node.id, {
            width: node.measured?.width || 200,
            height: node.measured?.height || 100
        });
    });

    // Add edges with special weights for side product relationships
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (sourceNode?.type === 'sideProductNode' || targetNode?.type === 'sideProductNode') {
            // Configure special properties for side product connections
            dagreGraph.setEdge(edge.source, edge.target, {
                weight: 5,       // Higher weight keeps nodes closer together
                minlen: 1        // Minimum rank separation (lower keeps them closer)
            });
        } else {
            // Regular edge
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    // Run dagre layout
    Dagre.layout(dagreGraph);

    // Apply positions, then perform post-processing for side products if needed
    const layoutedNodes = nodes.map(node => {
        const nodeWithPosition = dagreGraph.node(node.id);

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - (nodeWithPosition.width / 2),
                y: nodeWithPosition.y - (nodeWithPosition.height / 2),
            },
            // Handle positions logic here...
        };
    });

    // Find and fix any remaining side product position issues
    // This is usually minimal with the network simplex ranker
    layoutedNodes.forEach(node => {
        if (node.type === 'sideProductNode') {
            const data = node.data as SideProductNodeData;
            if (data.ancestorIds && data.ancestorIds.length > 0) {
                const processId = data.ancestorIds[0];
                const processNode = layoutedNodes.find(n => n.id === processId);

                if (processNode) {
                    // Ensure horizontal alignment if it's off by more than 10 pixels
                    if (Math.abs(node.position.y - processNode.position.y) > 10) {
                        node.position.y = processNode.position.y;
                    }
                }
            }
        }
    });

    // Final overlap check and resolution
    // This could be a simple collision detection loop

    return {
        layoutedNodes,
        layoutedEdges: edges.map(e => ({ ...e, type: 'custom' }))
    };
}

export default applyDagreLayout;
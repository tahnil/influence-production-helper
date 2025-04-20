import { DagreConfig } from '@/hooks/useDagreConfig';
import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    // Group nodes by parent
    const nodesByParent = new Map<string | null, Node[]>();

    // Initialize with null group for parent nodes
    nodesByParent.set(null, []);

    // Group nodes by their parent
    nodes.forEach(node => {
        const parentId = node.parentId || null;
        if (!nodesByParent.has(parentId)) {
            nodesByParent.set(parentId, []);
        }
        nodesByParent.get(parentId)?.push(node);
    });

    // Process parent nodes first (top-level layout)
    const parentNodes = nodesByParent.get(null) || [];
    const layoutedNodes = [...layoutNodesWithDagre(parentNodes, edges, config)];

    // Create a map of node positions for quick lookup
    const nodePositions = new Map(layoutedNodes.map(node => [node.id, node.position]));

    // Now process each compound node's children
    nodes.forEach(node => {
        if (node.type === 'compoundNode') {
            const childNodes = nodesByParent.get(node.id) || [];
            if (childNodes.length === 0) return;

            // Layout children with Dagre
            const childLayout = layoutNodesWithDagre(childNodes, edges, {
                ...config,
                rankdir: 'TB', // Use consistent direction for children
                marginx: 20,
                marginy: 20
            });

            // Find bounds of the laid out children
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;

            childLayout.forEach(childNode => {
                const width = childNode.measured?.width ||
                    (childNode.type === 'processNode' ? 250 :
                        childNode.type === 'sideProductNode' ? 200 : 150);

                const height = childNode.measured?.height ||
                    (childNode.type === 'processNode' ? 120 :
                        childNode.type === 'sideProductNode' ? 100 : 100);

                minX = Math.min(minX, childNode.position.x);
                minY = Math.min(minY, childNode.position.y);
                maxX = Math.max(maxX, childNode.position.x + width);
                maxY = Math.max(maxY, childNode.position.y + height);
            });

            // Add padding
            const padding = 30;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;

            // Calculate compound node dimensions
            const compoundWidth = maxX - minX;
            const compoundHeight = maxY - minY;

            // Update compound node with calculated dimensions
            const compoundNodeIndex = layoutedNodes.findIndex(n => n.id === node.id);
            if (compoundNodeIndex !== -1) {
                layoutedNodes[compoundNodeIndex] = {
                    ...layoutedNodes[compoundNodeIndex],
                    data: {
                        ...layoutedNodes[compoundNodeIndex].data,
                        width: compoundWidth,
                        height: compoundHeight
                    }
                };
            }

            // Fix child positions to be relative to compound node
            childLayout.forEach(childNode => {
                // Get absolute position (child positions from Dagre are absolute)
                const absoluteX = childNode.position.x;
                const absoluteY = childNode.position.y;

                // Calculate relative position within compound node
                const relativeX = absoluteX - minX - padding;
                const relativeY = absoluteY - minY - padding;

                // Add to layouted nodes with relative position
                layoutedNodes.push({
                    ...childNode,
                    position: { x: relativeX, y: relativeY }
                });
            });
        }
    });

    return {
        layoutedNodes,
        layoutedEdges: edges
    };
}

// Helper function to layout a group of nodes using Dagre
function layoutNodesWithDagre(nodes: Node[], allEdges: Edge[], config: DagreConfig): Node[] {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: config.rankdir,
        nodesep: config.nodesep,
        ranksep: config.ranksep,
        edgesep: config.edgesep,
        marginx: config.marginx,
        marginy: config.marginy,
        align: config.align,
        acyclicer: config.acyclicer !== 'undefined' ? config.acyclicer : undefined,
        ranker: config.ranker,
    });

    // Add nodes to dagre
    nodes.forEach(node => {
        const width = node.measured?.width ||
            (node.type === 'processNode' ? 250 :
                node.type === 'sideProductNode' ? 200 :
                    node.type === 'compoundNode' ? 400 : 300);

        const height = node.measured?.height ||
            (node.type === 'processNode' ? 120 :
                node.type === 'sideProductNode' ? 100 :
                    node.type === 'compoundNode' ? 300 : 150);

        dagreGraph.setNode(node.id, { width, height });
    });

    // Filter relevant edges for these nodes
    const nodeIds = new Set(nodes.map(node => node.id));
    const relevantEdges = allEdges.filter(
        edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    // Add edges to dagre
    relevantEdges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Run layout
    dagre.layout(dagreGraph);

    // Apply the calculated layout to the nodes
    return nodes.map(node => {
        const dagreNode = dagreGraph.node(node.id);

        if (dagreNode) {
            return {
                ...node,
                position: {
                    x: dagreNode.x - dagreNode.width / 2,
                    y: dagreNode.y - dagreNode.height / 2
                }
            };
        }

        return node;
    });
}

export default applyDagreLayout;
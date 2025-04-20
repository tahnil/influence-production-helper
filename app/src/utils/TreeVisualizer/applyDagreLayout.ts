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

    // New edges to be created (including side product edges)
    const layoutedEdges = [...edges];

    // Now process each compound node's children
    nodes.forEach(node => {
        if (node.type === 'compoundNode') {
            const childNodes = nodesByParent.get(node.id) || [];
            if (childNodes.length === 0) return;

            // Separate process nodes and side product nodes
            const processNodes = childNodes.filter(child => child.type === 'processNode');
            const sideProductNodes = childNodes.filter(child => child.type === 'sideProductNode');
            const otherNodes = childNodes.filter(child =>
                child.type !== 'processNode' && child.type !== 'sideProductNode'
            );

            // Position process node in the center-left of the compound
            if (processNodes.length > 0) {
                const processNode = processNodes[0]; // Assuming one process node per compound

                // Get process node dimensions
                const processWidth = processNode.measured?.width || 250;
                const processHeight = processNode.measured?.height || 120;

                // Position the process node (center-left position)
                const processPos = { x: 30, y: 30 };

                // Add the process node to layouted nodes
                layoutedNodes.push({
                    ...processNode,
                    position: processPos
                });

                // Layout side products to the right of the process node
                if (sideProductNodes.length > 0) {
                    const spacing = 20; // Space between side products
                    const sideProductWidth = sideProductNodes[0].measured?.width || 200;
                    const sideProductHeight = sideProductNodes[0].measured?.height || 100;

                    // Calculate compound node width based on process and side products
                    const compoundWidth = processPos.x + processWidth + 20 +
                        (sideProductNodes.length * (sideProductWidth + spacing));

                    // Calculate compound node height to fit the tallest element plus padding
                    const compoundHeight = Math.max(
                        processPos.y + processHeight + 30,
                        60 + sideProductHeight + 30
                    );

                    // Position side product nodes horizontally to the right of the process node
                    sideProductNodes.forEach((sideProductNode, index) => {
                        const sideProductPos = {
                            x: processPos.x + processWidth + 20 + (index * (sideProductWidth + spacing)),
                            y: 60 // Align vertically to look good with the process node
                        };

                        layoutedNodes.push({
                            ...sideProductNode,
                            position: sideProductPos
                        });

                        // Create an edge from process node to side product node
                        const edgeId = `edge-${sideProductNode.id}-${processNode.id}`;

                        // Check if edge already exists
                        const edgeExists = layoutedEdges.some(edge =>
                            edge.id === edgeId ||
                            (edge.source === processNode.id && edge.target === sideProductNode.id)
                        );

                        if (!edgeExists) {
                            layoutedEdges.push({
                                id: edgeId,
                                source: processNode.id,
                                target: sideProductNode.id,
                                sourceHandle: `target-side-product-${processNode.id}`, // Right handle of process node
                                targetHandle: `source-${sideProductNode.id}`, // Left handle of side product node
                                type: 'custom',
                                data: { isSideProductConnection: true }
                            });
                        }
                    });

                    // Update compound node dimensions
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
                } else {
                    // If no side products, size the compound to fit just the process node
                    const compoundNodeIndex = layoutedNodes.findIndex(n => n.id === node.id);
                    if (compoundNodeIndex !== -1) {
                        layoutedNodes[compoundNodeIndex] = {
                            ...layoutedNodes[compoundNodeIndex],
                            data: {
                                ...layoutedNodes[compoundNodeIndex].data,
                                width: processPos.x + processWidth + 30,
                                height: processPos.y + processHeight + 30
                            }
                        };
                    }
                }
            }

            // Add other child nodes if there are any
            otherNodes.forEach(otherNode => {
                layoutedNodes.push({
                    ...otherNode,
                    position: { x: 20, y: 20 } // Default position for other nodes
                });
            });
        }
    });

    return {
        layoutedNodes,
        layoutedEdges
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
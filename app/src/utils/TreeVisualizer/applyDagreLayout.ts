import { DagreConfig } from '@/hooks/useDagreConfig';
import Dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    const nodeFallbackWidth = 200;
    const nodeFallbackHeight = 100;

    // Separate side product nodes from main nodes
    const sideProductNodes = nodes.filter(node => node.type === 'sideProductNode');
    const mainNodes = nodes.filter(node => node.type !== 'sideProductNode');

    // Find process nodes that are parents of side products for later use
    const processNodesWithSideProducts = new Set(
        sideProductNodes
            .map(node => nodes.find(n => Array.isArray(n.data?.outflowIds) && n.data.outflowIds.includes(node.id)))
            .filter(Boolean)
            .map(node => node?.id)
    );

    // Create a new dagre graph for main layout
    const dagreGraph = new Dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Set graph properties
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

    // Add main nodes to dagre
    mainNodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: node.measured?.width || nodeFallbackWidth,
            height: node.measured?.height || nodeFallbackHeight
        });
    });

    // Add edges between main nodes to dagre
    edges.forEach((edge) => {
        // Only include edges between main nodes
        if (mainNodes.some(n => n.id === edge.source) &&
            mainNodes.some(n => n.id === edge.target)) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    // Run the dagre layout algorithm
    Dagre.layout(dagreGraph);

    // Apply positions to main nodes
    let layoutedNodes = mainNodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const width = node.measured?.width || nodeFallbackWidth;
        const height = node.measured?.height || nodeFallbackHeight;

        let relativeX = nodeWithPosition.x - width / 2;
        let relativeY = nodeWithPosition.y - height / 2;

        if (node.parentId) {
            const parentNode = dagreGraph.node(node.parentId);
            if (parentNode) {
                const parentWidth = nodes.find(n => n.id === node.parentId)?.measured?.width || nodeFallbackWidth;
                const parentHeight = nodes.find(n => n.id === node.parentId)?.measured?.height || nodeFallbackHeight;

                relativeX = nodeWithPosition.x - parentNode.x + (parentWidth - width) / 2;
                relativeY = nodeWithPosition.y - parentNode.y + (parentHeight - height) / 2;
            }
        }

        return {
            ...node,
            position: {
                x: relativeX,
                y: relativeY,
            }
        };
    });

    // After Dagre layout, adjust side product positions
    layoutedNodes = layoutedNodes.map(node => {
        if (node.type === 'sideProductNode') {
            // Find connected process node (which should be the source now)
            const processEdge = edges.find(edge => edge.target === node.id);
            if (processEdge) {
                const processNode = layoutedNodes.find(n => n.id === processEdge.source);
                if (processNode) {
                    // Position side product at same horizontal level as process
                    return {
                        ...node,
                        position: {
                            x: node.position.x,
                            y: processNode.position.y  // Align with process Y-position
                        }
                    };
                }
            }
        }
        return node;
    });

    // Process side product nodes and position them next to their process nodes
    const positionedSideProducts = sideProductNodes.map(sideProductNode => {
        // Find the process node that produces this side product
        const processNode = nodes.find(node =>
            node.type === 'processNode' &&
            Array.isArray(node.data?.outflowIds) && (node.data.outflowIds as string[]).includes(sideProductNode.id)
        );

        if (!processNode) {
            // If no process node found, place at origin
            return {
                ...sideProductNode,
                position: { x: 0, y: 0 }
            };
        }

        // Get the positioned process node
        const positionedProcess = layoutedNodes.find(node => node.id === processNode.id);
        if (!positionedProcess) {
            return {
                ...sideProductNode,
                position: { x: 0, y: 0 }
            };
        }

        // Find all side products for this process node
        const processSideProducts = sideProductNodes.filter(node =>
            (Array.isArray(processNode.data.outflowIds) && processNode.data.outflowIds.includes(node.id))
        );

        // Get index of this side product among all side products of this process
        const sideProductIndex = processSideProducts.findIndex(node => node.id === sideProductNode.id);

        // Calculate horizontal offset for each side product
        const sideProductWidth = sideProductNode.measured?.width || nodeFallbackWidth;
        const processWidth = positionedProcess.measured?.width || nodeFallbackWidth;
        const horizontalSpacing = 30; // Space between side products

        // Calculate total width of all side products + spacing
        const totalSideProductsWidth = processSideProducts.length * sideProductWidth +
            (processSideProducts.length - 1) * horizontalSpacing;

        // Starting X position
        const startX = positionedProcess.position.x + (processWidth - totalSideProductsWidth) / 2;

        // Position side product horizontally aligned with process node but to the right
        return {
            ...sideProductNode,
            position: {
                x: startX + sideProductIndex * (sideProductWidth + horizontalSpacing),
                y: positionedProcess.position.y, // Same Y as process node
            }
        };
    });

    // Combine the main and side product nodes
    const allLayoutedNodes = [...layoutedNodes, ...positionedSideProducts];

    // Update edges for the layouted graph
    const layoutedEdges = edges.map((edge) => ({
        ...edge,
        type: 'custom',
    }));

    return { layoutedNodes: allLayoutedNodes, layoutedEdges };
}

export default applyDagreLayout;
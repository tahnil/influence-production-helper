import { DagreConfig } from '@/hooks/useDagreConfig';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from '@xyflow/react';
import { InfluenceNode, SideProductNode, SideProductNodeData } from '@/types/reactFlowTypes';

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

    // First pass: Add all nodes except sideProductNodes to the Dagre graph
    const nonSideProductNodes = nodes.filter(node => node.type !== 'sideProductNode');

    nonSideProductNodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: node.measured?.width || nodeFallbackWidth,
            height: node.measured?.height || nodeFallbackHeight
        });
    });

    // Add edges between non-side-product nodes
    edges.forEach((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (sourceNode && targetNode &&
            sourceNode.type !== 'sideProductNode' &&
            targetNode.type !== 'sideProductNode') {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    // Apply Dagre layout to the main production chain
    Dagre.layout(dagreGraph);

    // Map the positions from Dagre back to React Flow nodes
    let layoutedNodes = nonSideProductNodes.map((node) => {
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
            },
            targetPosition: config.rankdir === 'LR' ? Position.Left : Position.Top,
            sourcePosition: config.rankdir === 'LR' ? Position.Right : Position.Bottom,
        };
    });

    // Group side products by their process node
    interface ProcessSideProductMap {
        [processId: string]: Node[];
    }
    const sideProductsByProcess: ProcessSideProductMap = {};

    // Find all side product nodes and group them by their ancestor process
    const sideProductNodes = nodes.filter(node => node.type === 'sideProductNode');

    sideProductNodes.forEach((node) => {
        const ancestorIds = (node.data as SideProductNodeData).ancestorIds;
        if (ancestorIds && ancestorIds.length > 0) {
            const processId = ancestorIds[0];
            sideProductsByProcess[processId] = sideProductsByProcess[processId] || [];
            sideProductsByProcess[processId].push(node);
        }
    });

    // Position each side product horizontally aligned with its process
    const sideProductLayoutedNodes: Node[] = [];

    Object.entries(sideProductsByProcess).forEach(([processId, sideProductNodes]) => {
        const processNode = layoutedNodes.find(n => n.id === processId);
        if (!processNode) return;

        // Calculate the width of all side products for this process
        const totalSideProductWidth = sideProductNodes.reduce((total, sp) => {
            const width = sp.measured?.width || nodeFallbackWidth;
            return total + width + config.nodesep;
        }, 0);

        // Starting X position for the first side product (centered around the process node)
        const processNodeWidth = processNode.measured?.width || nodeFallbackWidth;
        const startX = processNode.position.x + processNodeWidth + config.nodesep * 2;

        // Position each side product node horizontally
        let currentX = startX;
        sideProductNodes.forEach((sideProduct, index) => {
            const width = sideProduct.measured?.width || nodeFallbackWidth;

            sideProductLayoutedNodes.push({
                ...sideProduct,
                position: {
                    x: currentX,
                    y: processNode.position.y,
                },
                targetPosition: Position.Left,
                sourcePosition: Position.Right,
            });

            currentX += width + config.nodesep;
        });
    });

    // Combine all nodes
    layoutedNodes = [
        ...layoutedNodes.map(node => ({
            ...node,
            targetPosition: node.targetPosition || (config.rankdir === 'LR' ? Position.Left : Position.Top),
            sourcePosition: node.sourcePosition || (config.rankdir === 'LR' ? Position.Right : Position.Bottom),
        })),
        ...sideProductLayoutedNodes.map(node => ({
            ...node,
            targetPosition: node.targetPosition || Position.Left,
            sourcePosition: node.sourcePosition || Position.Right,
        })),
    ];

    // Create the edge layout
    const layoutedEdges = edges.map((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        // Special handling for side product connections
        if (sourceNode?.type === 'sideProductNode' || targetNode?.type === 'sideProductNode') {
            return {
                ...edge,
                type: 'custom',
                animated: true,
            };
        }

        return {
            ...edge,
            type: 'custom',
        };
    });

    return { layoutedNodes, layoutedEdges };
}

export default applyDagreLayout;

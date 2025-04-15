import { DagreConfig } from '@/hooks/useDagreConfig';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from '@xyflow/react';

// Define a type for the side product node data
interface SideProductNodeData {
  ancestorIds?: string[];
  [key: string]: any;
}

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    const nodeFallbackWidth = 200;
    const nodeFallbackHeight = 100;

    // Separate side product nodes from main nodes
    const sideProductNodes = nodes.filter(node => node.type === 'sideProductNode');
    const mainNodes = nodes.filter(node => node.type !== 'sideProductNode');

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
    const layoutedMainNodes = mainNodes.map((node) => {
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
            targetPosition: config.rankdir === 'LR' ? Position.Bottom : Position.Top,
            sourcePosition: config.rankdir === 'LR' ? Position.Top : Position.Bottom,
        };
    });

    // Build a map of process nodes to their side products using ancestorIds
    const processSideProductsMap = new Map<string, Node[]>();
    
    sideProductNodes.forEach(sideProduct => {
        // Type-safe access to ancestorIds
        const sideProductData = sideProduct.data as SideProductNodeData;
        const ancestorIds = sideProductData.ancestorIds || [];
        
        if (ancestorIds.length > 0) {
            const ancestorId = ancestorIds[0];
            if (!processSideProductsMap.has(ancestorId)) {
                processSideProductsMap.set(ancestorId, []);
            }
            processSideProductsMap.get(ancestorId)?.push(sideProduct);
        }
    });

    // Position side product nodes next to their process nodes
    const layoutedSideProducts: Node[] = [];
    
    processSideProductsMap.forEach((sideProducts, processId) => {
        // Find the positioned process node
        const processNode = layoutedMainNodes.find(node => node.id === processId);
        if (!processNode) return;
        
        // Calculate positions for all side products of this process
        const sideProductWidth = 224; // From your example data
        const horizontalSpacing = 30;
        
        sideProducts.forEach((sideProduct, index) => {
            // Position side product to the left of the process node with horizontal spacing
            layoutedSideProducts.push({
                ...sideProduct,
                position: {
                    // Position to the left of the process
                    x: processNode.position.x - sideProductWidth - horizontalSpacing - (index * (sideProductWidth + horizontalSpacing)),
                    y: processNode.position.y + 500, // Same Y as process node
                },
                targetPosition: config.rankdir === 'LR' ? Position.Right : Position.Left,
                sourcePosition: config.rankdir === 'LR' ? Position.Left : Position.Right,
            });
        });
    });

    // Combine the main and side product nodes
    const allLayoutedNodes = [...layoutedMainNodes, ...layoutedSideProducts];

    // Update edges for the layouted graph
    const layoutedEdges = edges.map((edge) => ({
        ...edge,
        type: 'custom',
    }));

    return { layoutedNodes: allLayoutedNodes, layoutedEdges };
}

export default applyDagreLayout;
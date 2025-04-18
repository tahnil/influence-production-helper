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

        // Skip nodes that dagre couldn't position
        if (!nodeWithPosition) {
            console.warn(`No position calculated for node ${node.id}`);
            return node;
        }

        // Determine handle positions based on rankdir
        let sourcePosition = Position.Bottom;
        let targetPosition = Position.Top;

        if (config.rankdir === 'LR') {
            sourcePosition = Position.Right;
            targetPosition = Position.Left;
        } else if (config.rankdir === 'RL') {
            sourcePosition = Position.Left;
            targetPosition = Position.Right;
        } else if (config.rankdir === 'BT') {
            sourcePosition = Position.Top;
            targetPosition = Position.Bottom;
        }

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - (nodeWithPosition.width / 2),
                y: nodeWithPosition.y - (nodeWithPosition.height / 2),
            },
            sourcePosition,
            targetPosition
        };
    });

    // Build a map of process nodes to their side products using ancestorIds
    const processSideProductsMap = new Map<string, Node[]>();

    sideProductNodes.forEach(sideProduct => {
        // Type-safe access to ancestorIds
        const sideProductData = sideProduct.data as SideProductNodeData;
        const ancestorIds = sideProductData.ancestorIds || [];

        if (ancestorIds.length > 0) {
            const processId = ancestorIds[0];

            // Debug output
            console.log(`Side product ${sideProduct.id} has ancestor process: ${processId}`);

            // Verify the process exists in layoutedMainNodes
            const processNode = layoutedMainNodes.find(node => node.id === processId);
            if (!processNode) {
                console.warn(`Process node ${processId} not found for side product ${sideProduct.id}`);
                return;
            }

            // Verify it's a process node
            if (processNode.type !== 'processNode') {
                console.warn(`Node ${processId} is not a process node! It's a ${processNode.type}`);
                return;
            }

            // Add to map
            if (!processSideProductsMap.has(processId)) {
                processSideProductsMap.set(processId, []);
            }
            processSideProductsMap.get(processId)?.push(sideProduct);
        } else {
            console.warn(`Side product ${sideProduct.id} has no ancestorIds!`);
        }
    });

    // Log the resulting map
    console.log('Process Side Products Map:');
    processSideProductsMap.forEach((products, processId) => {
        console.log(`Process ${processId} has ${products.length} side products: ${products.map(p => p.id).join(', ')}`);
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
                    y: processNode.position.y, // Same Y as process node
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
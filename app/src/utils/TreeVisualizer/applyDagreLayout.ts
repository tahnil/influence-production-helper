import { DagreConfig } from '@/hooks/useDagreConfig';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from '@xyflow/react';
import { generateUniqueId } from '../generateUniqueId';

// Define a type for the side product node data
interface SideProductNodeData {
    ancestorIds?: string[];
    [key: string]: any;
}

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {

    // Check if a node is already a compound node
    const existingCompoundIds = new Set(
        nodes
            .filter(node => node.type === 'compoundNode')
            .map(node => node.id)
    );

    // Keep track of which processes are already in compounds
    const processesAlreadyInCompounds = new Set(
        nodes
            .filter(node => node.parentId && node.parentId.startsWith('compound-'))
            .map(node => node.id)
    );

    // Transform our node structure to include compound nodes
    const processesWithSideProducts = new Map<string, Node[]>();
    const transformedNodes: Node[] = [];
    const transformedEdges: Edge[] = [];

    // Identify processes with side products
    nodes.filter(node => node.type === 'sideProductNode').forEach(sideProduct => {
        const data = sideProduct.data as SideProductNodeData;
        if (data.ancestorIds && data.ancestorIds.length > 0) {
            const processId = data.ancestorIds[0];
            // Skip if this process is already in a compound node
            if (processesAlreadyInCompounds.has(processId)) {
                return;
            }
            if (!processesWithSideProducts.has(processId)) {
                processesWithSideProducts.set(processId, []);
            }
            processesWithSideProducts.get(processId)?.push(sideProduct);
        }
    });

    // Now process nodes, skipping those already in compound nodes
    nodes.forEach(node => {
        // If this is already a compound node, keep it as is
        if (node.type === 'compoundNode') {
            transformedNodes.push(node);
            return;
        }

        // If node already has a parent, keep it as is 
        if (node.parentId) {
            transformedNodes.push(node);
            return;
        }
        if (node.type === 'processNode' &&
            processesWithSideProducts.has(node.id) &&
            !processesAlreadyInCompounds.has(node.id)) {

            // This process has side products - create a compound node
            const sideProducts = processesWithSideProducts.get(node.id) || [];
            const compoundId = `compound-${node.id}`;

            // Calculate compound dimensions
            const processWidth = node.measured?.width || 200;
            const processHeight = node.measured?.height || 100;

            // Space for side products
            const totalSideProductWidth = sideProducts.reduce((total, sp) =>
                total + (sp.measured?.width || 200) + 10, 0);

            // Create the compound node
            transformedNodes.push({
                id: compoundId,
                type: 'compoundNode',
                position: { x: 0, y: 0 }, // Will be positioned by Dagre
                data: {
                    id: compoundId,
                    processId: node.id,
                    width: processWidth + totalSideProductWidth + 60, // Total width needed
                    height: Math.max(processHeight, 120) + 20, // Height needed
                    label: `${(node.data as { processDetails?: { name?: string } }).processDetails?.name || 'Process'} Group`
                }
            });

            // Adjust the process node to have a parent
            transformedNodes.push({
                ...node,
                parentId: compoundId,
                // Position relative to compound node (top-left corner is 0,0)
                position: { x: 10, y: 10 }
            });

            // Add side products as children of the compound node
            sideProducts.forEach((sideProduct, index) => {
                transformedNodes.push({
                    ...sideProduct,
                    parentId: compoundId,
                    // Position to the right of the process
                    position: {
                        x: processWidth + 30 + (index * ((sideProduct.measured?.width || 200) + 10)),
                        y: 10
                    }
                });
            });

            // Transform edges connected to this process
            edges.forEach(edge => {
                if (edge.source === node.id || edge.target === node.id) {
                    // For main flow edges, connect to compound node instead
                    if (!edge.data?.isSideProductConnection) {
                        if (edge.source === node.id) {
                            transformedEdges.push({
                                ...edge,
                                source: compoundId,
                                sourceHandle: `compound-source-${compoundId}`
                            });
                        } else if (edge.target === node.id) {
                            transformedEdges.push({
                                ...edge,
                                target: compoundId,
                                targetHandle: `compound-target-${compoundId}`
                            });
                        }
                    } else {
                        // For side product connections, keep as is
                        transformedEdges.push(edge);
                    }
                } else {
                    // Edge not connected to this process, keep as is
                    transformedEdges.push(edge);
                }
            });
        }
        else if (node.type !== 'sideProductNode' || !node.data.ancestorIds) {
            // Regular product node or process without side products
            transformedNodes.push(node);
        }
        // Skip side products - they're added as children of compound nodes
    });

    // Layout with Dagre - only the main nodes and compound nodes
    const dagreGraph = new Dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ ...config });

    // Add nodes to dagre, but only those without parents
    transformedNodes
        .filter(node => !node.parentId)
        .forEach(node => {
            dagreGraph.setNode(node.id, {
                width: node.type === 'compoundNode' ? (node.data as { width: number }).width : (node.measured?.width || 200),
                height: node.type === 'compoundNode' ? (node.data as { height: number }).height : (node.measured?.height || 100)
            });
        });

    // Add the transformed edges to Dagre
    transformedEdges
        .filter(edge => {
            // Only include edges between nodes that Dagre knows about
            const sourceExists = dagreGraph.hasNode(edge.source);
            const targetExists = dagreGraph.hasNode(edge.target);
            return sourceExists && targetExists;
        })
        .forEach(edge => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

    // Run Dagre layout
    Dagre.layout(dagreGraph);

    // Apply positions from Dagre to our nodes
    const layoutedNodes = transformedNodes.map(node => {
        if (!node.parentId) {
            // Position top-level nodes according to Dagre
            const dagNode = dagreGraph.node(node.id);
            if (dagNode) {
                return {
                    ...node,
                    position: {
                        x: dagNode.x - (node.type === 'compoundNode' ? (node.data as { width: number }).width / 2 : (node.measured?.width || 200) / 2),
                        y: dagNode.y - (node.type === 'compoundNode' ? (node.data as { height: number }).height / 2 : (node.measured?.height || 100) / 2)
                    }
                };
            }
        }
        // Child nodes keep their relative positions
        return node;
    });

    return {
        layoutedNodes,
        layoutedEdges: transformedEdges
    };
}
export default applyDagreLayout;
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

    // Identify processes with side products
    nodes.filter(node => node.type === 'sideProductNode').forEach(sideProduct => {
        const data = sideProduct.data as SideProductNodeData;
        if (data.ancestorIds && data.ancestorIds.length > 0) {
            const processId = data.ancestorIds[0];
            // Skip if this process is already in a compound node
            if (!processesWithSideProducts.has(processId)) {
                processesWithSideProducts.set(processId, []);
            }
            processesWithSideProducts.get(processId)?.push(sideProduct);
        }
    });

    const transformedNodes: Node[] = [];
    const transformedEdges: Edge[] = [];

    // Keep track of which edges we've already processed
    const processedNodeIds = new Set<string>();
    const processedEdgeIds = new Set<string>();

    // Process node replacements first
    const nodeReplacements = new Map<string, string>(); // Maps original node ID to compound node ID

    // First pass: Create compound nodes and track replacements
    nodes.forEach(node => {
        if (node.type === 'compoundNode' || processedNodeIds.has(node.id)) {
            return; // Skip already processed nodes
        }

        if (node.type === 'processNode' &&
            processesWithSideProducts.has(node.id) &&
            !processesAlreadyInCompounds.has(node.id)) {

            const compoundId = `compound-${node.id}`;
            nodeReplacements.set(node.id, compoundId);
            processedNodeIds.add(node.id);
        }
    });

    // First, add all edges that don't connect to process nodes with side products
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        // If either source or target is a process with side products that's not already in a compound
        const sourceHasSideProducts = sourceNode?.type === 'processNode' &&
            processesWithSideProducts.has(sourceNode.id) &&
            !processesAlreadyInCompounds.has(sourceNode.id);

        const targetHasSideProducts = targetNode?.type === 'processNode' &&
            processesWithSideProducts.has(targetNode.id) &&
            !processesAlreadyInCompounds.has(targetNode.id);

        // If neither node will be converted to a compound, keep the edge as is
        if (!sourceHasSideProducts && !targetHasSideProducts) {
            transformedEdges.push(edge);
            processedEdgeIds.add(edge.id);
        }
    });

    // Second pass: Build the actual nodes
    nodes.forEach(node => {
        // Skip nodes already processed
        if (processedNodeIds.has(node.id)) {
            return;
        }

        // Handle compound nodes
        if (node.type === 'compoundNode') {
            transformedNodes.push(node);
            processedNodeIds.add(node.id);
            return;
        }

        // Handle process nodes that need to be in compounds
        if (node.type === 'processNode' &&
            processesWithSideProducts.has(node.id) &&
            !processesAlreadyInCompounds.has(node.id)) {

            const sideProducts = processesWithSideProducts.get(node.id) || [];
            const compoundId = `compound-${node.id}`;

            // Calculate compound dimensions
            const processWidth = node.measured?.width || 250;
            const processHeight = node.measured?.height || 120;

            // Space for side products
            const sideProductWidth = 200; // Default width
            const sideProductSpacing = 20;
            const totalSideProductWidth = sideProducts.length * (sideProductWidth + sideProductSpacing);

            // Create the compound node
            transformedNodes.push({
                id: compoundId,
                type: 'compoundNode',
                position: { x: 0, y: 0 }, // Will be positioned by Dagre
                data: {
                    id: compoundId,
                    processId: node.id,
                    width: Math.max(processWidth, totalSideProductWidth) + 40,
                    height: processHeight + 40,
                    children: 'Process with side products'
                }
            });

            // Add the process node as child
            transformedNodes.push({
                ...node,
                parentId: compoundId,
                position: { x: 20, y: 20 } // Position within compound
            });

            // Add side products as children
            sideProducts.forEach((sideProduct, index) => {
                transformedNodes.push({
                    ...sideProduct,
                    parentId: compoundId,
                    position: {
                        x: 20 + index * (sideProductWidth + sideProductSpacing),
                        y: processHeight + 10
                    }
                });
                processedNodeIds.add(sideProduct.id);
            });

            processedNodeIds.add(node.id);
            processedNodeIds.add(compoundId);
        }
        // Regular nodes
        else if (!node.parentId) {
            transformedNodes.push(node);
            processedNodeIds.add(node.id);
        }
    });

    // Process edges, redirecting connections to compounds
    edges.forEach(edge => {
        // Skip processed edges
        if (processedEdgeIds.has(edge.id)) {
            return;
        }

        let newEdge = { ...edge };
        let modified = false;

        // Check if source needs replacement
        if (nodeReplacements.has(edge.source)) {
            newEdge.source = nodeReplacements.get(edge.source) || edge.source;
            newEdge.sourceHandle = `compound-source-${newEdge.source}`;
            modified = true;
        }

        // Check if target needs replacement
        if (nodeReplacements.has(edge.target)) {
            newEdge.target = nodeReplacements.get(edge.target) || edge.target;
            newEdge.targetHandle = `compound-target-${newEdge.target}`;
            modified = true;
        }

        // Use a new ID if the edge was modified
        if (modified) {
            newEdge.id = `compound-${edge.id}`;
        }

        transformedEdges.push(newEdge);
        processedEdgeIds.add(edge.id);
    });

    // Layout with Dagre - only the main nodes and compound nodes
    const dagreGraph = new Dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        ...config
    });

    // Add only top-level nodes to Dagre
    transformedNodes
        .filter(node => !node.parentId)
        .forEach(node => {
            const width = node.type === 'compoundNode'
                ? (node.data.width || 300)
                : (node.measured?.width || 200);

            const height = node.type === 'compoundNode'
                ? (node.data.height || 150)
                : (node.measured?.height || 100);

            dagreGraph.setNode(node.id, { width: Number(width), height: Number(height) });
        });

    // Add edges between top-level nodes
    transformedEdges.forEach(edge => {
        // Only include edges connecting top-level nodes
        const sourceNode = transformedNodes.find(n => n.id === edge.source);
        const targetNode = transformedNodes.find(n => n.id === edge.target);

        if (sourceNode && targetNode && !sourceNode.parentId && !targetNode.parentId) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    // Run Dagre layout
    Dagre.layout(dagreGraph);

    // Apply positions from Dagre
    const layoutedNodes = transformedNodes.map(node => {
        if (!node.parentId) {
            // Position top-level nodes
            const dagNode = dagreGraph.node(node.id);
            if (dagNode) {
                return {
                    ...node,
                    position: {
                        x: dagNode.x - dagNode.width / 2,
                        y: dagNode.y - dagNode.height / 2
                    }
                };
            }
        }
        // Child nodes maintain their relative position within parent
        return node;
    });
    
    return {
        layoutedNodes,
        layoutedEdges: transformedEdges
    };
}
export default applyDagreLayout;
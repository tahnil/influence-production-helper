import { DagreConfig } from '@/hooks/useDagreConfig';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from '@xyflow/react';

// Define a type for the side product node data
interface SideProductNodeData {
    ancestorIds?: string[];
    [key: string]: any;
}

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    // Step 1: Identify processes with side products
    const processesWithSideProducts = new Map<string, Node[]>();

    // Find all processes that have side products
    nodes.filter(node => node.type === 'sideProductNode').forEach(sideProduct => {
        const data = sideProduct.data as SideProductNodeData;
        if (data.ancestorIds && data.ancestorIds.length > 0) {
            const processId = data.ancestorIds[0];
            if (!processesWithSideProducts.has(processId)) {
                processesWithSideProducts.set(processId, []);
            }
            processesWithSideProducts.get(processId)?.push(sideProduct);
        }
    });

    // Step 2: Create a modified graph for Dagre where each process+sideProducts is a compound node
    const dagreGraph = new Dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ ...config });

    // Track the original node IDs to compound node mappings
    const nodeToCompoundMap = new Map<string, string>();
    const compoundDimensions = new Map<string, { width: number, height: number }>();

    // Add all nodes to the graph
    nodes.forEach(node => {
        // Regular nodes (not side products and not processes with side products)
        if (node.type !== 'sideProductNode' && !processesWithSideProducts.has(node.id)) {
            dagreGraph.setNode(node.id, {
                width: node.measured?.width || 200,
                height: node.measured?.height || 100
            });
        }
        // For processes with side products, create a compound node
        else if (processesWithSideProducts.has(node.id)) {
            const sideProducts = processesWithSideProducts.get(node.id) || [];
            const compoundId = `compound-${node.id}`;

            // Calculate compound node dimensions based on the process and its side products
            const processWidth = node.measured?.width || 200;
            const processHeight = node.measured?.height || 100;

            // Calculate width needed for side products (assuming horizontal arrangement)
            const sideProductsTotalWidth = sideProducts.reduce((total, sp) =>
                total + (sp.measured?.width || 200) + 10, 0);

            // Calculate height needed (max of process height or all side products stacked)
            const sideProductsTotalHeight = sideProducts.reduce((max, sp) =>
                Math.max(max, sp.measured?.height || 100), 0);

            // Set compound node dimensions
            const compoundWidth = processWidth + sideProductsTotalWidth + 60; // Extra padding
            const compoundHeight = Math.max(processHeight, sideProductsTotalHeight) + 40; // Extra padding

            // Add the compound node to Dagre
            dagreGraph.setNode(compoundId, {
                width: compoundWidth,
                height: compoundHeight
            });

            // Store compound dimensions for later
            compoundDimensions.set(compoundId, { width: compoundWidth, height: compoundHeight });

            // Mark the process node as part of this compound
            nodeToCompoundMap.set(node.id, compoundId);

            // Mark all side products as part of this compound
            sideProducts.forEach(sp => {
                nodeToCompoundMap.set(sp.id, compoundId);
            });
        }
    });

    // Add edges to Dagre (only between non-side-product nodes)
    edges.forEach(edge => {
        const sourceCompound = nodeToCompoundMap.get(edge.source);
        const targetCompound = nodeToCompoundMap.get(edge.target);

        // If either node is part of a compound, adjust the edge
        if (sourceCompound || targetCompound) {
            // Case 1: Both nodes are in compounds
            if (sourceCompound && targetCompound) {
                // If they're in the same compound, skip this edge for Dagre layout
                if (sourceCompound === targetCompound) {
                    return;
                }
                // Connect between compounds
                dagreGraph.setEdge(sourceCompound, targetCompound);
            }
            // Case 2: Only source is in a compound
            else if (sourceCompound) {
                dagreGraph.setEdge(sourceCompound, edge.target);
            }
            // Case 3: Only target is in a compound
            else if (targetCompound) {
                dagreGraph.setEdge(edge.source, targetCompound);
            }
        }
        // Case 4: Regular edge between non-compound nodes
        else {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    // Run Dagre layout
    Dagre.layout(dagreGraph);

    // Step 3: Position nodes based on Dagre layout
    const layoutedNodes = [...nodes].map(node => {
        const compoundId = nodeToCompoundMap.get(node.id);

        // If node is part of a compound
        if (compoundId) {
            const compoundPos = dagreGraph.node(compoundId);
            const compoundDims = compoundDimensions.get(compoundId) || { width: 0, height: 0 };

            // Get all nodes in this compound
            const processNode = nodes.find(n => n.id === compoundId.replace('compound-', ''));
            const sideProducts = processesWithSideProducts.get(compoundId.replace('compound-', '')) || [];

            // Position nodes within the compound
            if (node.type === 'processNode') {
                // Center the process node in the compound
                return {
                    ...node,
                    position: {
                        x: compoundPos.x - (compoundDims.width / 2) + 30, // Left side with padding
                        y: compoundPos.y - (node.measured?.height || 100) / 2 // Centered vertically
                    }
                };
            } else if (node.type === 'sideProductNode') {
                // Find index of this side product in the list
                const index = sideProducts.findIndex(sp => sp.id === node.id);
                const processWidth = processNode?.measured?.width || 200;

                // Position side products in a horizontal line to the right of the process
                return {
                    ...node,
                    position: {
                        x: compoundPos.x - (compoundDims.width / 2) + processWidth + 60 + (index * ((node.measured?.width || 200) + 10)),
                        y: compoundPos.y - (node.measured?.height || 100) / 2 // Centered vertically
                    }
                };
            }
        }

        // Regular node not in a compound
        const nodeWithPosition = dagreGraph.node(node.id);
        if (nodeWithPosition) {
            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - (node.measured?.width || 200) / 2,
                    y: nodeWithPosition.y - (node.measured?.height || 100) / 2
                }
            };
        }

        // Fallback: return original node
        return node;
    });

    return {
        layoutedNodes,
        layoutedEdges: edges
    };
}

export default applyDagreLayout;
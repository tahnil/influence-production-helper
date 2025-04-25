// utils/TreeVisualizer/applyDagreLayout.ts
import { DagreConfig } from '@/hooks/useDagreConfig';
import { InfluenceNode } from '@/types/reactFlowTypes';
import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    // Group nodes by parent
    const nodesByParent = new Map<string | null, Node[]>();
    nodesByParent.set(null, []); // Initialize group for top-level nodes

    // Group all nodes by their parent
    nodes.forEach(node => {
        const parentId = node.parentId || null;
        if (!nodesByParent.has(parentId)) {
            nodesByParent.set(parentId, []);
        }
        nodesByParent.get(parentId)?.push(node);
    });

    // Process sideProductCompound nodes first to determine their sizes
    const sideProductCompoundNodes = (nodesByParent.get(null) || [])
        .filter(node => node.type === 'sideProductCompoundNode')
        .map(sideProductCompoundNode => {
            const children = nodesByParent.get(sideProductCompoundNode.id) || [];

            if (children.length === 0) {
                return {
                    ...sideProductCompoundNode,
                    measured: {
                        width: 400,
                        height: 200,
                    }
                };
            }

            // Get edges between children of this sideProductCompound
            const childEdges = edges.filter(edge => {
                const sourceNode = children.find(child => child.id === edge.source);
                const targetNode = children.find(child => child.id === edge.target);
                return sourceNode && targetNode;
            });

            // Layout children using Dagre
            const layoutedChildren = layoutNodesWithDagre(children, childEdges, config);

            // Calculate required sideProductCompound size based on children's layout
            const { width, height, offsetX, offsetY } = calculateSideProductCompoundSize(layoutedChildren);

            // Store information for final positioning
            return {
                ...sideProductCompoundNode,
                data: {
                    ...sideProductCompoundNode.data,
                    width,
                    height,
                    childrenLayout: {
                        children: layoutedChildren,
                        offsetX,
                        offsetY
                    }
                },
                measured: {
                    width,
                    height
                }
            };
        });

    // Get non-sideProductCompound top-level nodes
    const regularTopLevelNodes = (nodesByParent.get(null) || [])
        .filter(node => node.type !== 'sideProductCompoundNode');

    // Combine regular top-level nodes with sideProductCompound nodes (now with proper sizes)
    const topLevelNodes = [...regularTopLevelNodes, ...sideProductCompoundNodes];

    // Get edges between top-level nodes
    const topLevelEdges = edges.filter(edge => {
        const sourceParent = nodes.find(n => n.id === edge.source)?.parentId || null;
        const targetParent = nodes.find(n => n.id === edge.target)?.parentId || null;

        // Include edges between top-level nodes or from sideProductCompound to sideProductCompound
        return (sourceParent === null && targetParent === null) ||
            (sourceParent === null && nodes.find(n => n.id === edge.target)?.type === 'sideProductCompoundNode') ||
            (targetParent === null && nodes.find(n => n.id === edge.source)?.type === 'sideProductCompoundNode');
    });

    // Run Dagre layout on top-level nodes
    const layoutedTopLevel = layoutNodesWithDagre(topLevelNodes, topLevelEdges, config);

    // Final set of nodes with proper positioning
    const finalNodes: Node[] = [];

    // Process all top-level nodes
    layoutedTopLevel.forEach(node => {
        if (node.type === 'sideProductCompoundNode' && node.data.childrenLayout) {
            // Add the sideProductCompound node itself
            finalNodes.push({
                ...node,
                data: {
                    ...node.data,
                    width: node.data.width,
                    height: node.data.height
                }
            });

            // Add transformed children with positions relative to the sideProductCompound
            const { children, offsetX, offsetY } = node.data.childrenLayout as { children: InfluenceNode[], offsetX: number, offsetY: number };

            children.forEach(child => {
                finalNodes.push({
                    ...child,
                    parentId: node.id,
                    position: {
                        x: child.position.x - offsetX + 20, // Add padding
                        y: child.position.y - offsetY + 20  // Add padding
                    }
                });
            });
        } else {
            // Regular top-level node, add as is
            finalNodes.push(node);
        }
    });

    return {
        layoutedNodes: finalNodes,
        layoutedEdges: edges // Return edges unchanged
    };
}

// Helper function to layout nodes using Dagre
function layoutNodesWithDagre(nodes: Node[], edges: Edge[], config: DagreConfig): Node[] {
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

    // Add node dimensions based on type
    nodes.forEach(node => {
        const width = node.measured?.width ||
            (node.type === 'processNode' ? 250 :
                node.type === 'sideProductNode' ? 200 :
                    node.type === 'sideProductCompoundNode' ? (node.data.width || 400) :
                        node.type === 'outflowsCompoundNode' ? (node.data.width || 500) :
                            node.type === 'productNode' ? 300 : 150);

        const height = node.measured?.height ||
            (node.type === 'processNode' ? 120 :
                node.type === 'sideProductNode' ? 100 :
                    node.type === 'sideProductCompoundNode' ? (node.data.height || 200) :
                        node.type === 'outflowsCompoundNode' ? (node.data.height || 300) :
                            node.type === 'productNode' ? 150 : 80);

        dagreGraph.setNode(node.id, { label: node.id, width: Number(width), height: Number(height) });
    });
    
    // Add edges to dagre
    edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Run dagre layout
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

// Helper function to calculate sideProductCompound node size based on children layout
function calculateSideProductCompoundSize(children: Node[]): { width: number, height: number, offsetX: number, offsetY: number } {
    if (children.length === 0) {
        return { width: 400, height: 200, offsetX: 0, offsetY: 0 };
    }

    // First, separate side product nodes from other nodes
    const sideProductNodes = children.filter(node => node.type === 'sideProductNode');
    const otherNodes = children.filter(node => node.type !== 'sideProductNode');

    // If there are side product nodes, arrange them in a grid
    if (sideProductNodes.length > 0) {
        // Calculate dimensions for side product nodes
        const sideProductWidth = 220; // Width of each side product node with spacing
        const sideProductHeight = 120; // Height of each side product node with spacing
        const horizontalGap = 20; // Gap between columns
        const verticalGap = 20; // Gap between rows

        // Determine the number of columns (2 for <= 6 nodes, 3 for > 6 nodes)
        const numColumns = sideProductNodes.length > 4 ? 3 : 2;
        const numRows = Math.ceil(sideProductNodes.length / numColumns);

        // Rearrange side product nodes in a grid
        sideProductNodes.forEach((node, index) => {
            const column = index % numColumns;
            const row = Math.floor(index / numColumns);

            // Calculate new position in the grid
            const x = 20 + column * (sideProductWidth + horizontalGap);
            const y = 20 + row * (sideProductHeight + verticalGap);

            // Update node position
            node.position = { x, y };
        });

        // Calculate total width and height needed for the grid
        const gridWidth = numColumns * sideProductWidth + (numColumns - 1) * horizontalGap + 40; // 40px padding
        const gridHeight = numRows * sideProductHeight + (numRows - 1) * verticalGap + 40; // 40px padding

        // Find bounding box for other nodes
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        if (otherNodes.length > 0) {
            otherNodes.forEach(child => {
                const nodeWidth = child.measured?.width ||
                    (child.type === 'processNode' ? 250 : 300);
                const nodeHeight = child.measured?.height ||
                    (child.type === 'processNode' ? 120 : 150);

                const x1 = child.position.x;
                const y1 = child.position.y;
                const x2 = x1 + nodeWidth;
                const y2 = y1 + nodeHeight;

                minX = Math.min(minX, x1);
                minY = Math.min(minY, y1);
                maxX = Math.max(maxX, x2);
                maxY = Math.max(maxY, y2);
            });

            // Make sure we account for both other nodes and the side product grid
            const width = Math.max(maxX - minX, gridWidth) + 40; // 40px padding
            const height = (maxY - minY) + gridHeight + 40; // Other nodes plus grid height

            return {
                width: Math.max(width, 400),
                height: Math.max(height, 200),
                offsetX: minX,
                offsetY: minY
            };
        } else {
            // Only side product nodes
            return {
                width: Math.max(gridWidth, 400),
                height: Math.max(gridHeight, 200),
                offsetX: 20, // Start at padding
                offsetY: 20  // Start at padding
            };
        }
    }

    // Find bounding box of all children
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    children.forEach(child => {
        const nodeWidth = child.measured?.width ||
            (child.type === 'processNode' ? 250 :
                child.type === 'sideProductNode' ? 200 :
                    child.type === 'productNode' ? 300 : 150);

        const nodeHeight = child.measured?.height ||
            (child.type === 'processNode' ? 120 :
                child.type === 'sideProductNode' ? 100 :
                    child.type === 'productNode' ? 150 : 80);

        const x1 = child.position.x;
        const y1 = child.position.y;
        const x2 = x1 + nodeWidth;
        const y2 = y1 + nodeHeight;

        minX = Math.min(minX, x1);
        minY = Math.min(minY, y1);
        maxX = Math.max(maxX, x2);
        maxY = Math.max(maxY, y2);
    });

    const PADDING = 40; // Padding around children
    const width = maxX - minX + PADDING * 2;
    const height = maxY - minY + PADDING * 2;

    // Ensure minimum size
    const finalWidth = Math.max(width, 400);
    const finalHeight = Math.max(height, 200);

    console.log('Calculated sideProductCompound size:',
        { minX, minY, maxX, maxY, width, height, finalWidth, finalHeight });

    return {
        width: finalWidth,
        height: finalHeight,
        offsetX: minX,
        offsetY: minY
    };
}

export default applyDagreLayout;
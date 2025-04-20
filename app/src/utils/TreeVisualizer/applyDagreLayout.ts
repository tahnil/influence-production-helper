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

    // Process compound nodes first to determine their sizes
    const compoundNodes = (nodesByParent.get(null) || [])
        .filter(node => node.type === 'compoundNode')
        .map(compoundNode => {
            const children = nodesByParent.get(compoundNode.id) || [];

            if (children.length === 0) {
                return {
                    ...compoundNode,
                    measured: {
                        width: 400,
                        height: 200,
                    }
                };
            }

            // Get edges between children of this compound
            const childEdges = edges.filter(edge => {
                const sourceNode = children.find(child => child.id === edge.source);
                const targetNode = children.find(child => child.id === edge.target);
                return sourceNode && targetNode;
            });

            // Layout children using Dagre
            const layoutedChildren = layoutNodesWithDagre(children, childEdges, config);

            // Calculate required compound size based on children's layout
            const { width, height, offsetX, offsetY } = calculateCompoundSize(layoutedChildren);

            // Store information for final positioning
            return {
                ...compoundNode,
                data: {
                    ...compoundNode.data,
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

    // Get non-compound top-level nodes
    const regularTopLevelNodes = (nodesByParent.get(null) || [])
        .filter(node => node.type !== 'compoundNode');

    // Combine regular top-level nodes with compound nodes (now with proper sizes)
    const topLevelNodes = [...regularTopLevelNodes, ...compoundNodes];

    // Get edges between top-level nodes
    const topLevelEdges = edges.filter(edge => {
        const sourceParent = nodes.find(n => n.id === edge.source)?.parentId || null;
        const targetParent = nodes.find(n => n.id === edge.target)?.parentId || null;

        // Include edges between top-level nodes or from compound to compound
        return (sourceParent === null && targetParent === null) ||
            (sourceParent === null && nodes.find(n => n.id === edge.target)?.type === 'compoundNode') ||
            (targetParent === null && nodes.find(n => n.id === edge.source)?.type === 'compoundNode');
    });

    // Run Dagre layout on top-level nodes
    const layoutedTopLevel = layoutNodesWithDagre(topLevelNodes, topLevelEdges, config);

    // Final set of nodes with proper positioning
    const finalNodes: Node[] = [];

    // Process all top-level nodes
    layoutedTopLevel.forEach(node => {
        if (node.type === 'compoundNode' && node.data.childrenLayout) {
            // Add the compound node itself
            finalNodes.push({
                ...node,
                data: {
                    ...node.data,
                    width: node.data.width,
                    height: node.data.height
                }
            });

            // Add transformed children with positions relative to the compound
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

    // Add nodes to dagre with dimensions
    nodes.forEach(node => {
        const width = node.measured?.width ||
            (node.type === 'processNode' ? 250 :
                node.type === 'sideProductNode' ? 200 :
                    node.type === 'compoundNode' ? (node.data.width || 400) :
                        node.type === 'productNode' ? 300 : 150);

        const height = node.measured?.height ||
            (node.type === 'processNode' ? 120 :
                node.type === 'sideProductNode' ? 100 :
                    node.type === 'compoundNode' ? (node.data.height || 200) :
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

// Helper function to calculate compound node size based on children layout
function calculateCompoundSize(children: Node[]): { width: number, height: number, offsetX: number, offsetY: number } {
    if (children.length === 0) {
        return { width: 400, height: 200, offsetX: 0, offsetY: 0 };
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

    console.log('Calculated compound size:',
        { minX, minY, maxX, maxY, width, height, finalWidth, finalHeight });

    return {
        width: finalWidth,
        height: finalHeight,
        offsetX: minX,
        offsetY: minY
    };
}

export default applyDagreLayout;
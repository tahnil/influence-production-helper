import { DagreConfig } from '@/hooks/useDagreConfig';
import { InfluenceNode } from '@/types/reactFlowTypes';
import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

function applyDagreLayout(nodes: Node[], edges: Edge[], config: DagreConfig) {
    // Create a new dagre graph instance
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Set graph direction and other configurations
    dagreGraph.setGraph({
        rankdir: config.rankdir, // 'TB' (top to bottom) for your outflow->inflow hierarchy
        nodesep: config.nodesep,
        ranksep: config.ranksep,
        edgesep: config.edgesep,
        marginx: config.marginx,
        marginy: config.marginy,
        align: config.align,
        acyclicer: config.acyclicer !== 'undefined' ? config.acyclicer : undefined,
        ranker: config.ranker,
    });

    // First, we'll only add parent nodes to dagre for layout
    // Create a map to track parent-child relationships
    const parentChildMap = new Map<string, Node[]>();

    // Group nodes by their parent
    nodes.forEach(node => {
        if (node.parentId) {
            if (!parentChildMap.has(node.parentId)) {
                parentChildMap.set(node.parentId, []);
            }
            parentChildMap.get(node.parentId)?.push(node);
        }
    });

    // Add only parent nodes to dagre
    const parentNodes = nodes.filter(node => !node.parentId);
    parentNodes.forEach(node => {
        // Calculate the width and height, considering child nodes if necessary
        let width = node.measured?.width ||
            (node.type === 'processNode' ? 250 :
                node.type === 'sideProductNode' ? 200 :
                    node.type === 'compoundNode' ? 400 : 300);

        let height = node.measured?.height ||
            (node.type === 'processNode' ? 120 :
                node.type === 'sideProductNode' ? 100 :
                    node.type === 'compoundNode' ? 300 : 150);

        // If this is a compound node, make sure it's large enough to fit children
        if (node.type === 'compoundNode' && parentChildMap.has(node.id)) {
            // You may want to adjust this logic based on your specific layout needs
            width = Math.max(width, typeof node.data.width === 'number' ? node.data.width : 400);
            height = Math.max(height, typeof node.data.height === 'number' ? node.data.height : 300);
        }

        dagreGraph.setNode(node.id, { width, height });
    });

    // Add edges between parent nodes
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        // Only add edges between parent nodes (not child nodes)
        if (sourceNode && targetNode && !sourceNode.parentId && !targetNode.parentId) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    // Run the dagre layout algorithm
    dagre.layout(dagreGraph);

    // Apply the calculated layout to the parent nodes and position children within parents
    const layoutedNodes = nodes.map(node => {
        // If it's a parent node, apply dagre layout
        if (!node.parentId) {
            const nodeWithPosition = dagreGraph.node(node.id);

            if (nodeWithPosition) {
                return {
                    ...node,
                    position: {
                        x: nodeWithPosition.x - nodeWithPosition.width / 2,
                        y: nodeWithPosition.y - nodeWithPosition.height / 2
                    }
                };
            }
        }
        // If it's a child node, keep its position relative to parent
        // Child node positions should be specified in your node creation
        // and remain untouched by the layout algorithm

        return node;
    });

    return {
        layoutedNodes,
        layoutedEdges: edges
    };
}

export default applyDagreLayout;
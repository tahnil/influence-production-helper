import { FlowAction } from "@/contexts/FlowContext";
import { useProcessData } from "@/hooks/useProcessData";
import { InfluenceNode } from "@/types/reactFlowTypes";
import { findNodesToRemove } from "@/utils/TreeVisualizer/nodeRemovalHelper";
import { createProcessNodePlan, NodePlan } from "./nodeStructurePlanner";
import { Edge } from "@xyflow/react";
import { generateUniqueId } from "@/utils/generateUniqueId";
import { createProcessNode, createProductNode, createSideProductNode, createSideProductCompoundNode } from "./nodeFactory";

// services/nodeCreationOrchestrator.ts
export async function createProcessStructure(
    processId: string,
    logicalParentId: string,
    parentAmount: number,
    parentProductId: string,
    dispatch: React.Dispatch<FlowAction>,
    currentNodes: InfluenceNode[]
) {
    const { fetchProcessData } = useProcessData();

    try {
        // 1. Fetch process data
        const processData = await fetchProcessData(processId, parentProductId, parentAmount);
        if (!processData) throw new Error('Failed to fetch process data');

        // 2. Determine which nodes need to be removed
        const nodesToRemove = findNodesToRemove(currentNodes, logicalParentId);

        // 3. Create node plans
        const nodePlans = createProcessNodePlan(processData, logicalParentId);

        // 4. Create nodes with real IDs and resolve placeholders
        const { nodes, nodeIdMap } = realizePlans(nodePlans);

        // 5. Create edges
        const edges = createEdges(nodes, nodeIdMap);

        // 6. Update state through dispatcher
        dispatch({
            type: 'PROCESS_STRUCTURE_CREATED',
            payload: {
                nodesToRemove,
                newNodes: nodes,
                newEdges: edges
            }
        });

        return true;
    } catch (error) {
        console.error('Error creating process structure:', error);
        dispatch({
            type: 'NODE_CREATION_FAILED',
            payload: { error: String(error) }
        });
        return false;
    }
}

// Helper function to realize node plans with actual IDs
function realizePlans(plans: NodePlan[]) {
    const nodeIdMap: Record<string, string> = {};
    const nodes: InfluenceNode[] = [];

    // First pass: create process and compound nodes
    plans.filter(p => ['process', 'compound'].includes(p.nodeType)).forEach(plan => {
        const id = generateUniqueId();
        nodeIdMap[plan.nodeType === 'process' ? 'PROCESS_NODE_ID' : 'COMPOUND_NODE_ID'] = id;

        let node;
        if (plan.nodeType === 'process') {
            node = createProcessNode({ ...plan.metadata, processDetails: { id: plan.processId } }, plan.parentId!);
        } else {
            node = createSideProductCompoundNode(nodeIdMap['PROCESS_NODE_ID']);
        }

        node.id = id;
        nodes.push(node);
    });

    // Second pass: create product and side product nodes
    plans.filter(p => ['product', 'sideProduct'].includes(p.nodeType)).forEach(plan => {
        let node;
        if (plan.nodeType === 'product') {
            node = createProductNode({ id: plan.productId }, plan.amount!, nodeIdMap['PROCESS_NODE_ID']);
        } else {
            node = createSideProductNode(
                { id: plan.productId },
                plan.amount!,
                nodeIdMap['PROCESS_NODE_ID'],
                nodeIdMap['COMPOUND_NODE_ID']
            );
        }

        nodes.push(node);
    });

    return { nodes, nodeIdMap };
}

/**
 * Creates edges between nodes based on their relationships and the nodeIdMap
 * @param nodes The newly created nodes
 * @param nodeIdMap Map of placeholder IDs to actual node IDs
 * @returns Array of edges connecting the nodes
 */
function createEdges(nodes: InfluenceNode[], nodeIdMap: Record<string, string>): Edge[] {
    const edges: Edge[] = [];
    const processNodeId = nodeIdMap['PROCESS_NODE_ID'];
    const compoundNodeId = nodeIdMap['COMPOUND_NODE_ID'];
    const logicalParentId = nodes.find(n => n.id === processNodeId)?.data.logicalParentId as string;

    // Find node types
    const processNode = nodes.find(n => n.id === processNodeId);
    const productNodes = nodes.filter(n =>
        n.type === 'productNode' &&
        n.data.logicalParentId === processNodeId
    );
    const sideProductNodes = nodes.filter(n => n.type === 'sideProductNode');
    const sideProductCompoundNode = nodes.find(n => n.id === compoundNodeId);

    // 1. Edge from parent product to process node (main flow)
    if (logicalParentId) {
        edges.push({
            id: `edge-${logicalParentId}-${processNodeId}`,
            source: logicalParentId,
            target: processNodeId,
            type: 'custom',
        });
    }

    // 2. Edges from process node to input product nodes
    productNodes.forEach(productNode => {
        edges.push({
            id: `edge-${processNodeId}-${productNode.id}`,
            source: processNodeId,
            target: productNode.id,
            type: 'custom',
        });
    });

    // 3. Handle side product compound and side product nodes
    if (sideProductCompoundNode && sideProductNodes.length > 0) {
        // Edge from side product compound to process
        edges.push({
            id: `edge-${compoundNodeId}-${processNodeId}`,
            source: compoundNodeId,
            sourceHandle: `sideProductCompound-source-${compoundNodeId}`,
            target: processNodeId,
            type: 'custom',
        });

        // Edges from process to side products
        sideProductNodes.forEach(sideProductNode => {
            edges.push({
                id: `edge-${processNodeId}-${sideProductNode.id}`,
                source: processNodeId,
                target: sideProductNode.id,
                type: 'custom',
                data: { isSideProductConnection: true }
            });
        });
    }

    // 4. Handle outflows compound (for future implementation)
    // This is where you'd add your planned outflows bundling feature
    // Example:
    // if (outflowsCompoundNodeId) {
    //   const outflowsCompoundNode = nodes.find(n => n.id === outflowsCompoundNodeId);
    //   if (outflowsCompoundNode) {
    //     // Connect process to outflows compound
    //     // Connect outflows compound to main outflow product
    //     // Handle other connections...
    //   }
    // }

    return edges;
}
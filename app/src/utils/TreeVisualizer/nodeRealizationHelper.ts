// utils/TreeVisualizer/nodeRealizationHelper.ts

import { createProcessNode, createProductNode, createSideProductCompoundNode, createSideProductNode, createOutflowsCompoundNode } from "@/services/nodeFactory";
import { NodePlan } from "@/services/nodeStructurePlanner";
import { ProductData } from "@/types/influenceTypes";
import { InfluenceNode } from "@/types/reactFlowTypes";
import { Edge } from "@xyflow/react";

export function realizePlans(plans: NodePlan[], productDataMap: Record<string, ProductData>) {
    const nodeIdMap: Record<string, string> = {};
    const nodes: InfluenceNode[] = [];

    // First pass: Create compound nodes and process nodes
    plans.filter(p => ['outflowsCompound', 'process', 'sideProductCompound'].includes(p.nodeType)).forEach(plan => {
        let node;

        if (plan.nodeType === 'outflowsCompound') {
            // For the root outflows compound, there is no process ID
            const isRoot = plan.isRoot || plan.metadata?.isRoot || false;
            node = createOutflowsCompoundNode(
                nodeIdMap['PROCESS_NODE_ID'], // This will be undefined for root nodes
                isRoot
            );

            // Store node ID in the map
            if (plan.id === 'ROOT_OUTFLOWS_COMPOUND_ID') {
                nodeIdMap['ROOT_OUTFLOWS_COMPOUND_ID'] = node.id;
                // Also set in the root node ID in FlowContext after creation
                if (isRoot) {
                    nodeIdMap['ROOT_NODE_ID'] = node.id;
                }
            } else if (plan.id) {
                nodeIdMap[plan.id] = node.id;
            } else {
                nodeIdMap['OUTFLOWS_COMPOUND_NODE_ID'] = node.id;
            }
        }
        else if (plan.nodeType === 'process') {
            node = createProcessNode(plan.metadata, plan.logicalParentId!);
            nodeIdMap['PROCESS_NODE_ID'] = node.id;
        }
        else if (plan.nodeType === 'sideProductCompound') {
            node = createSideProductCompoundNode(
                nodeIdMap['PROCESS_NODE_ID'],
                nodeIdMap['OUTFLOWS_COMPOUND_NODE_ID']
            );
            nodeIdMap['SIDE_PRODUCT_COMPOUND_NODE_ID'] = node.id;
        }

        if (node) {
            // Update logical parent ID if it's a placeholder
            if (node.data.logicalParentId === 'PROCESS_NODE_ID') {
                node.data.logicalParentId = nodeIdMap['PROCESS_NODE_ID'];
            }
            else if (node.data.logicalParentId === 'OUTFLOWS_COMPOUND_NODE_ID') {
                node.data.logicalParentId = nodeIdMap['OUTFLOWS_COMPOUND_NODE_ID'];
            }
            nodes.push(node);
        }
    });

    // Second pass: Create product and side product nodes
    plans.filter(p => ['product', 'sideProduct'].includes(p.nodeType)).forEach(plan => {
        if (!plan.productId) return; // Skip if no productId

        const productData = productDataMap[plan.productId];
        if (!productData) {
            console.error(`No product data found for ${plan.productId}`);
            return;
        }

        let node;

        if (plan.nodeType === 'product') {
            // Resolve logical parent ID
            let resolvedLogicalParentId = plan.logicalParentId;
            if (plan.logicalParentId === 'PROCESS_NODE_ID') {
                resolvedLogicalParentId = nodeIdMap['PROCESS_NODE_ID'];
            } else if (plan.logicalParentId === 'OUTFLOWS_COMPOUND_NODE_ID') {
                resolvedLogicalParentId = nodeIdMap['OUTFLOWS_COMPOUND_NODE_ID'];
            }

            // Resolve parent ID for visualization
            let resolvedParentId = plan.parentId;

            // Handle root outflows compound special case
            if (plan.parentId === 'ROOT_OUTFLOWS_COMPOUND_ID') {
                resolvedParentId = nodeIdMap['ROOT_OUTFLOWS_COMPOUND_ID'];
            } else if (plan.parentId === 'OUTFLOWS_COMPOUND_NODE_ID') {
                resolvedParentId = nodeIdMap['OUTFLOWS_COMPOUND_NODE_ID'];
            } else if (plan.parentId) {
                // Handle any other compound node references by ID
                resolvedParentId = nodeIdMap[plan.parentId] || resolvedParentId;
            }

            node = createProductNode(
                productData,
                plan.amount!,
                resolvedLogicalParentId ? resolvedLogicalParentId : '',
                plan.isRoot || false,
                resolvedParentId ? resolvedParentId : '',
            );
        }
        else if (plan.nodeType === 'sideProduct') {
            // Resolve logical parent ID
            if (plan.logicalParentId === 'SIDE_PRODUCT_COMPOUND_NODE_ID') {
                node = createSideProductNode(
                    productData,
                    plan.amount!,
                    nodeIdMap['PROCESS_NODE_ID'],
                    nodeIdMap['SIDE_PRODUCT_COMPOUND_NODE_ID']
                );
            }
        }

        if (node) {
            nodes.push(node);
        }
    });

    const finalNodes = nodes.map(node => {
        if (node.parentId) {
            return {
                ...node,
                extent: 'parent',
            };
        }
        return node;
    });

    return {
        nodes: finalNodes.map(node => {
            if (node.parentId && node.extent === undefined) {
                console.log(`Setting missing extent for node ${node.id} with parent ${node.parentId}`);
                return {
                    ...node,
                    extent: 'parent'
                };
            }
            return node;
        }),
        nodeIdMap
    };
}

/**
 * Creates edges between nodes based on their relationships and the nodeIdMap
 * @param nodes The newly created nodes
 * @param nodeIdMap Map of placeholder IDs to actual node IDs
 * @returns Array of edges connecting the nodes
 */
export function createEdges(nodes: InfluenceNode[], nodeIdMap: Record<string, string>): Edge[] {
    const edges: Edge[] = [];
    const processNodeId = nodeIdMap['PROCESS_NODE_ID'];
    const outflowsCompoundNodeId = nodeIdMap['OUTFLOWS_COMPOUND_NODE_ID'];

    // If we have a process node, create edges for process flow
    if (processNodeId) {
        const processNode = nodes.find(n => n.id === processNodeId);

        if (processNode) {
            // 1. Edge from parent product to process node
            // const logicalParentId = processNode.data.logicalParentId as string;
            // if (logicalParentId) {
            //     edges.push({
            //         id: `edge-${logicalParentId}-${processNodeId}`,
            //         source: logicalParentId,
            //         target: processNodeId,
            //         type: 'custom',
            //     });
            // }

            // 2. Edge from process node to outflows compound (main flow)
            if (outflowsCompoundNodeId) {
                edges.push({
                    id: `edge-${processNodeId}-${outflowsCompoundNodeId}`,
                    source: processNodeId,
                    target: outflowsCompoundNodeId,
                    type: 'custom',
                });
            }

            // 3. Edges from process to input products
            const inputProductNodes = nodes.filter(n =>
                n.type === 'productNode' &&
                n.data.logicalParentId === processNodeId
            );

            inputProductNodes.forEach(productNode => {
                edges.push({
                    id: `edge-${processNodeId}-${productNode.id}`,
                    source: processNodeId,
                    target: productNode.id,
                    type: 'custom',
                });
            });
        }
    }

    return edges;
}
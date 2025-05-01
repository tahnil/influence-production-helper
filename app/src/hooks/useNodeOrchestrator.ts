// hooks/useNodeOrchestrator.ts

import { useCallback } from 'react';
import { FlowAction } from '@/contexts/FlowContext';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import useProductImage from '@/hooks/useProductImage';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { createProductNodePlan } from '@/services/nodeStructurePlanner';
import { ProductData } from '@/types/influenceTypes';
import { realizePlans } from '@/utils/TreeVisualizer/nodeRealizationHelper';
import { createEdges } from "@/utils/TreeVisualizer/createEdges";

export function useNodeOrchestrator(dispatch: React.Dispatch<FlowAction>) {
    const { getProductDetails } = useProductDetails();
    const { getProcessesByProductId } = useProcessesByProductId();
    const { getProductImage } = useProductImage();

    // Fetch product data (reused by both flows)
    const fetchProductData = useCallback(async (productId: string): Promise<ProductData> => {
        try {
            const [productDetails, processesByProductId, image] = await Promise.all([
                getProductDetails(productId),
                getProcessesByProductId(productId),
                getProductImage(productId),
            ]);

            return {
                id: productId,
                productDetails,
                processesByProductId,
                image
            };
        } catch (error) {
            console.error(`Error fetching product data for ${productId}:`, error);
            throw error;
        }
    }, [getProductDetails, getProcessesByProductId, getProductImage]);

    // Create root product node
    const createRootProductNode = useCallback(async (
        productId: string,
        amount: number = 1,
        isRoot: boolean = true
    ) => {
        try {
            // console.log(`Creating root product node: productId=${productId}, amount=${amount}, isRoot=${isRoot}`);

            // 1. Fetch product data
            const productData = await fetchProductData(productId);

            // 2. Create node plan (now includes outflows compound for root nodes)
            const nodePlans = createProductNodePlan(productData, amount, isRoot);
            // console.log('Node plans created:', nodePlans);

            // 3. Realize node plans
            const { nodes, nodeIdMap } = realizePlans(nodePlans, { [productId]: productData });
            // console.log('Nodes realized:', nodes.map(n => ({
                // id: n.id,
                // type: n.type,
                // isRoot: n.data.isRoot,
                // parentId: n.parentId,
                // logicalParentId: n.data.logicalParentId
            // })));
            // console.log('Node ID map:', nodeIdMap);
            // console.log('Nodes before enhancement:', nodes);

            // 4. Create edges (if any needed for root structure)
            const edges = createEdges(nodes as InfluenceNode[], nodeIdMap);

            // 5. Find the root node ID (now it's the outflows compound)
            const rootOutflowsNodeId = nodeIdMap['ROOT_OUTFLOWS_COMPOUND_ID'] || nodes.find(n => n.type === 'outflowsCompoundNode')?.id || nodes[0].id;
            const rootProductNodeId = nodeIdMap['ROOT_PRODUCT_NODE_ID'] || nodes.find(n => n.type === 'productNode' && n.data.isRoot)?.id;

            // console.log(`Root outflows node ID: ${rootOutflowsNodeId}`);
            // console.log(`Root product node ID: ${rootProductNodeId}`);

            // 6. Make sure isRoot is set correctly
            // Enhanced nodes with extent explicitly set
            const enhancedNodes = nodes.map(node => {
                // Add debug logging
                if (node.parentId) {
                    // console.log(`Node ${node.id} (${node.type}) has parentId ${node.parentId}`);
                }

                // Set properties for nodes related to the root
                if (node.id === rootOutflowsNodeId || node.parentId === rootOutflowsNodeId) {
                    const enhanced = {
                        ...node,
                        data: {
                            ...node.data,
                            isRoot: true
                        }
                    };

                    // Explicitly set extent for nodes with a parentId
                    if (node.parentId) {
                        // console.log(`Setting extent: 'parent' for root-related node ${node.id}`);
                        enhanced.extent = 'parent';
                    }

                    return enhanced;
                }

                // For other nodes, ensure extent is set if they have a parentId
                if (node.parentId) {
                    return {
                        ...node,
                        extent: 'parent'
                    };
                }

                return node;
            });

            // 7. Dispatch created nodes
            // Use the outflows compound node as the rootNodeId since it's the true parent
            // in the hierarchy, but also track the root product node
            dispatch({
                type: 'ROOT_NODE_CREATED',
                payload: {
                    nodes: enhancedNodes as InfluenceNode[],
                    edges,
                    rootNodeId: rootOutflowsNodeId,
                    // rootProductNodeId // Add this if your FlowState needs it
                }
            });

            return true;
        } catch (error) {
            console.error('Error creating root product node:', error);
            dispatch({
                type: 'NODE_CREATION_FAILED',
                payload: { error: String(error) }
            });
            return false;
        }
    }, [fetchProductData, dispatch]);

    return {
        createRootProductNode,
    };
}
// hooks/useProcessNodeOrchestrator.ts

import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { FlowAction } from '@/contexts/FlowContext';
import useProcessDetails from '@/hooks/useProcessDetails';
import useInputsByProcessId from '@/hooks/useInputsByProcessId';
import useBuildingIcon from '@/hooks/useBuildingIcon';
import { findNodesToRemove, removeNodes } from '@/utils/TreeVisualizer/nodeRemovalHelper';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { createProcessNodePlan, NodePlan } from '@/services/nodeStructurePlanner';
import { createProcessNode, createProductNode, createSideProductCompoundNode, createSideProductNode, createOutflowsCompoundNode } from '@/services/nodeFactory';
import { InfluenceProcess, ProductData } from '@/types/influenceTypes';
import useProductDetails from './useInfluenceProductDetails';
import useProcessesByProductId from './useProcessesByProductId';
import useProductImage from './useProductImage';
import { useDagreConfig } from './useDagreConfig';
import { updateOutflowsCompoundDimensions } from '@/utils/TreeVisualizer/updateOutflowsCompoundDimensions';
import { createEdges } from '@/utils/TreeVisualizer/createEdges';

export function useProcessNodeOrchestrator(dispatch: React.Dispatch<FlowAction>) {
    const { getProcessDetails } = useProcessDetails();
    const { getInputsByProcessId } = useInputsByProcessId();
    const { getBuildingIcon } = useBuildingIcon();
    const { getProductDetails } = useProductDetails();
    const { getProcessesByProductId } = useProcessesByProductId();
    const { getProductImage } = useProductImage();
    const { dagreConfig } = useDagreConfig();

    // Add a dedicated product data fetching function
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

    const createProcessStructure = useCallback(async (
        processId: string,
        logicalParentId: string,
        logicalParentAmount: number,
        logicalParentProductId: string,
        currentNodes: InfluenceNode[],
        currentEdges: Edge[]
    ) => {
        try {
            // 1. Fetch all required data
            const processDetails = await getProcessDetails(processId) as InfluenceProcess;
            if (!processDetails) throw new Error('Failed to fetch process details');
            // console.log('[useProcessNodeOrchestrator] Process details:', processDetails);

            const inputProducts = await getInputsByProcessId(processId);
            // console.log('[useProcessNodeOrchestrator] Input products:', inputProducts);
            const buildingIcon = await getBuildingIcon(processDetails.buildingId);
            // console.log('[useProcessNodeOrchestrator] Building icon:', buildingIcon);
            // get parentId of the product node with given logicalParentId
            const mainOutflowNode = currentNodes.find(node => node.id === logicalParentId);
            // console.log('[useProcessNodeOrchestrator] Main outflow node:', mainOutflowNode);
            if (!mainOutflowNode) throw new Error(`Main outflow node with id ${logicalParentId} not found`);
            const outflowsCompoundId = mainOutflowNode.parentId!;
            // console.log('[useProcessNodeOrchestrator] Parent product ID:', outflowsCompoundId);

            // 2. Calculate process information
            const output = processDetails.outputs.find(o => o.productId === logicalParentProductId); // Identify the main outflow product
            const outputUnitsPerSR = output ? parseFloat(output.unitsPerSR) : 0;
            const totalRuns = logicalParentAmount / outputUnitsPerSR || 1;
            const totalDuration = totalRuns * parseFloat(processDetails.bAdalianHoursPerAction || '0');
            // log output, outputUnitsperSR, totalRuns and totalDuration in one statement to console
            // console.log(`[useProcessNodeOrchestrator] Output: ${output}, Units per SR: ${outputUnitsPerSR}, Total Runs: ${totalRuns}, Total Duration: ${totalDuration}`);

            // 3. Identify nodes to remove
            // Function looks if an existing process node is present and marks it and all its inflows for removal
            const nodesToRemove = findNodesToRemove(currentNodes, logicalParentId);

            // Initialize updatedNodes and updatedEdges outside the conditional block
            let updatedNodes = currentNodes;
            let updatedEdges = currentEdges;
            // console.log('[useProcessNodeOrchestrator] Current nodes and edges:', { currentNodes, currentEdges });

            if (nodesToRemove.length > 0) {
                // console.log(`[useProcessNodeOrchestrator] Found ${nodesToRemove.length} nodes to remove:`, nodesToRemove);

                // 4. Remove existing nodes and their edges
                const removalResult = removeNodes(currentNodes, currentEdges, nodesToRemove);
                updatedNodes = removalResult.updatedNodes;
                updatedEdges = removalResult.updatedEdges;

                // console.log('[useProcessNodeOrchestrator] Nodes and edges updated after removal:', { updatedNodes, updatedEdges });
            } else {
                // console.log('[useProcessNodeOrchestrator] No nodes to remove.');
            }

            // 5. Create node plans
            const processData = {
                processDetails,
                inputProducts,
                buildingIcon,
                totalRuns,
                totalDuration,
                mainOutflow: output,
                outflowsCompoundId,
                sideProducts: processDetails.outputs.filter(o => o.productId !== logicalParentProductId),
                hasSideProducts: processDetails.outputs.length > 1
            };
            // console.log('[useProcessNodeOrchestrator] Process data for node plans:', processData);
            const nodePlans = createProcessNodePlan(processData, logicalParentId);
            // console.log('[useProcessNodeOrchestrator] Node plans:', nodePlans);

            // 5. IMPORTANT: Fetch product data for all product nodes
            const productPlans = nodePlans.filter(p =>
                ['product', 'sideProduct'].includes(p.nodeType) && p.productId
            );

            const productDataMap: Record<string, ProductData> = {};

            // Fetch all product data in parallel
            await Promise.all(
                productPlans.map(async (plan) => {
                    if (plan.productId) {
                        productDataMap[plan.productId] = await fetchProductData(plan.productId);
                    }
                })
            );

            // 6. Create new nodes and edges
            const { nodes, nodeIdMap } = realizePlans(nodePlans, productDataMap);
            // console.log('[useProcessNodeOrchestrator] productDataMap:', productDataMap);
            // call creatEdges with nodes, nodeIdMap, and id of the main outflows compound node
            const edges = createEdges(nodes, nodeIdMap, outflowsCompoundId);

            // 8. Update state
            const preFinalNodes = [...updatedNodes, ...nodes];
            const finalEdges = [...updatedEdges, ...edges];
            // console.log('[useProcessNodeOrchestrator] Final nodes and edges being dispatched:', { preFinalNodes, finalEdges });

            // 9. After creating all nodes and before dispatching the state update
            if (processData.hasSideProducts && outflowsCompoundId) {
                // Update the dimensions of the outflows compound node to accommodate the new side product compound
                const finalNodes = updateOutflowsCompoundDimensions(
                    preFinalNodes as InfluenceNode[],
                    outflowsCompoundId
                );
                // console.log('[useProcessNodeOrchestrator | PROCESS_STRUCTURE_CREATED]');
                // Use the updated nodes array
                dispatch({
                    type: 'PROCESS_STRUCTURE_CREATED',
                    payload: {
                        nodes: finalNodes as InfluenceNode[],
                        edges: finalEdges,
                    }
                });

            } else {
                // Original dispatch without dimension updates
                const finalNodes = preFinalNodes;
                dispatch({
                    type: 'PROCESS_STRUCTURE_CREATED',
                    payload: {
                        nodes: finalNodes as InfluenceNode[],
                        edges: finalEdges,
                    }
                });

            }

            // console.log('[useProcessNodeOrchestrator] Nodes and edges updated after realization:', { nodes, edges });

            return true;
        } catch (error) {
            console.error('Error in process node creation:', error);
            dispatch({
                type: 'NODE_CREATION_FAILED',
                payload: { error: String(error) }
            });
            return false;
        }
    }, [getProcessDetails, getInputsByProcessId, getBuildingIcon, fetchProductData, dispatch]);

    return { createProcessStructure };
}

// Helper function to realize node plans with actual IDs
function realizePlans(plans: NodePlan[], productDataMap: Record<string, ProductData>) {
    const nodeIdMap: Record<string, string> = {};
    const nodes: InfluenceNode[] = [];

    // console.log('[useProcessNodeOrchestrator] Realizing node plans:', plans);

    // First pass: create process and compound nodes
    plans.filter(p => ['process', 'sideProductCompound', 'outflowsCompound'].includes(p.nodeType)).forEach(plan => {
        const id = generateUniqueId();

        // Store the ID using the plan's own ID if available, otherwise use the node type
        if (plan.id) {
            // For indexed IDs like "INPUT_COMPOUND_0", "INPUT_COMPOUND_1", etc.
            nodeIdMap[plan.id] = id;
        } else {
            // For singleton nodes like the main process
            nodeIdMap[plan.nodeType === 'process' ? 'PROCESS_NODE_ID' :
                plan.nodeType === 'sideProductCompound' ? 'SIDE_PRODUCT_COMPOUND_NODE_ID' :
                    'OUTFLOWS_COMPOUND_NODE_ID'] = id;
        }

        let node;
        if (plan.nodeType === 'process') {
            node = createProcessNode(plan.metadata, plan.logicalParentId!);
            // console.log('[useProcessNodeOrchestrator] Created process node:', node);
        } else if (plan.nodeType === 'sideProductCompound') {
            node = createSideProductCompoundNode(nodeIdMap['PROCESS_NODE_ID'], plan.parentId);
            // console.log('[useProcessNodeOrchestrator] Created side product compound node:', node);
            // console.log('[useProcessNodeOrchestrator] Set parenttId for side product compound node:', node.parentId);
        } else if (plan.nodeType === 'outflowsCompound') {
            const processId = plan.metadata?.processId ? nodeIdMap[plan.metadata.processId] : nodeIdMap['PROCESS_NODE_ID'];
            const isRoot = !!plan.metadata?.isRoot;

            node = createOutflowsCompoundNode(processId, isRoot);
            // console.log('[useProcessNodeOrchestrator] Created outflows compound node:', node);

        } else {
            console.error(`Unknown node type: ${plan.nodeType}`);
            return;
        }

        node.id = id;
        nodes.push(node);
    });

    // Second pass: create product and side product nodes
    plans.filter(p => ['product', 'sideProduct'].includes(p.nodeType)).forEach(plan => {
        if (!plan.productId) return; // Skip if no productId

        const productData = productDataMap[plan.productId];
        if (!productData) {
            console.error(`No product data found for ${plan.productId}`);
            return;
        }

        // Resolve logical parent ID - convert from placeholder to actual ID
        let resolvedLogicalParentId = plan.logicalParentId;
        if (plan.logicalParentId === 'PROCESS_NODE_ID') {
            resolvedLogicalParentId = nodeIdMap['PROCESS_NODE_ID'];
        }

        // Resolve parent ID - convert from placeholder to actual ID
        let resolvedParentId = plan.parentId;
        if (plan.parentId && nodeIdMap[plan.parentId]) {
            resolvedParentId = nodeIdMap[plan.parentId];
        }

        let node;
        if (plan.nodeType === 'product') {
            node = createProductNode(
                productData,
                plan.amount!,
                resolvedLogicalParentId!,
                plan.isRoot || false,
                resolvedParentId ? resolvedParentId : ''
            );
            // console.log('[useProcessNodeOrchestrator] Created product node:', node);
        } else {
            // console.log('[useProcessNodeOrchestrator] Creating side product node with nodeIdMap:', nodeIdMap);
            node = createSideProductNode(
                productData,
                plan.amount!,
                nodeIdMap['SIDE_PRODUCT_COMPOUND_NODE_ID'],
                nodeIdMap['PROCESS_NODE_ID'],
            );
            // console.log('[useProcessNodeOrchestrator] Created side product node:', node);
        }

        if (node) {
            nodes.push(node);
        }
    });

    // Third pass: Calculate dimensions for compound nodes based on their children
    const compoundNodes = nodes.filter(node =>
        node.type === 'sideProductCompoundNode' ||
        node.type === 'outflowsCompoundNode'
    );

    compoundNodes.forEach(compoundNode => {
        // Find all direct children of this compound node
        const children = nodes.filter(node => node.parentId === compoundNode.id);

        if (children.length === 0) {
            // If no children, set default dimensions
            compoundNode.width = 200;
            compoundNode.height = 100;
            // console.log(`[useProcessNodeOrchestrator] Set dimensions for compound node ${compoundNode.id}: width=200, height=100`);
            return;
        }

        // Calculate the bounding box that contains all children
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        // First gather measured dimensions if available, otherwise use default estimates
        children.forEach(child => {
            const childWidth = child.width ||
                (child.type === 'productNode' ? 300 :
                    child.type === 'processNode' ? 250 :
                        child.type === 'sideProductNode' ? 200 : 150);

            const childHeight = child.height ||
                (child.type === 'productNode' ? 290 :
                    child.type === 'processNode' ? 185 :
                        child.type === 'sideProductNode' ? 100 : 80);

            // Calculate positions relative to parent
            // Since we haven't positioned the nodes yet, we'll just stack them
            if (minX === Infinity) {
                // First child
                minX = 0;
                minY = 0;
                maxX = childWidth;
                maxY = childHeight;
            } else {
                // Subsequent children - stack horizontally with some padding
                maxX += 20 + childWidth; // 20px padding between nodes
                maxY = Math.max(maxY, childHeight);
            }
        });

        // Add padding around the compound node
        const padding = 40; // 20px padding on each side
        const width = maxX - minX + padding;
        const height = maxY - minY + padding;

        // Set measured dimensions on the compound node
        compoundNode.width = width;
        compoundNode.height = height;

        // console.log(`[useProcessNodeOrchestrator] Set dimensions for compound node ${compoundNode.id}: width=${width}, height=${height}`);
    });

    return { nodes, nodeIdMap };
}
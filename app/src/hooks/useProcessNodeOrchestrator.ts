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
import { createProcessNode, createProductNode, createSideProductCompoundNode, createSideProductNode } from '@/services/nodeFactory';
import { InfluenceProcess, ProductData } from '@/types/influenceTypes';
import useProductDetails from './useInfluenceProductDetails';
import useProcessesByProductId from './useProcessesByProductId';
import useProductImage from './useProductImage';

export function useProcessNodeOrchestrator(dispatch: React.Dispatch<FlowAction>) {
    const { getProcessDetails } = useProcessDetails();
    const { getInputsByProcessId } = useInputsByProcessId();
    const { getBuildingIcon } = useBuildingIcon();
    const { getProductDetails } = useProductDetails();
    const { getProcessesByProductId } = useProcessesByProductId();
    const { getProductImage } = useProductImage();

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
        parentAmount: number,
        parentProductId: string,
        currentNodes: InfluenceNode[],
        currentEdges: Edge[]
    ) => {
        try {
            // 1. Fetch all required data
            const processDetails = await getProcessDetails(processId) as InfluenceProcess;
            if (!processDetails) throw new Error('Failed to fetch process details');
            console.log('[useProcessNodeOrchestrator] Process details:', processDetails);

            const inputProducts = await getInputsByProcessId(processId);
            console.log('[useProcessNodeOrchestrator] Input products:', inputProducts);
            const buildingIcon = await getBuildingIcon(processDetails.buildingId);
            // console.log('[useProcessNodeOrchestrator] Building icon:', buildingIcon);

            // 2. Calculate process information
            const output = processDetails.outputs.find(o => o.productId === parentProductId);
            const outputUnitsPerSR = output ? parseFloat(output.unitsPerSR) : 0;
            const totalRuns = parentAmount / outputUnitsPerSR || 1;
            const totalDuration = totalRuns * parseFloat(processDetails.bAdalianHoursPerAction || '0');
            // log output, outputUnitsperSR, totalRuns and totalDuration in one statement to console
            console.log(`[useProcessNodeOrchestrator] Output: ${output}, Units per SR: ${outputUnitsPerSR}, Total Runs: ${totalRuns}, Total Duration: ${totalDuration}`);

            // 3. Identify nodes to remove
            const nodesToRemove = findNodesToRemove(currentNodes, logicalParentId);
            console.log('[useProcessNodeOrchestrator] Nodes to remove:', nodesToRemove);

            // 4. Remove existing nodes and their edges
            const { updatedNodes, updatedEdges } = removeNodes(
                currentNodes,
                currentEdges,
                nodesToRemove
            );

            // 5. Create node plans
            const processData = {
                processDetails,
                inputProducts,
                buildingIcon,
                totalRuns,
                totalDuration,
                mainOutflow: output,
                sideProducts: processDetails.outputs.filter(o => o.productId !== parentProductId),
                hasSideProducts: processDetails.outputs.length > 1
            };
            console.log('[useProcessNodeOrchestrator] Process data:', processData);
            const nodePlans = createProcessNodePlan(processData, logicalParentId);
            console.log('[useProcessNodeOrchestrator] Node plans:', nodePlans);

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
            const edges = createEdges(nodes, nodeIdMap);

            // 8. Update state
            dispatch({
                type: 'PROCESS_STRUCTURE_CREATED',
                payload: {
                    nodes: [...updatedNodes, ...nodes],
                    edges: [...updatedEdges, ...edges],
                }
            });

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

    // First pass: create process and compound nodes
    plans.filter(p => ['process', 'sideProductCompound'].includes(p.nodeType)).forEach(plan => {
        const id = generateUniqueId();
        nodeIdMap[plan.nodeType === 'process' ? 'PROCESS_NODE_ID' : 'NONE_BUT_LATER_OUTFLOWS_COMPOUND_NODE_ID'] = id;

        let node;
        if (plan.nodeType === 'process') {
            node = createProcessNode(plan.metadata, plan.logicalParentId!);
            console.log('[useProcessNodeOrchestrator] Created process node:', node);
        } else {
            node = createSideProductCompoundNode(nodeIdMap['PROCESS_NODE_ID']);
            console.log('[useProcessNodeOrchestrator] Created side product compound node:', node);
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

        let node;
        if (plan.nodeType === 'product') {
            node = createProductNode(
                productData, 
                plan.amount!, 
                nodeIdMap['PROCESS_NODE_ID']
            );
            console.log('[useProcessNodeOrchestrator] Created product node:', node);
        } else {
            node = createSideProductNode(
                productData,
                plan.amount!,
                nodeIdMap['PROCESS_NODE_ID'],
                nodeIdMap['SIDE_PRODUCT_COMPOUND_NODE_ID']
            );
            console.log('[useProcessNodeOrchestrator] Created side product node:', node);
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
    const compoundNodeId = nodeIdMap['NONE_BUT_LATER_OUTFLOWS_COMPOUND_NODE_ID'];
    const processNode = nodes.find(n => n.id === processNodeId);
    
    if (!processNode) return edges;

    const logicalParentId = processNode.data.logicalParentId as string;

    // Find node types
    const productNodes = nodes.filter(n =>
        n.type === 'productNode' &&
        n.data.logicalParentId === processNodeId
    );
    // const sideProductNodes = nodes.filter(n => n.type === 'sideProductNode');
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

    // 3. Single connection between process and side product compound
    if (sideProductCompoundNode) {
        edges.push({
            id: `edge-${compoundNodeId}-${processNodeId}`,
            source: compoundNodeId,
            sourceHandle: `sideProductCompound-source-${compoundNodeId}`,
            target: processNodeId,
            targetHandle: `target-${processNodeId}`,
            type: 'custom',
            data: { isSideProductConnection: true }
        });
        console.log('[useProcessNodeOrchestrator] Created edge between process node and side product compound node', edges);
    } else {
        console.log('[useProcessNodeOrchestrator] No side product compound node found');
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
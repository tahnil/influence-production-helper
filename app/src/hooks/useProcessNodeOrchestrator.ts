// hooks/useProcessNodeOrchestrator.ts
import { useCallback } from 'react';
import { Edge } from '@xyflow/react';
import { FlowAction } from '@/contexts/FlowContext';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { updateOutflowsCompoundDimensions } from '@/utils/TreeVisualizer/updateOutflowsCompoundDimensions';

// Import services
import NodePlanningService from '@/services/NodePlanningService';
import NodeRemovalService from '@/services/NodeRemovalService';
import NodeRealizationService from '@/services/NodeRealizationService';
import EdgeCreationService from '@/services/EdgeCreationService';
import ProductDataService from '@/services/ProductDataService';
import ProcessDataService from '@/services/ProcessDataService';

// Import hooks for data fetching
import useProcessDetails from '@/hooks/useProcessDetails';
import useInputsByProcessId from '@/hooks/useInputsByProcessId';
import useBuildingIcon from '@/hooks/useBuildingIcon';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import useProductImage from '@/hooks/useProductImage';

export function useProcessNodeOrchestrator(dispatch: React.Dispatch<FlowAction>) {
  // Data fetching hooks - kept in the hook for React Context integration
  const { getProcessDetails } = useProcessDetails();
  const { getInputsByProcessId } = useInputsByProcessId();
  const { getBuildingIcon } = useBuildingIcon();
  const { getProductDetails } = useProductDetails();
  const { getProcessesByProductId } = useProcessesByProductId();
  const { getProductImage } = useProductImage();

  const createProcessStructure = useCallback(async (
    processId: string,
    logicalParentId: string,
    logicalParentAmount: number,
    logicalParentProductId: string,
    currentNodes: InfluenceNode[],
    currentEdges: Edge[]
  ) => {
    try {
      // 1. Find the parent compound node if exists
      const mainOutflowNode = currentNodes.find(node => node.id === logicalParentId);
      console.log('[useProcessNodeOrchestrator] Main outflow node:', mainOutflowNode);
      if (!mainOutflowNode) {
        throw new Error(`Main outflow node with id ${logicalParentId} not found`);
      }
      const outflowsCompoundId = mainOutflowNode.parentId!;
      // console.log('[useProcessNodeOrchestrator] Outflows compound ID:', outflowsCompoundId);

      // 2. Fetch process data using the service
      const processData = await ProcessDataService.fetchProcessData(
        processId,
        logicalParentProductId,
        logicalParentAmount,
        {
          getProcessDetails,
          getInputsByProcessId,
          getBuildingIcon
        },
        outflowsCompoundId
      );

      // 3. Remove existing nodes if needed
      const nodesToRemove = NodeRemovalService.findNodesToRemove(currentNodes, logicalParentId);
      // console.log('[useProcessNodeOrchestrator] Nodes to remove:', nodesToRemove);
      const { updatedNodes, updatedEdges } = nodesToRemove.length > 0
        ? NodeRemovalService.removeNodes(currentNodes, currentEdges, nodesToRemove)
        : { updatedNodes: currentNodes, updatedEdges: currentEdges };

      // 4. Create node plans
      const nodePlans = NodePlanningService.createProcessNodePlan(processData, logicalParentId);
      // console.log('[useProcessNodeOrchestrator] Node plans:', nodePlans);

      // 5. Fetch product data for all products in the plans
      const productDataMap = await ProductDataService.fetchProductDataMap(
        nodePlans,
        { getProductDetails, getProcessesByProductId, getProductImage }
      );
      // console.log('[useProcessNodeOrchestrator] Product data map:', productDataMap);

      // 6. Create nodes from plans
      const { nodes, nodeIdMap } = NodeRealizationService.realizePlans(nodePlans, productDataMap);
      // console.log('[useProcessNodeOrchestrator] Created nodes from plan:', nodes);
      // console.log('[useProcessNodeOrchestrator] …by using node ID map:', nodeIdMap);

      // 7. Create edges between nodes
      const edges = EdgeCreationService.createEdges(nodes as InfluenceNode[], nodeIdMap, outflowsCompoundId);

      // 8. Prepare final nodes and edges
      const preFinalNodes = [...updatedNodes, ...nodes];
      const finalEdges = [...updatedEdges, ...edges];

      // 9. Update compound node dimensions if needed
      let finalNodes = preFinalNodes;
      if (processData.hasSideProducts && outflowsCompoundId) {
        finalNodes = updateOutflowsCompoundDimensions(
          preFinalNodes as InfluenceNode[],
          outflowsCompoundId
        );
      }

      // 10. Dispatch the state update
      dispatch({
        type: 'PROCESS_STRUCTURE_CREATED',
        payload: {
          nodes: finalNodes as InfluenceNode[],
          edges: finalEdges,
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
  }, [
    getProcessDetails, 
    getInputsByProcessId, 
    getBuildingIcon, 
    getProductDetails, 
    getProcessesByProductId, 
    getProductImage, 
    dispatch
  ]);

  return { createProcessStructure };
}
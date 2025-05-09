// hooks/useProcessNodeOrchestrator.ts
import { useCallback } from 'react';
import { Edge } from '@xyflow/react';
import { FlowAction } from '@/contexts/FlowContext';
import { InfluenceNode } from '@/types/reactFlowTypes';

// Import services
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
import NodePlanningService from '@/services/NodePlanningService';
import NodeOrchestratorService from '@/services/NodeOrchestratorService';

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
      if (!mainOutflowNode) {
        throw new Error(`Main outflow node with id ${logicalParentId} not found`);
      }
      const outflowsCompoundId = mainOutflowNode.parentId;

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

      // 3. Create plans to determine product data requirements
      const tempPlans = NodePlanningService.createProcessNodePlan(processData, logicalParentId);

      // 4. Fetch product data for all products in the plans
      const productDataMap = await ProductDataService.fetchProductDataMap(
        tempPlans,
        { getProductDetails, getProcessesByProductId, getProductImage }
      );

      // 5. Use NodeOrchestratorService to create the process structure
      const { nodes, edges, nodePlans } = NodeOrchestratorService.createProcessStructure(
        logicalParentId,
        processData,
        productDataMap,
        currentNodes,
        currentEdges,
      );
      
      // 6. Dispatch the state update
      dispatch({
        type: 'PROCESS_STRUCTURE_CREATED',
        payload: {
          nodes: nodes as InfluenceNode[],
          edges: edges,
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
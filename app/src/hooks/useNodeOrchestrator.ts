// hooks/useNodeOrchestrator.ts
import { useCallback } from 'react';
import { FlowAction } from '@/contexts/FlowContext';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import useProductImage from '@/hooks/useProductImage';
import NodeOrchestratorService from '@/services/NodeOrchestratorService';
import ProductDataFetchingService from '@/services/ProductDataFecthingService';

export function useNodeOrchestrator(dispatch: React.Dispatch<FlowAction>) {
  // Data fetching hooks
  const { getProductDetails } = useProductDetails();
  const { getProcessesByProductId } = useProcessesByProductId();
  const { getProductImage } = useProductImage();

  // Main function to create a root product node
  const createRootProductNode = useCallback(async (
    productId: string,
    amount: number = 1,
    isRoot: boolean = true
  ) => {
    try {
      // 1. Fetch product data using the service
      const productData = await ProductDataFetchingService.fetchProductData(
        productId,
        { getProductDetails, getProcessesByProductId, getProductImage }
      );

      // 2. Validate product data
      ProductDataFetchingService.validateProductData(productId, productData);

      // 3. Use NodeOrchestratorService to create the node structure
      // This service will handle BOTH node plans and node creation internally
      const { nodes, edges, rootNodeId, nodePlans } = NodeOrchestratorService.createRootNodeStructure(
        productData,
        amount,
        isRoot
      );

      console.log('NodeOrchestratorService.createRootNodeStructure:', { nodes, edges, rootNodeId, nodePlans });

      // 4. Dispatch the node creation action
      dispatch({
        type: 'ROOT_NODE_CREATED',
        payload: {
          nodes,
          edges,
          rootNodeId,
          nodePlans
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
  }, [getProductDetails, getProcessesByProductId, getProductImage, dispatch]);

  return {
    createRootProductNode,
  };
}
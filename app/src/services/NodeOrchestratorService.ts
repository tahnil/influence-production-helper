// services/NodeOrchestratorService.ts
import { ProductData } from '@/types/influenceTypes';
import { Edge } from '@xyflow/react';
import { InfluenceNode } from '@/types/reactFlowTypes';
import NodePlanningService from './NodePlanningService';
import NodeRealizationService from './NodeRealizationService';
import EdgeCreationService from './EdgeCreationService';

export const NodeOrchestratorService = {
  /**
   * Creates the initial root node structure for a production chain
   * @param productData Data for the root product
   * @param amount The desired amount of the product
   * @param isRoot Whether this should be marked as the root node (typically true)
   * @returns Object containing nodes, edges, and the root node ID
   */
  createRootNodeStructure(
    productData: ProductData,
    amount: number = 1,
    isRoot: boolean = true
  ): { nodes: InfluenceNode[], edges: Edge[], rootNodeId: string } {
    // 1. Create node plans using the planning service
    const nodePlans = NodePlanningService.createProductNodePlan(productData, amount, isRoot);

    // 2. Realize the plans into actual nodes
    const { nodes, nodeIdMap } = NodeRealizationService.realizePlans(
      nodePlans, 
      { [productData.productDetails.id]: productData }
    );
    
    // 3. Create edges between nodes
    const edges = EdgeCreationService.createEdges(nodes as InfluenceNode[], nodeIdMap);
    
    // 4. Determine the root node ID (usually the outflows compound)
    const rootOutflowsNodeId = nodeIdMap['ROOT_OUTFLOWS_COMPOUND_ID'] || 
                             nodes.find(n => n.type === 'outflowsCompoundNode')?.id || 
                             nodes[0].id;
    
    // 5. Ensure all nodes with a parentId have the extent property set
    const enhancedNodes = nodes.map(node => {
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
    
    return { 
      nodes: enhancedNodes as InfluenceNode[], 
      edges,
      rootNodeId: rootOutflowsNodeId
    };
  },
  
  /**
   * Validates product data exists and meets requirements
   * @param productId The product ID to validate
   * @param productData The product data to validate
   * @throws Error if validation fails
   */
  validateProductData(productId: string, productData: ProductData | null): void {
    if (!productData) {
      throw new Error(`Product data for ID ${productId} is missing or invalid`);
    }
    
    if (!productData.productDetails) {
      throw new Error(`Product details for ID ${productId} are missing`);
    }
    
    if (!productData.image) {
      throw new Error(`Product image for ID ${productId} is missing`);
    }
  }
};

export default NodeOrchestratorService;
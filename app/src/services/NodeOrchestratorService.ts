// services/NodeOrchestratorService.ts
import { ProductData } from '@/types/influenceTypes';
import { Edge } from '@xyflow/react';
import { InfluenceNode } from '@/types/reactFlowTypes';
import NodePlanningService from './NodePlanningService';
import NodeRealizationService from './NodeRealizationService';
import EdgeCreationService from './EdgeCreationService';
import { NodePlanMappingService } from './NodePlanMappingService';
import { OutflowsCompoundNodeData } from '@/components/TreeVisualizer/OutflowsCompoundNode';
import { NodePlan } from '@/types/nodePlanTypes';

export const NodeOrchestratorService = {
  /**
   * Creates the initial root node structure for a production chain
   * @param productData Data for the root product
   * @param amount The desired amount of the product
   * @param isRoot Whether this should be marked as the root node (typically true)
   * @returns Object containing nodes, edges, nodePlans, and the root node ID
   */
  createRootNodeStructure(
    productData: ProductData,
    amount: number = 1,
    isRoot: boolean = true
  ): {
    nodes: InfluenceNode[],
    edges: Edge[],
    rootNodeId: string,
    nodePlans: NodePlan[],
  } {
    // 1. Create node plans using the planning service
    let nodePlans = NodePlanningService.createProductNodePlan(productData, amount, isRoot);

    // 2. Ensure all plans have unique IDs
    nodePlans = NodePlanningService.ensurePlanIds(nodePlans);

    // Store original plan IDs before realization
    const planIds = nodePlans.map(plan => plan.id);

    // 3. Realize the plans into actual nodes
    const { nodes, nodeIdMap } = NodeRealizationService.realizePlans(
      nodePlans,
      { [productData.productDetails.id]: productData }
    );

    // 4. Create edges between nodes
    const edges = EdgeCreationService.createEdges(nodes as InfluenceNode[], nodeIdMap);

    // 5. Determine the root node ID (usually the outflows compound)
    // First try using the nodeIdMap
    let rootOutflowsNodeId = nodeIdMap['ROOT_OUTFLOWS_COMPOUND_ID'];

    // If that fails, try to find the outflow compound node directly
    if (!rootOutflowsNodeId) {
      const outflowsCompoundNode = nodes.find(n =>
        n.type === 'outflowsCompoundNode' &&
        ((n.data as OutflowsCompoundNodeData)?.isRoot === true)
      );

      if (outflowsCompoundNode) {
        rootOutflowsNodeId = outflowsCompoundNode.id;
      } else {
        // Last resort - use any outflows compound node
        const anyOutflowsCompound = nodes.find(n => n.type === 'outflowsCompoundNode');
        if (anyOutflowsCompound) {
          rootOutflowsNodeId = anyOutflowsCompound.id;
        } else {
          // If we still can't find an outflows compound, use the first node
          rootOutflowsNodeId = nodes[0]?.id;
        }
      }
    }

    // 6. Establish mappings between node plans and realized nodes
    this.establishNodePlanMappings(nodePlans, nodes, nodeIdMap);

    // 7. Ensure all nodes with a parentId have the extent property set
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

    // 8. Annotate node plans with their realized node IDs
    const annotatedPlans = nodePlans.map(plan => {
      // Find the corresponding node ID
      const nodeId = plan.id ? NodePlanMappingService.getNodeId(plan.id) : undefined;

      return {
        ...plan,
        metadata: {
          ...plan.metadata,
          realizedNodeId: nodeId
        }
      };
    });

    return {
      nodes: enhancedNodes as InfluenceNode[],
      edges,
      rootNodeId: rootOutflowsNodeId,
      nodePlans: annotatedPlans
    };
  },

  /**
   * Establishes mappings between node plans and realized nodes
   * @param plans The node plans
   * @param nodes The realized nodes
   * @param nodeIdMap Mapping of placeholder IDs to actual node IDs
   */
  establishNodePlanMappings(
    plans: NodePlan[],
    nodes: any[],
    nodeIdMap: Record<string, string>
  ): void {
    // Clear existing mappings to avoid conflicts
    NodePlanMappingService.clearMappings();

    // Establish mappings based on metadata and nodeIdMap
    plans.forEach(plan => {
      if (!plan.id) return; // Skip plans without IDs

      // Find the corresponding node ID through various means
      let nodeId: string | undefined;

      // If the plan has metadata with an originalId that maps to a node ID
      if (plan.metadata?.originalId && nodeIdMap[plan.metadata.originalId]) {
        nodeId = nodeIdMap[plan.metadata.originalId];
      }

      // For special node types with known placeholder IDs
      else if (plan.nodeType === 'outflowsCompound' && plan.isRoot) {
        nodeId = nodeIdMap['ROOT_OUTFLOWS_COMPOUND_ID'];
      }
      else if (plan.nodeType === 'process') {
        nodeId = nodeIdMap['PROCESS_NODE_ID'];
      }
      else if (plan.nodeType === 'sideProductCompound') {
        nodeId = nodeIdMap['SIDE_PRODUCT_COMPOUND_NODE_ID'];
      }

      // If we found a node ID, register the mapping
      if (nodeId) {
        NodePlanMappingService.registerMapping(plan.id, nodeId);
      }
    });
  },

  /**
   * Updates node plans when a process is changed
   * @param currentPlans Current node plans
   * @param parentNodeId ID of the parent node
   * @param processId ID of the new process
   * @returns Updated node plans
   */
  updateProcessInPlans(
    currentPlans: NodePlan[],
    parentNodeId: string,
    processId: string
  ): NodePlan[] {
    // Find the plan corresponding to the parent node
    const parentPlanId = NodePlanMappingService.getPlanId(parentNodeId);
    if (!parentPlanId) return currentPlans;

    // Find the process plan that needs to be replaced
    const processPlans = currentPlans.filter(plan =>
      plan.nodeType === 'process' &&
      plan.logicalParentId === parentPlanId
    );

    if (processPlans.length === 0) return currentPlans;

    // Remove the old process plan and its related plans
    if (!processPlans[0].id) return currentPlans;
    let updatedPlans = NodePlanningService.removePlanAndRelated(
      currentPlans,
      processPlans[0].id
    );

    // Create new process plans (this would typically be done via NodePlanningService)
    // This is a placeholder - in practice you'd create proper plans
    const newProcessPlan: NodePlan = {
      id: NodePlanningService.generatePlanId(),
      nodeType: 'process',
      processId,
      logicalParentId: parentPlanId,
      metadata: {
        originalId: NodePlanningService.generatePlanId()
      }
    };

    // Add the new plan
    updatedPlans = [...updatedPlans, newProcessPlan];

    return updatedPlans;
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
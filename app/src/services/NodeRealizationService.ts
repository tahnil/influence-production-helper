// services/NodeRealizationService.ts
import { generateUniqueId } from '@/utils/generateUniqueId';
import { createProcessNode, createProductNode, createSideProductNode, 
         createSideProductCompoundNode, createOutflowsCompoundNode } from '@/services/nodeFactory';
import { ProductData } from '@/types/influenceTypes';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { NodePlan } from '@/types/nodePlanTypes';

export const NodeRealizationService = {
  /**
   * Converts abstract node plans into actual React Flow nodes
   * @param plans Array of node plans
   * @param productDataMap Map of product IDs to product data
   * @returns Object containing the created nodes and a map of placeholder IDs to actual node IDs
   */
  realizePlans(plans: NodePlan[], productDataMap: Record<string, ProductData>) {
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
          plan.parentId ? nodeIdMap[plan.parentId] || plan.parentId : undefined
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
        node = createSideProductNode(
          productData,
          plan.amount!,
          nodeIdMap['SIDE_PRODUCT_COMPOUND_NODE_ID'],
          nodeIdMap['PROCESS_NODE_ID']
        );
      }

      if (node) {
        nodes.push(node);
      }
    });

    // Ensure all nodes with parents have extent set correctly
    const finalNodes = nodes.map(node => {
      if (node.parentId && node.extent === undefined) {
        return {
          ...node,
          extent: 'parent'
        };
      }
      return node;
    });

    return { nodes: finalNodes, nodeIdMap };
  }
};

export default NodeRealizationService;
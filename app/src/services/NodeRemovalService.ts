// services/NodeRemovalService.ts
import { InfluenceNode } from '@/types/reactFlowTypes';
import { Edge } from '@xyflow/react';

export const NodeRemovalService = {
  /**
   * Finds all nodes that should be removed when changing a process for a given parent node
   * @param nodes All current nodes
   * @param logicalParentId ID of the parent node whose process is being changed
   * @returns Array of node IDs that should be removed
   */
  findNodesToRemove(nodes: InfluenceNode[], logicalParentId: string): string[] {
    const nodesToRemove = new Set<string>();

    // STEP 1: Find the process nodes directly connected to the logical parent
    // These are process nodes whose logical parent is the product we're replacing the process for
    const processNodes = nodes.filter(
      node => node.type === 'processNode' && node.data.logicalParentId === logicalParentId
    );

    // STEP 2: For each process node that needs to be removed
    for (const processNode of processNodes) {
      // Add the process node itself
      nodesToRemove.add(processNode.id);

      // Find all compound nodes that are direct descendants (physical or logical) of this process
      const relatedCompounds = nodes.filter(node =>
        (node.type === 'outflowsCompoundNode' || node.type === 'sideProductCompoundNode') &&
        // Check if this compound's logical parent is the process node
        (node.data.logicalParentId === processNode.id)
      );

      // Add all related compounds
      relatedCompounds.forEach(node => nodesToRemove.add(node.id));

      // STEP 3: Find all product nodes that have this process as their logical parent
      // These are the input products for the process
      const inputProductNodes = nodes.filter(node =>
        node.type === 'productNode' && node.data.logicalParentId === processNode.id
      );

      inputProductNodes.forEach(node => nodesToRemove.add(node.id));
    }

    // STEP 4: Find the parent outflows compound that contains the product node
    const productNode = nodes.find(node => node.id === logicalParentId);
    if (productNode && productNode.parentId) {
      const outflowsCompoundId = productNode.parentId;

      // Find all side product compounds in the same outflows compound
      const sideProductCompounds = nodes.filter(node =>
        node.type === 'sideProductCompoundNode' &&
        node.parentId === outflowsCompoundId
      );

      // Add all of these side product compounds
      sideProductCompounds.forEach(node => {
        nodesToRemove.add(node.id);

        // Find and add all children of each side product compound
        const sideProducts = nodes.filter(child => child.parentId === node.id);
        sideProducts.forEach(sideProduct => nodesToRemove.add(sideProduct.id));
      });
    }

    // STEP 5: Walk the node hierarchy to find all orphaned nodes
    const pendingRemoval = Array.from(nodesToRemove);
    let additionalRemoved = true;

    // Keep finding child nodes until no more are found
    while (additionalRemoved) {
      additionalRemoved = false;

      // Look for nodes whose parent is scheduled for removal
      for (const node of nodes) {
        if (!nodesToRemove.has(node.id) &&
          ((node.parentId && nodesToRemove.has(node.parentId)) ||
            (typeof node.data.logicalParentId === 'string' && nodesToRemove.has(node.data.logicalParentId)))) {
          nodesToRemove.add(node.id);
          additionalRemoved = true;
        }
      }
    }

    return Array.from(nodesToRemove);
  },

  /**
   * Removes nodes and their associated edges from the graph
   * @param nodes All current nodes
   * @param edges All current edges
   * @param nodesToRemove IDs of nodes to remove
   * @returns Updated arrays of nodes and edges
   */
  removeNodes(
    nodes: InfluenceNode[],
    edges: Edge[],
    nodesToRemove: string[]
  ): { updatedNodes: InfluenceNode[], updatedEdges: Edge[] } {
    const nodesToRemoveSet = new Set(nodesToRemove);

    // Step 1: Remove the nodes
    const updatedNodes = nodes.filter(node => !nodesToRemoveSet.has(node.id));

    // Step 2: Clean up references in remaining nodes
    const cleanedNodes = updatedNodes.map(node => {
      // Clone node to avoid modifying the original
      let updatedNode = { ...node };

      // Clean up parentId references
      if (updatedNode.parentId && nodesToRemoveSet.has(updatedNode.parentId)) {
        updatedNode.parentId = undefined;
        updatedNode.extent = undefined;
      }

      // Clean up logicalParentId references
      if (
        typeof updatedNode.data.logicalParentId === 'string' &&
        nodesToRemoveSet.has(updatedNode.data.logicalParentId)
      ) {
        updatedNode.data = {
          ...updatedNode.data,
          logicalParentId: undefined
        };
      }

      // Clean up inflowIds references
      if (Array.isArray(updatedNode.data.inflowIds)) {
        updatedNode.data = {
          ...updatedNode.data,
          inflowIds: updatedNode.data.inflowIds.filter(id => !nodesToRemoveSet.has(id))
        };
      }

      // Clean up outflowIds references
      if (Array.isArray(updatedNode.data.outflowIds)) {
        updatedNode.data = {
          ...updatedNode.data,
          outflowIds: updatedNode.data.outflowIds.filter(id => !nodesToRemoveSet.has(id))
        };
      }

      // Clean up ancestorIds for side product nodes
      if (updatedNode.type === 'sideProductNode' && Array.isArray(updatedNode.data.ancestorIds)) {
        updatedNode.data = {
          ...updatedNode.data,
          ancestorIds: updatedNode.data.ancestorIds.filter(id => !nodesToRemoveSet.has(id))
        };
      }

      return updatedNode;
    });

    // Step 3: Remove any edges that connect to removed nodes
    const updatedEdges = edges.filter(edge =>
      !nodesToRemoveSet.has(edge.source) && !nodesToRemoveSet.has(edge.target)
    );

    return {
      updatedNodes: cleanedNodes,
      updatedEdges
    };
  }
};

export default NodeRemovalService;
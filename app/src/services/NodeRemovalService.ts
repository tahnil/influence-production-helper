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
    const nodesToRemove: string[] = [];

    // STEP 1: Find compound nodes to remove

    // Find existing SideProductCompound nodes with the same source process
    const existingSideProductCompoundNodes = nodes.filter(
      (node) => node.type === 'sideProductCompoundNode' &&
        node.data.processId &&
        nodes.find(n => n.id === node.data.processId)?.data?.logicalParentId === logicalParentId
    );

    // Add compound nodes and their children to removal list
    existingSideProductCompoundNodes.forEach(existingSideProductCompoundNode => {
      nodesToRemove.push(existingSideProductCompoundNode.id);

      // Find and add all child nodes of the sideProductCompound
      nodes.forEach(node => {
        if (node.parentId === existingSideProductCompoundNode.id) {
          nodesToRemove.push(node.id);
        }
      });
    });

    // Find existing OutflowsCompound nodes with the same source process
    const existingOutflowsCompoundNodes = nodes.filter(
      (node) => node.type === 'outflowsCompoundNode' &&
        node.data.processId &&
        nodes.find(n => n.id === node.data.processId)?.data?.logicalParentId === logicalParentId
    );

    // Add OutflowsCompound nodes to removal list
    existingOutflowsCompoundNodes.forEach(existingOutflowsCompoundNode => {
      nodesToRemove.push(existingOutflowsCompoundNode.id);
    });

    // STEP 2: Find process nodes and their inputs
    const existingProcessNodes = nodes.filter(
      (node) => node.type === 'processNode' &&
        node.data.logicalParentId === logicalParentId
    );

    // Add process nodes and their input nodes to removal list
    existingProcessNodes.forEach(processNode => {
      nodesToRemove.push(processNode.id);

      // Find and add all input product nodes of this process
      nodes.forEach(node => {
        if (node.data.logicalParentId === processNode.id) {
          nodesToRemove.push(node.id);
        }
      });
    });

    return nodesToRemove;
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
    // Remove nodes
    const updatedNodes = nodes.filter(
      (node) => !nodesToRemove.includes(node.id)
    );

    // Clean up parentId references for OutflowsCompound children
    nodes.forEach(node => {
      const parent = nodes.find(n => n.id === node.parentId);
      if (parent?.type === 'outflowsCompoundNode' && nodesToRemove.includes(parent.id)) {
        node.parentId = undefined;
      }
    });

    // Remove connected edges
    const updatedEdges = edges.filter(
      (edge) => !nodesToRemove.includes(edge.source) && !nodesToRemove.includes(edge.target)
    );

    return { updatedNodes, updatedEdges };
  }
};

export default NodeRemovalService;
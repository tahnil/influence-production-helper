import React, { useCallback } from 'react';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import { Edge } from '@xyflow/react';
import { FlowAction } from '@/contexts/FlowContext';
import { ProductNode } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNode } from '@/components/TreeVisualizer/ProcessNode';
import { CompoundNode } from '@/components/TreeVisualizer/CompoundNode';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { SideProductNode } from '@/components/TreeVisualizer/SideProductNode';

interface ProcessNodeCreationResult {
  compoundNode: CompoundNode;
  processNode: ProcessNode;
  productNodes: ProductNode[];
  sideProductNodes: SideProductNode[];
  edges: Edge[];
  logicalParentId: string;
}

export function useProcessNodeCreation(dispatch: React.Dispatch<FlowAction>) {
  const { buildProcessNode } = useProcessNodeBuilder();

  return useCallback(async (
    processId: string,
    logicalParentId: string,
    logicalParentIdAmount: number,
    logicalParentIdProductId: string
  ): Promise<ProcessNodeCreationResult | null> => {
    try {
      if (!processId) {
        throw new Error('Process ID is undefined');
      }
      if (!logicalParentId) {
        throw new Error('Parent Node ID is undefined');
      }

      console.log('[useProcessNodeCreation] building process node');

      // Use the existing buildProcessNode utility
      const result = await buildProcessNode(
        processId,
        logicalParentId,
        logicalParentIdAmount,
        logicalParentIdProductId,
        // Callback for process selection
        (processId: string, nodeId: string) => {
          dispatch({
            type: 'SELECT_PROCESS',
            payload: { nodeId, processId }
          });
        },
        // Callback for serialization
        (focalNodeId: string) => {
          dispatch({
            type: 'SAVE_PRODUCTION_CHAIN',
            payload: { focalNodeId }
          });
        }
      );

      if (!result) {
        throw new Error('Failed to build process node');
      }

      // Create edges for connecting the nodes
      const newEdges: Edge[] = [];

      // Edge from parent product to compound node (main flow)
      newEdges.push({
        id: `edge-${logicalParentId}-${result.compoundNode.id}`,
        source: logicalParentId,
        target: result.compoundNode.id,
        type: 'custom',
      });

      // Edges from compound node to input product nodes
      result.productNodes.forEach(productNode => {
        newEdges.push({
          id: `edge-${result.compoundNode.id}-${productNode.id}`,
          source: result.compoundNode.id,
          target: productNode.id,
          type: 'custom',
        });
      });

      // Include the side product edges that were created in buildProcessNode
      if (result.edges && result.edges.length > 0) {
        newEdges.push(...result.edges);
      }

      return {
        compoundNode: result.compoundNode as CompoundNode,
        processNode: result.processNode as ProcessNode,
        productNodes: result.productNodes as ProductNode[],
        sideProductNodes: result.sideProductNodes as SideProductNode[],
        edges: newEdges,
        logicalParentId  // Make sure to include this for node replacement logic
      };
    } catch (error) {
      console.error('Error creating process node:', error);
      dispatch({
        type: 'NODE_CREATION_FAILED',
        payload: { error: String(error) }
      });
      return null;
    }
  }, [buildProcessNode, dispatch]);
}
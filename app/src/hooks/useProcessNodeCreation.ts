import React, { useCallback } from 'react';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import { Edge } from '@xyflow/react';
import { FlowAction } from '@/contexts/FlowContext';
import { ProductNode } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNode } from '@/components/TreeVisualizer/ProcessNode';

interface ProcessNodeCreationResult {
  nodes: Array<any>; // Use a more general type to include all node types
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

      // Collect all nodes
      const allNodes = [
        result.compoundNode,
        result.processNode,
        ...result.productNodes,
        ...result.sideProductNodes
      ];

      // Create edges for connecting the nodes
      const newEdges: Edge[] = [];

      // Create edge between parent product node and compound node (not directly to process)
      newEdges.push({
        id: `edge-${logicalParentId}-${result.compoundNode.id}`,
        source: logicalParentId,
        target: result.compoundNode.id,
        type: 'custom',
      });

      // Create edges between the compound node and input product nodes
      result.productNodes.forEach(productNode => {
        newEdges.push({
          id: `edge-${result.compoundNode.id}-${productNode.id}`,
          source: result.compoundNode.id,
          sourceHandle: `compound-source-${result.compoundNode.id}`,
          target: productNode.id,
          type: 'custom',
        });
      });

      return {
        nodes: [
          result.compoundNode,
          result.processNode,
          ...result.productNodes,
          ...result.sideProductNodes
        ],
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
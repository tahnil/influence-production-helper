import React, { useCallback } from 'react';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import { Edge } from '@xyflow/react';
import { FlowAction } from '@/contexts/FlowContext';
import { ProductNode } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNode } from '@/components/TreeVisualizer/ProcessNode';
import { SideProductCompoundNode } from '@/components/TreeVisualizer/SideProductCompoundNode';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { SideProductNode } from '@/components/TreeVisualizer/SideProductNode';

interface ProcessNodeCreationResult {
  sideProductCompoundNode?: SideProductCompoundNode;
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

      // Edge from parent product to process node (main flow)
      newEdges.push({
        id: `edge-${logicalParentId}-${result.processNode.id}`,
        source: logicalParentId,
        target: result.processNode.id,
        type: 'custom',
      });

      // Edges from process node to input product nodes
      result.productNodes.forEach(productNode => {
        newEdges.push({
          id: `edge-${result.processNode.id}-${productNode.id}`,
          source: result.processNode.id,
          target: productNode.id,
          type: 'custom',
        });
      });

      // Only create sideProductCompound node edges if a sideProductCompound node exists
      if (result.sideProductCompoundNode && result.sideProductNodes.length > 0) {
        // Edges from process node to sideProductCompound node with side product nodes
        newEdges.push({
          id: `edge-${result.sideProductCompoundNode.id}-${result.processNode.id}`,
          source: result.sideProductCompoundNode.id,
          sourceHandle: `sideProductCompound-source-${result.sideProductCompoundNode.id}`,
          target: result.processNode.id,
          type: 'custom',
        });

        // Include the side product edges that were created in buildProcessNode
        if (result.edges && result.edges.length > 0) {
          newEdges.push(...result.edges);
        }
      }

      return {
        sideProductCompoundNode: result.sideProductCompoundNode as SideProductCompoundNode | undefined,
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
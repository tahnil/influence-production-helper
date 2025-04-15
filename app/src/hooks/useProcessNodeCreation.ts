import React, { useCallback } from 'react';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import { Edge } from '@xyflow/react';
import { FlowAction } from '@/contexts/FlowContext';
import { ProcessNode, ProductNode } from '@/types/reactFlowTypes';

interface ProcessNodeCreationResult {
  processNode: ProcessNode;
  productNodes: ProductNode[];
  sideProductNodes?: ProductNode[];
  edges: Edge[];
}

export function useProcessNodeCreation(dispatch: React.Dispatch<FlowAction>) {
  const { buildProcessNode } = useProcessNodeBuilder();

  return useCallback(async (
    processId: string,
    parentNodeId: string,
    parentNodeAmount: number,
    parentNodeProductId: string
  ): Promise<ProcessNodeCreationResult | null> => {
    try {
      if (!processId) {
        throw new Error('Process ID is undefined');
      }
      if (!parentNodeId) {
        throw new Error('Parent Node ID is undefined');
      }

      // Use the existing buildProcessNode utility
      const result = await buildProcessNode(
        processId,
        parentNodeId,
        parentNodeAmount,
        parentNodeProductId,
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

      // Create edges between the process node and its input product nodes
      result.productNodes.forEach(productNode => {
        newEdges.push({
          id: `edge-${result.processNode.id}-${productNode.id}`,
          source: result.processNode.id,
          target: productNode.id,
          type: 'custom',
        });
      });

      // Create edges between the process node and side product nodes
      // Mark these edges as side product connections
      result.sideProductNodes?.forEach(sideProductNode => {
        newEdges.push({
          id: `edge-sideProduct-${result.processNode.id}-${sideProductNode.id}`,
          source: result.processNode.id,
          target: sideProductNode.id,
          type: 'custom',
          data: {
            isSideProductConnection: true
          }
        });
      });

      // Create edge between parent product node and process node
      newEdges.push({
        id: `edge-${parentNodeId}-${result.processNode.id}`,
        source: parentNodeId,
        target: result.processNode.id,
        type: 'custom',
      });

      return {
        processNode: {
          ...result.processNode,
          data: {
            ...result.processNode.data,
            totalDuration: result.processNode.data.totalDuration || 0,
            totalRuns: result.processNode.data.totalRuns || 0,
            image: result.processNode.data.image || '',
            processDetails: result.processNode.data.processDetails || null,
            inputProducts: result.processNode.data.inputProducts || [],
          }
        } as ProcessNode,
        productNodes: result.productNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            amount: node.data.amount || 0,
            totalWeight: node.data.totalWeight || 0,
            totalVolume: node.data.totalVolume || 0,
            image: node.data.image || '',
            productDetails: node.data.productDetails || null,
          }
        })) as ProductNode[],
        sideProductNodes: result.sideProductNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            amount: node.data.amount || 0,
            totalWeight: node.data.totalWeight || 0,
            totalVolume: node.data.totalVolume || 0,
            image: node.data.image || '',
            productDetails: node.data.productDetails || null,
          }
        })) as ProductNode[],
        edges: newEdges
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
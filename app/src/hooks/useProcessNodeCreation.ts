import React, { useCallback } from 'react';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import { Edge } from '@xyflow/react';
import { FlowAction } from '@/contexts/FlowContext';
import { ProductNode } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNode } from '@/components/TreeVisualizer/ProcessNode';
import { SideProductCompoundNode } from '@/components/TreeVisualizer/SideProductCompoundNode';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { SideProductNode } from '@/components/TreeVisualizer/SideProductNode';
import { OutflowsCompoundNode } from '@/components/TreeVisualizer/OutflowsCompoundNode';

interface ProcessNodeCreationResult {
  unchangedNodes: InfluenceNode[];
  processNode: ProcessNode;
  productNodes: ProductNode[];
  sideProductNodes: SideProductNode[];
  sideProductCompoundNode?: SideProductCompoundNode;
  outflowsCompoundNode?: OutflowsCompoundNode;
  edges: Edge[];
  logicalParentId: string;
}

export function useProcessNodeCreation(dispatch: React.Dispatch<FlowAction>) {
  const { buildProcessNode } = useProcessNodeBuilder();

  return useCallback(async (
    processId: string,
    logicalParentId: string,
    logicalParentIdAmount: number,
    logicalParentIdProductId: string,
    currentNodes: InfluenceNode[],
    currentEdges: Edge[],
  ): Promise<ProcessNodeCreationResult | null> => {
    try {
      if (!processId) {
        throw new Error('Process ID is undefined');
      }
      if (!logicalParentId) {
        throw new Error('Parent Node ID is undefined');
      }
      console.log('[useProcessNodeCreation] initialized with processId:', processId);

      // STEP 0: Global initialization of constants
      // Initialize an empty arry of nodes to remove
      const nodesToRemove: string[] = [];

      let unchangedNodes: InfluenceNode[] = currentNodes;
      let unchangedEdges: Edge[] = currentEdges;

      console.log('[useProcessNodeCreation] Current nodes:', unchangedNodes);
      console.log('[useProcessNodeCreation] Current edges:', unchangedEdges);

      // Filter out any undefined nodes from nodes in payload first
      unchangedNodes = unchangedNodes.filter(node => node && typeof node === 'object' && 'type' in node);
      console.log('[useProcessNodeCreation] Valid nodes:', unchangedNodes);

      // STEP 1: Remove existing nodes that are related to the processId
      // Necessary because a new process has been selected

      // If there's an existing sideProductCompound node with the same logicalParentId, remove it and its children
      const existingSideProductCompoundNodes = unchangedNodes.filter(
        (node) => node.type === 'sideProductCompoundNode' &&
          node.data.processId &&
          unchangedNodes.find(n => n.id === node.data.processId)?.data?.logicalParentId === logicalParentId
      );

      if (existingSideProductCompoundNodes.length > 0) {
        // Find sideProductCompound nodes and their children and add them to the nodes to remove
        console.log('[useProcessNodeCreation] Nodes to be removed:', nodesToRemove);
        existingSideProductCompoundNodes.forEach(existingSideProductCompoundNode => {
          console.log('[useProcessNodeCreation] Removing now existing SideProductCompound node:', existingSideProductCompoundNode);
          nodesToRemove.push(existingSideProductCompoundNode.id);

          // Find all child nodes of the sideProductCompound node
          console.log('[useProcessNodeCreation] Nodes to be removed:', nodesToRemove);
          unchangedNodes.forEach(node => {
            if (node.parentId === existingSideProductCompoundNode.id) {
              console.log('[useProcessNodeCreation] Removing now existing SideProductCompound node:', node);
              nodesToRemove.push(node.id);
            }
          });
        });
      }

      // Create array of existing compound nodes of outflows of this process
      const existingOutflowsCompoundNodes = unchangedNodes.filter(
        (node) => node.type === 'outflowsCompoundNode' &&
          node.data.processId &&
          unchangedNodes.find(n => n.id === node.data.processId)?.data?.logicalParentId === logicalParentId
      );

      // If there's an existing OutflowsCompoundNode with the same logicalParentId, remove it
      if (existingOutflowsCompoundNodes.length > 0) {
        console.log('[useProcessNodeCreation] Nodes to be removed:', nodesToRemove);
        existingOutflowsCompoundNodes.forEach(existingOutflowsCompoundNode => {
          console.log('[useProcessNodeCreation] Removing now existing OutflowsCompound node:', existingOutflowsCompoundNode);
          nodesToRemove.push(existingOutflowsCompoundNode.id);
          // Find all child nodes of the OutflowsCompound node
          // and delete their parendId
          unchangedNodes.forEach(node => {
            if (node.parentId === existingOutflowsCompoundNode.id) {
              node.parentId = undefined;
            }
          });
        });
      }

      // STEP 2: Remove the existing process node and its inflows
      // Find existing process nodes with the logicalParentId and add them to the nodes to remove
      const existingProcessNodes = unchangedNodes.filter(
        (node) => node.type === 'processNode' &&
          node.data.logicalParentId === logicalParentId
      );

      console.log('[useProcessNodeCreation] Nodes to be removed:', nodesToRemove);
      existingProcessNodes.forEach(processNode => {
        console.log('[useProcessNodeCreation] Removing now existing process node:', processNode);
        nodesToRemove.push(processNode.id);
        // Find input products of this process and add them to the nodes to remove
        console.log('[useProcessNodeCreation] Nodes to be removed:', nodesToRemove);
        unchangedNodes.forEach(node => {
          if (node.data.logicalParentId === processNode.id) {
            console.log('[useProcessNodeCreation] Removing now existing inflow node:', node);
            nodesToRemove.push(node.id);
          }
        });
      });

      // Remove nodes
      unchangedNodes = unchangedNodes.filter(
        (node) => !nodesToRemove.includes(node.id)
      );

      // Remove connected edges
      unchangedEdges = unchangedEdges.filter(
        (edge) => !nodesToRemove.includes(edge.source) && !nodesToRemove.includes(edge.target)
      );

      // STEP 3: Create new nodes
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
        unchangedNodes,
        processNode: result.processNode as ProcessNode,
        productNodes: result.productNodes as ProductNode[],
        sideProductNodes: result.sideProductNodes as SideProductNode[],
        sideProductCompoundNode: result.sideProductCompoundNode as SideProductCompoundNode | undefined,
        edges: [...unchangedEdges, ...newEdges],
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
// src/utils/TreeVisualizer/flowThunks.ts

import { Dispatch } from 'react';
import { FlowAction } from '@/contexts/FlowContext';
import { buildProductNode } from './productNodeBuilder';
import { buildProcessNode } from './processNodeBuilder';
import { Edge } from '@xyflow/react';

/**
 * Thunk for selecting a product and building its node
 * 
 * @param dispatch The dispatch function from useReducer
 * @param productId The ID of the product to select
 * @param amount The amount of the product
 * @param handleSelectProcess Callback function for selecting a process
 * @param handleSerialize Callback function for serializing the production chain
 */
export const selectProductThunk = async (
  dispatch: Dispatch<FlowAction>,
  productId: string,
  amount: number,
  handleSelectProcess: (processId: string, nodeId: string) => void,
  handleSerialize: (focalProductId: string) => void
) => {
  // First dispatch an action to clear the current state and indicate we're selecting a product
  dispatch({
    type: 'SELECT_PRODUCT',
    payload: { productId, amount }
  });

  try {
    // Build the product node
    const rootNode = await buildProductNode(
      productId,
      amount
    );

    if (rootNode) {
      // Add callback functions to the node data
      const nodeWithCallbacks = {
        ...rootNode,
        data: {
          ...rootNode.data,
          handleSelectProcess,
          handleSerialize
        }
      };

      // Dispatch the built node
      dispatch({
        type: 'PRODUCT_NODE_BUILT',
        payload: { node: nodeWithCallbacks }
      });
    } else {
      // Handle the case where node building failed
      dispatch({ 
        type: 'PRODUCT_NODE_BUILD_ERROR', 
        payload: { error: new Error('Failed to build product node') } 
      });
    }
  } catch (error) {
    console.error('Error building product node:', error);
    dispatch({ 
      type: 'PRODUCT_NODE_BUILD_ERROR', 
      payload: { error: error instanceof Error ? error : new Error('Unknown error') } 
    });
  }
};

/**
 * Thunk for selecting a process and building its node
 * 
 * @param dispatch The dispatch function from useReducer
 * @param processId The ID of the process to select
 * @param parentNodeId The ID of the parent product node
 * @param parentNodeAmount The amount of the parent product
 * @param parentNodeProductId The product ID of the parent node
 * @param edges The current edges in the graph
 * @param handleSelectProcess Callback function for selecting a process
 * @param handleSerialize Callback function for serializing the production chain
 */
export const selectProcessThunk = async (
  dispatch: Dispatch<FlowAction>,
  processId: string,
  parentNodeId: string,
  parentNodeAmount: number,
  parentNodeProductId: string,
  edges: Edge[],
  handleSelectProcess: (processId: string, nodeId: string) => void,
  handleSerialize: (focalProductId: string) => void
) => {
  // First dispatch an action to indicate we're selecting a process
  dispatch({
    type: 'SELECT_PROCESS',
    payload: {
      processId,
      parentNodeId,
      parentNodeAmount,
      parentNodeProductId
    }
  });

  try {
    // Build the process node and its child product nodes
    const result = await buildProcessNode(
      processId,
      parentNodeId,
      parentNodeAmount,
      parentNodeProductId,
      handleSelectProcess,
      handleSerialize
    );

    if (result) {
      // Dispatch the built process node and its child product nodes
      dispatch({
        type: 'PROCESS_NODE_BUILT',
        payload: {
          processNode: result.processNode,
          productNodes: result.productNodes,
          parentNodeId,
          edges
        }
      });
    } else {
      // Handle the case where node building failed
      dispatch({ 
        type: 'PROCESS_NODE_BUILD_ERROR', 
        payload: { error: new Error('Failed to build process node') } 
      });
    }
  } catch (error) {
    console.error('Error building process node:', error);
    dispatch({ 
      type: 'PROCESS_NODE_BUILD_ERROR', 
      payload: { error: error instanceof Error ? error : new Error('Unknown error') } 
    });
  }
};
import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge
} from '@xyflow/react';
import { getOutflowIds } from '@/utils/TreeVisualizer/getOutflowIds';
import { DagreConfig } from '@/hooks/useDagreConfig';
import { usePouchDB } from '@/contexts/PouchDBContext';
import calculateDesiredAmount from '@/utils/TreeVisualizer/calculateDesiredAmount';
import applyDagreLayout from '@/utils/TreeVisualizer/applyDagreLayout';
import { serializeProductionChain } from '@/utils/TreeVisualizer/serializeProductionChain';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { handleReplaceNode } from '@/utils/TreeVisualizer/handleReplaceNode';

// Define the state interface
interface FlowState {
  nodes: Node[];
  edges: Edge[];
  desiredAmount: number;
  nodesReady: boolean;
  rootNodeId: string;
  needsLayout: boolean;
  selectedProductId: string | null;
  processSelections: Array<{ nodeId: string, processId: string }>;
  focalNodeId: string | null;
  pendingSaveNodeId: string | null;
  pendingLoadConfig: {
    nodeId: string;
    configId: string;
  } | null;
  // Add this property:
  matchingConfigs: Array<{
    _id: string;
    focalProductId: string;
    createdAt: string;
    nodeCount: number;
  }>;
  saveStatus?: 'pending' | 'complete' | 'error';
  saveError?: string;
  loadStatus?: 'pending' | 'complete' | 'error';
  loadError?: string;
}

// Define the action types
export type FlowAction =
  | { type: 'SET_NODES'; payload: Node[] }
  | { type: 'SET_EDGES'; payload: Edge[] }
  | { type: 'SET_DESIRED_AMOUNT'; payload: number }
  | { type: 'SET_NODES_READY'; payload: boolean }
  | { type: 'SET_ROOT_NODE_ID'; payload: string }
  | { type: 'BATCH_UPDATE'; payload: Partial<FlowState> }
  | {
    type: 'PROCESS_SELECTED'; payload: {
      processNode: Node,
      productNodes: Node[],
      parentNodeId: string,
      edges: Edge[]
    }
  }
  // dedicated action types for React Flow operations
  | { type: 'APPLY_NODE_CHANGES'; payload: NodeChange[] }
  | { type: 'APPLY_EDGE_CHANGES'; payload: EdgeChange[] }
  | { type: 'CONNECT_NODES'; payload: Connection }
  // dedicated action specifically for layout operations
  | {
    type: 'APPLY_LAYOUT'; payload: {
      nodes: Node[],
      edges: Edge[],
      needsReset?: boolean,
      dagreConfig: DagreConfig
    }
  }
  | { type: 'SELECT_PRODUCT'; payload: string | null }
  | { type: 'SELECT_PROCESS'; payload: { nodeId: string; processId: string } }
  | { type: 'BUILD_PRODUCT_NODE'; payload: { productId: string, node: Node } }
  | { type: 'BUILD_PROCESS_NODE'; payload: { processNode: Node, productNodes: Node[], parentNodeId: string } }
  | { type: 'SAVE_PRODUCTION_CHAIN'; payload: { focalNodeId: string } }
  | { type: 'LOAD_SAVED_CONFIG'; payload: { nodeId: string, configId: string } }
  | { type: 'SAVE_COMPLETE' }
  | { type: 'SAVE_ERROR'; payload: { error: string } }
  | { type: 'LOAD_COMPLETE' }
  | { type: 'LOAD_ERROR'; payload: { error: string } }
  | {
    type: 'SET_MATCHING_CONFIGS'; payload: Array<{
      _id: string;
      focalProductId: string;
      createdAt: string;
      nodeCount: number;
    }>
  }
  ;

// Initial state
const initialState: FlowState = {
  nodes: [],
  edges: [],
  desiredAmount: 1,
  nodesReady: false,
  rootNodeId: 'root',
  needsLayout: false,
  selectedProductId: null, // check if this is correct
  processSelections: [], // check if this is correct
  focalNodeId: null,
  pendingSaveNodeId: null,
  pendingLoadConfig: null,
  matchingConfigs: [],
};

// Create the reducer function
const flowReducer = (state: FlowState, action: FlowAction): FlowState => {
  switch (action.type) {
    case 'SET_NODES':
      return { ...state, nodes: action.payload };
    case 'SET_EDGES':
      return { ...state, edges: action.payload };
    case 'APPLY_NODE_CHANGES':
      return {
        ...state,
        nodes: applyNodeChanges(action.payload, state.nodes)
      };
    case 'APPLY_EDGE_CHANGES':
      return {
        ...state,
        edges: applyEdgeChanges(action.payload, state.edges)
      };
    case 'CONNECT_NODES':
      return {
        ...state,
        edges: addEdge(action.payload, state.edges)
      };
    case 'APPLY_LAYOUT': {
      const { nodes, edges, needsReset = true, dagreConfig } = action.payload;
      const updatedNodes = calculateDesiredAmount(nodes, state.desiredAmount, state.rootNodeId);
      const { layoutedNodes, layoutedEdges } = applyDagreLayout(updatedNodes, edges, dagreConfig);

      return {
        ...state,
        nodes: layoutedNodes,
        edges: layoutedEdges,
        needsLayout: needsReset ? false : state.needsLayout
      };
    };
    case 'SET_DESIRED_AMOUNT':
      return { ...state, desiredAmount: action.payload };
    case 'SET_NODES_READY':
      return { ...state, nodesReady: action.payload };
    case 'SET_ROOT_NODE_ID':
      return { ...state, rootNodeId: action.payload };
    case 'BATCH_UPDATE':
      return { ...state, ...action.payload };
    case 'PROCESS_SELECTED': {
      const { processNode, productNodes, parentNodeId, edges } = action.payload;

      // Find the existing ProcessNode with the same parentId
      const existingProcessNode = state.nodes.find(
        (node) => node.parentId === parentNodeId && node.type === 'processNode'
      );

      let updatedNodes = [...state.nodes];
      let updatedEdges = [...edges];

      if (existingProcessNode) {
        // Get all outflow IDs
        const outflowIds = getOutflowIds(existingProcessNode.id, updatedNodes);

        // Remove existing ProcessNode and its outflows
        updatedNodes = updatedNodes.filter(
          (node) => ![existingProcessNode.id, ...outflowIds].includes(node.id)
        );

        // Remove connected edges
        updatedEdges = updatedEdges.filter(
          (edge) => ![existingProcessNode.id, ...outflowIds].includes(edge.source)
        );
      }

      // Add the new ProcessNode and its child ProductNodes
      updatedNodes = [...updatedNodes, processNode, ...productNodes];

      // Create edges between the ProcessNode and each ProductNode
      const newEdges = productNodes.map((productNode) => ({
        id: `edge-${processNode.id}-${productNode.id}`,
        source: processNode.id,
        target: productNode.id,
        type: 'custom',
      }));

      updatedEdges = [...updatedEdges, ...newEdges];

      // Add edge between parent ProductNode and ProcessNode
      updatedEdges.push({
        id: `edge-${parentNodeId}-${processNode.id}`,
        source: parentNodeId,
        target: processNode.id,
        type: 'custom',
      });

      // Update inflowIds in parent ProductNode
      const parentProductNode = updatedNodes.find(
        (node) => node.id === parentNodeId && node.type === 'productNode'
      );

      if (parentProductNode) {
        parentProductNode.data.inflowIds = [processNode.id];
      }

      return {
        ...state,
        nodes: updatedNodes,
        edges: updatedEdges,
        needsLayout: true,
      };
    };
    case 'SELECT_PRODUCT':
      return { ...state, selectedProductId: action.payload };
    case 'SELECT_PROCESS':
      return {
        ...state,
        processSelections: [...state.processSelections, action.payload],
      };
    case 'BUILD_PRODUCT_NODE':
      return {
        ...state,
        nodes: [
          ...state.nodes,
          {
            ...action.payload.node,
            data: {
              ...action.payload.node.data,
              // Ensure any necessary callbacks are added
            }
          }
        ],
        rootNodeId: action.payload.node.id,
      };
    case 'BUILD_PROCESS_NODE':
      const { processNode, productNodes, parentNodeId } = action.payload;

      const existingProcessNode = state.nodes.find(
        (node) => node.parentId === parentNodeId && node.type === 'processNode'
      );

      let updatedNodes = [...state.nodes];
      let updatedEdges = [...state.edges];

      if (existingProcessNode) {
        // Get all outflow IDs
        const outflowIds = getOutflowIds(existingProcessNode.id, updatedNodes);

        updatedNodes = updatedNodes.filter(
          (node) => ![existingProcessNode.id, ...outflowIds].includes(node.id)
        );

        updatedEdges = updatedEdges.filter(
          (edge) => ![existingProcessNode.id, ...outflowIds].includes(edge.source)
        );

        updatedNodes = [...updatedNodes, processNode, ...productNodes];

        const newEdges = productNodes.map((productNode) => ({
          id: `edge-${processNode.id}-${productNode.id}`,
          source: processNode.id,
          target: productNode.id,
          type: 'custom',
        }));

        updatedEdges = [...updatedEdges, ...newEdges];

        updatedEdges.push({
          id: `edge-${parentNodeId}-${processNode.id}`,
          source: parentNodeId,
          target: processNode.id,
          type: 'custom',
        });

        const parentProductNode = updatedNodes.find(
          (node) => node.id === parentNodeId && node.type === 'productNode'
        );

        if (parentProductNode) {
          parentProductNode.data.inflowIds = [processNode.id];
        }

        return {
          ...state,
          nodes: updatedNodes,
          edges: updatedEdges,
          needsLayout: true,
        };
      };
    case 'SAVE_PRODUCTION_CHAIN': {
      if ('focalNodeId' in action.payload) {
        const { focalNodeId } = action.payload;
        // Call serializeProductionChain or handle async in an effect
        // For now, just mark that saving is needed
        return {
          ...state,
          pendingSaveNodeId: focalNodeId,
          saveStatus: 'pending',
        };
      }
      // Handle the case where focalNodeId is not in action.payload
      console.error('Invalid payload for SAVE_PRODUCTION_CHAIN action');
      return state;
    };
    case 'SAVE_COMPLETE': {
      return {
        ...state,
        pendingSaveNodeId: null,
        saveStatus: 'complete',
      };
    };
    case 'SAVE_ERROR': {
      return {
        ...state,
        pendingSaveNodeId: null,
        saveStatus: 'error',
        saveError: action.payload.error,
      };
    };
    case 'LOAD_SAVED_CONFIG': {
      const { nodeId, configId } = action.payload;
      return {
        ...state,
        pendingLoadConfig: {
          nodeId,
          configId
        },
        loadStatus: 'pending',
      }
    };
    case 'LOAD_COMPLETE': {
      return {
        ...state,
        pendingLoadConfig: null,
        loadStatus: 'complete',
      };
    };
    case 'LOAD_ERROR': {
      return {
        ...state,
        pendingLoadConfig: null,
        loadStatus: 'error',
        loadError: action.payload.error,
      };
    };
    case 'SET_MATCHING_CONFIGS': {
      return {
        ...state,
        matchingConfigs: action.payload
      };
    };
    default:
      return state;
  }
};

interface FlowContextType {
  nodes: Node[];
  edges: Edge[];
  desiredAmount: number;
  nodesReady: boolean;
  rootNodeId: string;
  needsLayout: boolean;
  nodesRef: React.MutableRefObject<Node[]>;
  selectedProductId: string | null;
  processSelections: Array<{ nodeId: string, processId: string }>; // Check if this is correct
  focalNodeId: string | null;
  pendingSaveNodeId: string | null;
  matchingConfigs: Array<{
    _id: string;
    focalProductId: string;
    createdAt: string;
    nodeCount: number;
  }>;
  dispatch: React.Dispatch<FlowAction>;
  setNodes: (nodes: React.SetStateAction<Node[]>) => void;
  setEdges: (edges: React.SetStateAction<Edge[]>) => void;
  setDesiredAmount: (amount: React.SetStateAction<number>) => void;
  setNodesReady: (ready: React.SetStateAction<boolean>) => void;
  setRootNodeId: (id: React.SetStateAction<string>) => void;
}
const FlowContext = createContext<FlowContextType | undefined>(undefined);

export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
};

export const FlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(flowReducer, initialState);
  const nodesRef = useRef<Node[]>([]);
  const { memoryDb } = usePouchDB();

  // Keep the nodesRef in sync with the state.nodes
  React.useEffect(() => {
    nodesRef.current = state.nodes;
  }, [state.nodes]);

  // Create compatibility setters for existing components
  const setNodes = (nodes: React.SetStateAction<Node[]>) => {
    if (typeof nodes === 'function') {
      const updatedNodes = nodes(state.nodes);
      dispatch({ type: 'SET_NODES', payload: updatedNodes });
    } else {
      dispatch({ type: 'SET_NODES', payload: nodes });
    }
  };

  const setEdges = (edges: React.SetStateAction<Edge[]>) => {
    if (typeof edges === 'function') {
      const updatedEdges = edges(state.edges);
      dispatch({ type: 'SET_EDGES', payload: updatedEdges });
    } else {
      dispatch({ type: 'SET_EDGES', payload: edges });
    }
  };

  const setDesiredAmount = (amount: React.SetStateAction<number>) => {
    if (typeof amount === 'function') {
      const updatedAmount = amount(state.desiredAmount);
      dispatch({ type: 'SET_DESIRED_AMOUNT', payload: updatedAmount });
    } else {
      dispatch({ type: 'SET_DESIRED_AMOUNT', payload: amount });
    }
  };

  const setNodesReady = (ready: React.SetStateAction<boolean>) => {
    if (typeof ready === 'function') {
      const updatedReady = ready(state.nodesReady);
      dispatch({ type: 'SET_NODES_READY', payload: updatedReady });
    } else {
      dispatch({ type: 'SET_NODES_READY', payload: ready });
    }
  };

  const setRootNodeId = (id: React.SetStateAction<string>) => {
    if (typeof id === 'function') {
      const updatedId = id(state.rootNodeId);
      dispatch({ type: 'SET_ROOT_NODE_ID', payload: updatedId });
    } else {
      dispatch({ type: 'SET_ROOT_NODE_ID', payload: id });
    }
  };

  useEffect(() => {
    // Handle pending save operation
    if (state.pendingSaveNodeId !== null && memoryDb) {
      const saveNode = async () => {
        try {
          await serializeProductionChain(
            state.pendingSaveNodeId!,
            nodesRef.current as InfluenceNode[],
            memoryDb
          );
          dispatch({ type: 'SAVE_COMPLETE' });
        } catch (error) {
          console.error('Error saving:', error);
          dispatch({
            type: 'SAVE_ERROR',
            payload: { error: String(error) }
          });
        }
      };
      saveNode();
    }

    // Handle pending load operation
    if (state.pendingLoadConfig && memoryDb) {
      const loadConfig = async () => {
        try {
          const { nodeId, configId } = state.pendingLoadConfig ?? {};

          if (nodeId && configId) {

            // Use the existing handleReplaceNode function
            await handleReplaceNode(
              nodeId,
              configId,
              memoryDb,
              nodesRef.current,
              state.edges,
              dispatch,
              nodesRef,
              (processId, nodeId) => {
                dispatch({
                  type: 'SELECT_PROCESS',
                  payload: { nodeId, processId }
                });
              },
              (focalNodeId) => {
                dispatch({
                  type: 'SAVE_PRODUCTION_CHAIN',
                  payload: { focalNodeId }
                });
              },
              state.desiredAmount
            );

            dispatch({ type: 'LOAD_COMPLETE' });
          }
        } catch (error) {
          console.error('Error loading:', error);
          dispatch({
            type: 'LOAD_ERROR',
            payload: { error: String(error) }
          });
        }
      };
      loadConfig();
    }
  }, [state.pendingSaveNodeId, state.pendingLoadConfig, state.edges, state.desiredAmount, memoryDb, dispatch]);

  return (
    <FlowContext.Provider
      value={{
        nodes: state.nodes,
        edges: state.edges,
        desiredAmount: state.desiredAmount,
        nodesReady: state.nodesReady,
        rootNodeId: state.rootNodeId,
        selectedProductId: state.selectedProductId,
        processSelections: state.processSelections,
        needsLayout: state.needsLayout,
        focalNodeId: state.focalNodeId,
        pendingSaveNodeId: state.pendingSaveNodeId,
        matchingConfigs: state.matchingConfigs,
        nodesRef,
        setNodes,
        setEdges,
        setDesiredAmount,
        setNodesReady,
        setRootNodeId,
        dispatch
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};
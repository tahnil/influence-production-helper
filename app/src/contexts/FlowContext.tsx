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
import { getOutflowIds } from '@/utils/TreeVisualizer/nodeHelpers';
import { DagreConfig } from '@/hooks/useDagreConfig';
import { usePouchDB } from '@/contexts/PouchDBContext';
import calculateDesiredAmount from '@/utils/TreeVisualizer/calculateDesiredAmount';
import applyDagreLayout from '@/utils/TreeVisualizer/applyDagreLayout';
import { serializeProductionChain } from '@/utils/TreeVisualizer/serializeProductionChain';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { handleReplaceNode } from '@/utils/TreeVisualizer/handleReplaceNode';
import { useProductNodeCreation } from '@/hooks/useProductNodeCreation';
import { useProcessNodeCreation } from '@/hooks/useProcessNodeCreation';

interface NodeCreationRequest {
  type: 'product' | 'process';
  processId?: string;
  logicalParentId?: string;
  amount?: number;
  productId?: string;
  isRoot?: boolean;
  includeSideProducts?: boolean;
}

// Define the state interface
interface FlowState {
  nodes: Node[];
  edges: Edge[];
  desiredAmount: number;
  nodesReady: boolean;
  rootNodeId: string;
  needsLayout: boolean;
  layoutStatus: {
    lastLayoutTime: number;
    trigger: string | null;
    allNodesMeasured: boolean;
  }
  layoutTrigger: 'FORCE' | 'NODE_CHANGE' | 'STRUCTURE_CHANGE' | 'MEASUREMENTS_READY' | 'CONFIG_CHANGE' | null;
  selectedProductId: string | null;
  processSelections: Array<{ nodeId: string, processId: string }>;
  focalNodeId: string | null;
  pendingSaveNodeId: string | null;
  lastSavedNodeId: string | null;
  pendingLoadConfig: {
    nodeId: string;
    configId: string;
  } | null;
  matchingConfigs: Array<{
    _id: string;
    focalProductId: string;
    createdAt: string;
    nodeCount: number;
  }>;
  pendingNodeCreation: NodeCreationRequest | null;
  saveStatus?: 'pending' | 'complete' | 'error';
  saveError?: string;
  loadStatus?: 'pending' | 'complete' | 'error';
  loadError?: string;
  nodeCreationError?: string;
}

// Define the action types
export type FlowAction =
  | { type: 'SET_DESIRED_AMOUNT'; payload: number }
  | { type: 'BATCH_UPDATE'; payload: Partial<FlowState> }
  | {
    type: 'PROCESS_SELECTED'; payload: {
      processNode: Node,
      productNodes: Node[],
      sideProductNodes?: Node[],
      logicalParentId: string,
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
      dagreConfig: DagreConfig,
      layoutTrigger: 'FORCE' | 'NODE_CHANGE' | 'STRUCTURE_CHANGE' | 'MEASUREMENTS_READY' | 'CONFIG_CHANGE'
    }
  }
  | { type: 'REQUEST_LAYOUT'; payload: { trigger: 'FORCE' | 'NODE_CHANGE' | 'STRUCTURE_CHANGE' | 'MEASUREMENTS_READY' | 'CONFIG_CHANGE' } }
  | { type: 'SELECT_PRODUCT'; payload: string | null }
  | { type: 'SELECT_PROCESS'; payload: { nodeId: string; processId: string } }
  | { type: 'SAVE_PRODUCTION_CHAIN'; payload: { focalNodeId: string } }
  | { type: 'RESET_SAVE_STATUS' }
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
  | { type: 'REQUEST_PRODUCT_NODE_CREATION'; payload: { productId: string, amount: number, isRoot?: boolean } }
  | { type: 'REQUEST_PROCESS_NODE_CREATION'; payload: { processId: string, logicalParentId: string, includeSideProducts?: boolean } }
  | { type: 'CLEAR_PENDING_NODE_CREATION' }
  | { type: 'NODE_CREATION_COMPLETED' }
  | { type: 'NODE_CREATION_FAILED'; payload: { error: string } }
  ;

// Initial state
const initialState: FlowState = {
  nodes: [],
  edges: [],
  desiredAmount: 1,
  nodesReady: false,
  rootNodeId: 'root',
  needsLayout: false,
  layoutStatus: {
    lastLayoutTime: 0,
    trigger: null,
    allNodesMeasured: false
  },
  layoutTrigger: null,
  selectedProductId: null,
  processSelections: [],
  focalNodeId: null,
  pendingSaveNodeId: null,
  lastSavedNodeId: null,
  pendingLoadConfig: null,
  matchingConfigs: [],
  pendingNodeCreation: null,
};

// Create the reducer function
const flowReducer = (state: FlowState, action: FlowAction): FlowState => {
  switch (action.type) {
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
      console.log('APPLY_LAYOUT action dispatched with nodes:', action.payload.nodes.length);
      const { nodes, edges, dagreConfig, layoutTrigger } = action.payload;

      // Determine if we should apply layout based on the trigger type
      const shouldApplyLayout =
        layoutTrigger === 'FORCE' || // Always apply when forced
        (layoutTrigger === 'NODE_CHANGE' && nodes.length !== state.nodes.length) || // Node count changed
        (layoutTrigger === 'STRUCTURE_CHANGE') || // Graph structure changed (new connections)
        (layoutTrigger === 'MEASUREMENTS_READY' && nodes.every(node => node.measured?.width && node.measured?.height)); // Measurements are ready

      if (!shouldApplyLayout) {
        return state;
      }

      // Check if measurements are available for all nodes
      const allNodesMeasured = nodes.every(node => node.measured?.width && node.measured?.height);

      // Apply fallback dimensions for nodes without measurements
      const nodesWithDimensions = !allNodesMeasured ? nodes.map(node => ({
        ...node,
        measured: {
          width: node.type === 'processNode' ? 250 : 300,
          height: node.type === 'processNode' ? 120 : 150,
          ...node.measured
        }
      })) : nodes;

      // Calculate layout with the utility
      const { layoutedNodes, layoutedEdges } = applyDagreLayout(
        nodesWithDimensions,
        edges,
        dagreConfig
      );

      return {
        ...state,
        nodes: layoutedNodes,
        edges: layoutedEdges,
        needsLayout: false,
        layoutStatus: {
          lastLayoutTime: Date.now(),
          trigger: layoutTrigger,
          allNodesMeasured
        }
      };
    };
    case 'REQUEST_LAYOUT':
      return {
        ...state,
        needsLayout: true,
        layoutTrigger: action.payload.trigger
      };
    case 'SET_DESIRED_AMOUNT':
      const updatedNodes = calculateDesiredAmount(
        state.nodes,
        action.payload,
        state.rootNodeId,
      )
      return {
        ...state,
        desiredAmount: action.payload,
        nodes: updatedNodes
      };
    case 'BATCH_UPDATE':
      return { ...state, ...action.payload };
    case 'PROCESS_SELECTED': {
      const { processNode, productNodes, logicalParentId, edges } = action.payload;
      const sideProductNodes = action.payload.sideProductNodes || [];

      // Find the existing ProcessNode with the same data.logicalParentId
      const existingProcessNode = state.nodes.find(
        (node) => node.data.logicalParentId === logicalParentId && node.type === 'processNode'
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
      updatedNodes = [...updatedNodes, processNode, ...productNodes, ...sideProductNodes];

      // Create edges between the ProcessNode and each ProductNode
      const newProductEdges = productNodes.map((productNode) => ({
        id: `edge-${processNode.id}-${productNode.id}`,
        source: processNode.id,
        target: productNode.id,
        type: 'custom',
      }));

      // Create edges between the ProcessNode and each SideProductNode
      const sideProductEdges = sideProductNodes.map((sideProductNode) => ({
        id: `edge-${sideProductNode.id}-${processNode.id}`,
        source: sideProductNode.id,
        sourceHandle: `source-${sideProductNode.id}`,
        target: processNode.id,
        targetHandle: `target-side-product-${processNode.id}`,
        type: 'custom',
        data: {
          isSideProductConnection: true
        }
      }));

      updatedEdges = [...updatedEdges, ...newProductEdges, ...sideProductEdges];

      // Add edge between parent ProductNode and ProcessNode
      updatedEdges.push({
        id: `edge-${logicalParentId}-${processNode.id}`,
        source: logicalParentId,
        target: processNode.id,
        type: 'custom',
      });

      // Update inflowIds in parent ProductNode
      const parentProductNode = updatedNodes.find(
        (node) => node.id === logicalParentId && node.type === 'productNode'
      );

      if (parentProductNode) {
        parentProductNode.data.inflowIds = [processNode.id];
      }

      return {
        ...state,
        nodes: updatedNodes,
        edges: updatedEdges,
        needsLayout: true,
        layoutTrigger: 'STRUCTURE_CHANGE',
      };
    };
    case 'SELECT_PRODUCT':
      return { ...state, selectedProductId: action.payload };
    case 'SELECT_PROCESS':
      return {
        ...state,
        processSelections: [...state.processSelections, action.payload],
      };
    case 'SAVE_PRODUCTION_CHAIN': {
      console.log('SAVE_PRODUCTION_CHAIN action dispatched with focal node:', action.payload.focalNodeId);

      if ('focalNodeId' in action.payload) {
        const { focalNodeId } = action.payload;
        return {
          ...state,
          pendingSaveNodeId: focalNodeId,
          lastSavedNodeId: focalNodeId,
          saveStatus: 'pending',
        };
      }
      
      console.error('Invalid payload for SAVE_PRODUCTION_CHAIN action');
      return state;
    };
    case 'RESET_SAVE_STATUS': {
      return {
        ...state,
        saveStatus: undefined,
        saveError: undefined,
        lastSavedNodeId: null,
      };
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
        needsLayout: true,
        layoutTrigger: 'FORCE'
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
    case 'REQUEST_PRODUCT_NODE_CREATION':
      return {
        ...state,
        pendingNodeCreation: {
          type: 'product',
          ...action.payload
        }
      };
    case 'REQUEST_PROCESS_NODE_CREATION':
      return {
        ...state,
        pendingNodeCreation: {
          type: 'process',
          ...action.payload
        }
      };
    case 'CLEAR_PENDING_NODE_CREATION':
      return {
        ...state,
        pendingNodeCreation: null
      };
    case 'NODE_CREATION_COMPLETED':
      return {
        ...state,
        pendingNodeCreation: null,
        needsLayout: true,
        layoutTrigger: 'NODE_CHANGE'
      };
    case 'NODE_CREATION_FAILED':
      return {
        ...state,
        pendingNodeCreation: null,
        nodeCreationError: action.payload.error
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
  layoutStatus: {
    lastLayoutTime: number;
    trigger: string | null;
    allNodesMeasured: boolean;
  }
  layoutTrigger: 'FORCE' | 'NODE_CHANGE' | 'STRUCTURE_CHANGE' | 'MEASUREMENTS_READY' | 'CONFIG_CHANGE' | null;
  nodesRef: React.MutableRefObject<Node[]>;
  selectedProductId: string | null;
  processSelections: Array<{ nodeId: string, processId: string }>;
  focalNodeId: string | null;
  pendingSaveNodeId: string | null;
  lastSavedNodeId: string | null;
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
  dispatch: React.Dispatch<FlowAction>;
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
  const createProductNode = useProductNodeCreation(dispatch);
  const createProcessNode = useProcessNodeCreation(dispatch);

  // Keep the nodesRef in sync with the state.nodes
  React.useEffect(() => {
    nodesRef.current = state.nodes;
  }, [state.nodes]);

  // Handle building of product nodes
  useEffect(() => {
    if (!state.pendingNodeCreation || state.pendingNodeCreation.type !== 'product') return;

    const { productId, amount = 1, isRoot = false } = state.pendingNodeCreation;

    const handleProductNodeCreation = async () => {
      try {
        if (!productId) {
          throw new Error('Product ID is undefined');
        }
        
        const enhancedNode = await createProductNode(productId, amount, isRoot);

        if (!enhancedNode) return; // Creation failed or was cancelled

        if (isRoot) {
          dispatch({
            type: 'BATCH_UPDATE',
            payload: {
              nodes: [enhancedNode],
              rootNodeId: enhancedNode.id,
              nodesReady: true
            }
          });
        } else {
          dispatch({
            type: 'BATCH_UPDATE',
            payload: {
              nodes: [...state.nodes, enhancedNode]
            }
          });
        }

        dispatch({ type: 'NODE_CREATION_COMPLETED' });
      } catch (error) {
        console.error('Error in product node creation:', error);
        dispatch({
          type: 'NODE_CREATION_FAILED',
          payload: { error: String(error) }
        });
      }
    };

    handleProductNodeCreation();
  }, [
    state.pendingNodeCreation?.type,
    state.pendingNodeCreation?.productId,
    state.pendingNodeCreation?.amount,
    state.pendingNodeCreation?.isRoot,
    createProductNode,
    state.nodes
  ]);

  // Handle building of process nodes
  useEffect(() => {
    if (!state.pendingNodeCreation || state.pendingNodeCreation.type !== 'process') return;

    const { processId, logicalParentId, includeSideProducts = false } = state.pendingNodeCreation;

    const handleProcessNodeCreation = async () => {
      try {
        if (!processId) {
          throw new Error('Process ID is undefined');
        }

        if (!logicalParentId) {
          throw new Error('Parent Node ID is undefined');
        }

        // Find parent node
        const parentNode = state.nodes.find(node => node.id === logicalParentId);
        if (!parentNode) {
          throw new Error(`Parent node with ID ${logicalParentId} not found`);
        }

        const parentNodeAmount = parentNode.data.amount as number || 0;
        const parentNodeProductId = (parentNode.data.productDetails as { id: string } | undefined)?.id || '';

        const result = await createProcessNode(
          processId, 
          logicalParentId, 
          parentNodeAmount, 
          parentNodeProductId,
        );

        if (!result) {
          throw new Error('Failed to build process node');
        }

        dispatch({
          type: 'PROCESS_SELECTED',
          payload: {
            processNode: result.processNode,
            productNodes: result.productNodes,
            sideProductNodes: result.sideProductNodes,
            logicalParentId,
            edges: state.edges
          }
        });

        dispatch({ type: 'NODE_CREATION_COMPLETED' });

        // log content of the whole nodes array
        console.log('Nodes after process node creation:', state.nodes);
      } catch (error) {
        console.error('Error in process node creation:', error);
        dispatch({
          type: 'NODE_CREATION_FAILED',
          payload: { error: String(error) }
        });
      }
    };

    handleProcessNodeCreation();
  }, [
    state.pendingNodeCreation?.type,
    state.pendingNodeCreation?.processId,
    state.pendingNodeCreation?.logicalParentId,
    state.pendingNodeCreation?.includeSideProducts,
    createProcessNode,
    state.nodes,
    state.edges
  ]);

  // Handle pending save operation
  useEffect(() => {
    if (state.pendingSaveNodeId !== null && memoryDb && state.saveStatus === 'pending') {
      const saveNode = async () => {
        console.log("Starting serialization with nodeId:", state.pendingSaveNodeId);
        console.log("Current nodes:", nodesRef.current.length);
        try {
          await serializeProductionChain(
            state.pendingSaveNodeId!,
            nodesRef.current as InfluenceNode[],
            memoryDb
          );
          console.log("Serialization successful");
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
  }, [state.pendingSaveNodeId, state.saveStatus, memoryDb]);

  // Handle load operations
  useEffect(() => {
    if (state.pendingLoadConfig && memoryDb) {
      const loadConfig = async () => {
        try {
          const { nodeId, configId } = state.pendingLoadConfig ?? {};

          if (nodeId && configId) {
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
  }, [state.pendingLoadConfig, state.edges, state.desiredAmount, memoryDb]);

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
        layoutStatus: state.layoutStatus,
        layoutTrigger: state.layoutTrigger,
        focalNodeId: state.focalNodeId,
        pendingSaveNodeId: state.pendingSaveNodeId,
        lastSavedNodeId: state.lastSavedNodeId,
        matchingConfigs: state.matchingConfigs,
        saveStatus: state.saveStatus,
        saveError: state.saveError,
        nodesRef,
        dispatch
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};
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
import { DagreConfig } from '@/hooks/useDagreConfig';
import { usePouchDB } from '@/contexts/PouchDBContext';
import calculateDesiredAmount from '@/utils/TreeVisualizer/calculateDesiredAmount';
import applyDagreLayout from '@/utils/TreeVisualizer/applyDagreLayout';
import { serializeProductionChain } from '@/utils/TreeVisualizer/serializeProductionChain';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { handleReplaceNode } from '@/utils/TreeVisualizer/handleReplaceNode';
import { useProcessNodeOrchestrator } from '@/hooks/useProcessNodeOrchestrator';
import { useNodeOrchestrator } from '@/hooks/useNodeOrchestrator';

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
  layoutTrigger: 'FORCE' | 'NODE_CHANGE' | 'STRUCTURE_CHANGE' | 'MEASUREMENTS_READY' | 'CONFIG_CHANGE' | 'WAITING_FOR_MEASUREMENTS' | 'REQUEST_LAYOUT' | null;
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
  pendingLayoutTrigger: 'FORCE' | 'NODE_CHANGE' | 'STRUCTURE_CHANGE' | 'MEASUREMENTS_READY' | 'CONFIG_CHANGE' | 'WAITING_FOR_MEASUREMENTS' | 'REQUEST_LAYOUT' | null;
  saveStatus?: 'pending' | 'complete' | 'error';
  saveError?: string;
  loadStatus?: 'pending' | 'complete' | 'error';
  loadError?: string;
  nodeCreationError?: string;
}

// Define the action types
export type FlowAction =
  // Component: ControlPanel > AmountInput
  // Set new desired amount and recalculate node values
  // Do not update the layout
  | { type: 'SET_DESIRED_AMOUNT'; payload: number }
  // TO BE DEFINED: Why do we need this?
  | { type: 'BATCH_UPDATE'; payload: Partial<FlowState> }
  | { type: 'APPLY_NODE_CHANGES'; payload: NodeChange[] }
  | { type: 'APPLY_EDGE_CHANGES'; payload: EdgeChange[] }
  | { type: 'CONNECT_NODES'; payload: Connection }
  // dedicated action specifically for layout operations
  | {
    type: 'APPLY_LAYOUT'; payload: {
      nodes: Node[],
      edges: Edge[],
      dagreConfig: DagreConfig,
      layoutTrigger: 'FORCE' | 'NODE_CHANGE' | 'STRUCTURE_CHANGE' | 'MEASUREMENTS_READY' | 'CONFIG_CHANGE' | 'WAITING_FOR_MEASUREMENTS' | 'REQUEST_LAYOUT'
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
  | { type: 'NODE_CREATION_COMPLETED' }
  | { type: 'NODE_CREATION_FAILED'; payload: { error: string } }
  | { type: 'PROCESS_STRUCTURE_CREATED'; payload: { nodes: InfluenceNode[], edges: Edge[] } }
  | { type: 'ROOT_NODE_CREATED'; payload: { nodes: InfluenceNode[], edges: Edge[], rootNodeId: string } }
  ;

// Initial state
const initialState: FlowState = {
  nodes: [],
  edges: [],
  desiredAmount: 1,
  nodesReady: false,
  rootNodeId: 'root',
  needsLayout: false,
  layoutTrigger: null,
  selectedProductId: null,
  processSelections: [],
  focalNodeId: null,
  pendingSaveNodeId: null,
  lastSavedNodeId: null,
  pendingLoadConfig: null,
  matchingConfigs: [],
  pendingNodeCreation: null,
  pendingLayoutTrigger: null,
};

// Create the reducer function
/**
 * Reducer function for managing the state of a flow-based application.
 *
 * @param {FlowState} state - The current state of the flow.
 * @param {FlowAction} action - The action to be applied to the state.
 * @returns {FlowState} - The updated state after applying the action.
 *
 * ### Action Types:
 * - `'APPLY_NODE_CHANGES'`: Updates the nodes in the state based on the provided changes.
 * - `'APPLY_EDGE_CHANGES'`: Updates the edges in the state based on the provided changes.
 * - `'CONNECT_NODES'`: Adds a new edge connecting nodes.
 * - `'APPLY_LAYOUT'`: Applies a layout to the nodes and edges using the Dagre layout algorithm.
 * - `'REQUEST_LAYOUT'`: Marks the state as needing a layout update.
 * - `'SET_DESIRED_AMOUNT'`: Updates the desired amount and recalculates node values.
 * - `'BATCH_UPDATE'`: Merges the provided payload into the state.
 * - `'SELECT_PRODUCT'`: Sets the selected product ID in the state.
 * - `'SELECT_PROCESS'`: Adds a process selection to the state.
 * - `'SAVE_PRODUCTION_CHAIN'`: Initiates saving the production chain, marking the focal node as pending save.
 * - `'RESET_SAVE_STATUS'`: Resets the save status and error fields in the state.
 * - `'SAVE_COMPLETE'`: Marks the save operation as complete.
 * - `'SAVE_ERROR'`: Marks the save operation as failed and stores the error.
 * - `'LOAD_SAVED_CONFIG'`: Initiates loading a saved configuration for a specific node.
 * - `'LOAD_COMPLETE'`: Marks the load operation as complete and triggers a layout update.
 * - `'LOAD_ERROR'`: Marks the load operation as failed and stores the error.
 * - `'SET_MATCHING_CONFIGS'`: Updates the state with matching configurations.
 * - `'REQUEST_PRODUCT_NODE_CREATION'`: Sets up a pending product node creation request.
 * - `'REQUEST_PROCESS_NODE_CREATION'`: Sets up a pending process node creation request.
 * - `'NODE_CREATION_COMPLETED'`: Marks node creation as completed and triggers a layout update.
 * - `'NODE_CREATION_FAILED'`: Marks node creation as failed and stores the error.
 *
 * ### Notes:
 * - The reducer handles complex state transitions, including layout recalculations, node and edge updates, and error handling.
 * - Layout-related actions (`APPLY_LAYOUT`, `REQUEST_LAYOUT`, etc.) ensure that the graph structure remains consistent.
 * - Node and edge updates are carefully managed to avoid conflicts and maintain data integrity.
 */
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
      // console.log('[FlowContext] APPLY_LAYOUT action dispatched with nodes:', action.payload.nodes.length);
      const { nodes, edges, dagreConfig, layoutTrigger } = action.payload;

      // Log layout trigger
      // console.log('[FlowContext] Layout trigger:', layoutTrigger);

      // Force layout always proceeds
      const forceLayout = layoutTrigger === 'FORCE';

      // For non-forced layouts, check if all nodes have measurements
      const allNodesMeasured = nodes.every(node => node.measured?.width && node.measured?.height);

      if (!forceLayout && !allNodesMeasured && nodes.length > 0) {
        // Queue this layout request until measurements are ready
        // console.log('[FlowContext] Waiting for measurements before layout. Missing measurements for',
          // nodes.filter(node => !node.measured?.width || !node.measured?.height).length, 'nodes');
        // console.log('[FlowContext] Nodes missing measurements:', nodes.filter(node => !node.measured?.width || !node.measured?.height).map(node => node));

        return {
          ...state,
          needsLayout: true,
          layoutTrigger: 'WAITING_FOR_MEASUREMENTS',
          pendingLayoutTrigger: layoutTrigger
        };
      }

      // Determine if we should apply layout based on the trigger type
      const shouldApplyLayout = (() => {
        switch (layoutTrigger) {
          case 'FORCE':
            // Always apply when forced
            return true;

          case 'NODE_CHANGE':
            // Apply if the node count has changed
            return nodes.length !== state.nodes.length;

          case 'STRUCTURE_CHANGE':
            // Apply if the graph structure has changed (e.g., new connections)
            return true;

          case 'MEASUREMENTS_READY':
            // Apply if all nodes have their measurements ready
            return allNodesMeasured;

          case 'CONFIG_CHANGE':
            // Apply if the configuration has changed
            return true;

          default:
            // Do not apply layout for other cases
            return false;
        }
      })();

      if (!shouldApplyLayout) {
        return state;
      }

      // At this point, either all nodes have measurements or we're forcing layout

      // Apply fallback dimensions only for nodes without measurements
      const nodesWithDimensions = nodes.map(node => {
        if (node.measured?.width && node.measured?.height) {
          return node; // Use actual measurements
        }

        // Apply fallback dimensions based on node type
        return {
          ...node,
          measured: {
            width: node.type === 'processNode' ? 250 :
              node.type === 'sideProductNode' ? 200 :
                node.type === 'sideProductCompoundNode' ? 400 :
                  node.type === 'outflowsCompoundNode' ? 350 : 300,
            height: node.type === 'processNode' ? 120 :
              node.type === 'sideProductNode' ? 100 :
                node.type === 'sideProductCompoundNode' ? 250 :
                  node.type === 'outflowsCompoundNode' ? 200 : 150,
            ...node.measured
          }
        };
      });

      // Calculate layout with the utility
      const { layoutedNodes, layoutedEdges } = applyDagreLayout(
        nodesWithDimensions,
        edges,
        dagreConfig
      );

      // console.log('[FlowContext | layoutedNodes] layoutedNodes:', layoutedNodes);

      // log current root node id to console
      console.log('[FlowContext | layoutedNodes] rootNodeId:', state.rootNodeId);

      return {
        ...state,
        nodes: layoutedNodes,
        edges: layoutedEdges,
        needsLayout: false,
        layoutTrigger: null,
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
    case 'SELECT_PRODUCT':
      return { ...state, selectedProductId: action.payload };
    case 'SELECT_PROCESS':
      return {
        ...state,
        processSelections: [...state.processSelections, action.payload],
      };
    case 'SAVE_PRODUCTION_CHAIN': {
      // console.log('SAVE_PRODUCTION_CHAIN action dispatched with focal node:', action.payload.focalNodeId);

      if ('focalNodeId' in action.payload) {
        const { focalNodeId } = action.payload;
        return {
          ...state,
          pendingSaveNodeId: focalNodeId,
          lastSavedNodeId: focalNodeId,
          saveStatus: 'pending',
        };
      }

      // console.error('Invalid payload for SAVE_PRODUCTION_CHAIN action');
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
    case 'REQUEST_PROCESS_NODE_CREATION': // This is called when a process is selected from a product node
      return {
        ...state,
        pendingNodeCreation: {
          type: 'process',
          ...action.payload // processId, logicalParentId, includeSideProducts (boolean)
        }
      };
    case 'NODE_CREATION_COMPLETED':
      // console.log('NODE_CREATION_COMPLETED action dispatched. New nodes:', state.nodes);
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
    case 'PROCESS_STRUCTURE_CREATED': {
      const { nodes, edges } = action.payload;
      // console.log('[FlowContext | Process Structure Created] Process structure created, received nodes:', nodes.length);
      // console.log('[FlowContext | Process Structure Created] Nodes:', nodes);

      // Add the new nodes and edges
      return {
        ...state,
        nodes: nodes,
        edges: edges,
        needsLayout: true,
        layoutTrigger: 'STRUCTURE_CHANGE',
        pendingNodeCreation: null
      };
    };
    case 'ROOT_NODE_CREATED': {
      return {
        ...state,
        nodes: action.payload.nodes,
        edges: action.payload.edges,
        rootNodeId: action.payload.rootNodeId,
        nodesReady: true
      };
    }
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
  layoutTrigger: 'FORCE' | 'NODE_CHANGE' | 'STRUCTURE_CHANGE' | 'MEASUREMENTS_READY' | 'CONFIG_CHANGE' | 'WAITING_FOR_MEASUREMENTS' | 'REQUEST_LAYOUT'| null;
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
  const { createRootProductNode } = useNodeOrchestrator(dispatch);
  const processNodeOrchestrator = useProcessNodeOrchestrator(dispatch);

  // Keep the nodesRef in sync with the state.nodes
  React.useEffect(() => {
    nodesRef.current = state.nodes;
  }, [state.nodes]);

  // Handle building of product nodes
  useEffect(() => {
    if (!state.pendingNodeCreation || state.pendingNodeCreation.type !== 'product') return;

    const { productId, amount = 1, isRoot = false } = state.pendingNodeCreation;

    // Use the createRootProductNode which handles everything internally
    const handleProductNodeCreation = async () => {
      try {
        if (!productId) {
          throw new Error('Product ID is undefined');
        }

        // The createRootProductNode function now handles the dispatch internally
        const success = await createRootProductNode(productId, amount, isRoot);

        if (success) {
          dispatch({ type: 'NODE_CREATION_COMPLETED' });
        }
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
    createRootProductNode
  ]);

  // Handle building of process nodes
  useEffect(() => {
    if (!state.pendingNodeCreation || state.pendingNodeCreation.type !== 'process') return;

    const { processId, logicalParentId } = state.pendingNodeCreation;

    const handleProcessNodeCreation = async () => {
      try {
        if (!processId) throw new Error('Process ID is undefined');
        if (!logicalParentId) throw new Error('Logical Parent Node ID is undefined');

        // console.log('[FlowContext | Process Node Creation] Creating process node with ID:', processId);
        // console.log('[FlowContext | Process Node Creation] Logical parent ID (this should be the product node where the process was selected):', logicalParentId);

        // Find parent node
        const logicalParent = state.nodes.find(node => node.id === logicalParentId);
        if (!logicalParent) throw new Error(`[FlowContext | Process Node Creation] Parent node with ID ${logicalParentId} not found`);
        // console.log('[FlowContext | Process Node Creation] Logical parent node found by its logicalParentId:', logicalParent);

        const logicalParentAmount = logicalParent.data.amount as number || 0;
        // console.log('[FlowContext | Process Node Creation] Logical parent amount:', logicalParentAmount);
        const logicalParentProductId = (logicalParent.data.productDetails as { id: string } | undefined)?.id || '';
        // console.log('[FlowContext | Process Node Creation] Logical parent product ID:', logicalParentProductId);

        // Use the orchestrator hook
        await processNodeOrchestrator.createProcessStructure(
          processId,
          logicalParentId,
          logicalParentAmount,
          logicalParentProductId,
          state.nodes as InfluenceNode[],
          state.edges
        );

        // Success is handled by the dispatched PROCESS_STRUCTURE_CREATED action
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
    state.nodes,
    dispatch
  ]);

  // Handle pending save operation
  useEffect(() => {
    if (state.pendingSaveNodeId !== null && memoryDb && state.saveStatus === 'pending') {
      const saveNode = async () => {
        // console.log("Starting serialization with nodeId:", state.pendingSaveNodeId);
        // console.log("Current nodes:", nodesRef.current.length);
        try {
          await serializeProductionChain(
            state.pendingSaveNodeId!,
            nodesRef.current as InfluenceNode[],
            memoryDb
          );
          // console.log("Serialization successful");
          dispatch({ type: 'SAVE_COMPLETE' });
        } catch (error) {
          // console.error('Error saving:', error);
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
      console.log("[FlowContext] Starting load operation");
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
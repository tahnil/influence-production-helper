// contexts/FlowContext.tsx

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
import { InfluenceNode } from '@/types/reactFlowTypes';
import { useProcessNodeOrchestrator } from '@/hooks/useProcessNodeOrchestrator';
import { useNodeOrchestrator } from '@/hooks/useNodeOrchestrator';
import { ConfigurationSaveService } from '@/services/ConfigurationSaveService';
import { ConfigurationLoadService } from '@/services/ConfigurationLoadService';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import useProductImage from '@/hooks/useProductImage';
import ProductDataFetchingService from '@/services/ProductDataFecthingService';
import { NodePlan } from '@/types/nodePlanTypes';

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
  nodePlans: NodePlan[];
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
    mode: 'full' | 'partial';
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
  | { type: 'SET_DESIRED_AMOUNT'; payload: number }
  | { type: 'BATCH_UPDATE'; payload: Partial<FlowState> }
  | { type: 'APPLY_NODE_CHANGES'; payload: NodeChange[] }
  | { type: 'APPLY_EDGE_CHANGES'; payload: EdgeChange[] }
  | { type: 'CONNECT_NODES'; payload: Connection }
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
  | { type: 'LOAD_SAVED_CONFIG'; payload: { nodeId: string, configId: string, mode: 'full' | 'partial' } }
  | { type: 'SAVE_COMPLETE'; payload: { configId: string } }
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
  | { type: 'ROOT_NODE_CREATED'; payload: { nodes: InfluenceNode[], edges: Edge[], rootNodeId: string, nodePlans?: NodePlan[] } }
  | { type: 'CONFIGURATION_REPLACED'; payload: { nodes: InfluenceNode[], edges: Edge[], rootNodeId?: string } }
  | { type: 'CONFIGURATION_PARTIALLY_LOADED'; payload: { nodes: InfluenceNode[], edges: Edge[], replacedNodeId: string, newNodeId: string } }
  ;

// Initial state
const initialState: FlowState = {
  nodes: [],
  edges: [],
  nodePlans: [],
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

/**
 * Reducer function for managing the flow state
 * @param state Current state
 * @param action Action to apply
 * @returns Updated state
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
      const { nodes, edges, dagreConfig, layoutTrigger } = action.payload;

      // Force layout always proceeds
      const forceLayout = layoutTrigger === 'FORCE';

      // For non-forced layouts, check if all nodes have measurements
      const allNodesMeasured = nodes.every(node => node.measured?.width && node.measured?.height);

      if (!forceLayout && !allNodesMeasured && nodes.length > 0) {
        // Queue this layout request until measurements are ready
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
            return true;
          case 'NODE_CHANGE':
            return nodes.length !== state.nodes.length;
          case 'STRUCTURE_CHANGE':
            return true;
          case 'MEASUREMENTS_READY':
            return allNodesMeasured;
          case 'CONFIG_CHANGE':
            return true;
          default:
            return false;
        }
      })();

      if (!shouldApplyLayout) {
        return state;
      }

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
      if ('focalNodeId' in action.payload) {
        const { focalNodeId } = action.payload;
        return {
          ...state,
          pendingSaveNodeId: focalNodeId,
          lastSavedNodeId: focalNodeId,
          saveStatus: 'pending',
        };
      }
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
      const { nodeId, configId, mode } = action.payload;
      return {
        ...state,
        pendingLoadConfig: {
          nodeId,
          configId,
          mode
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
    case 'PROCESS_STRUCTURE_CREATED': {
      const { nodes, edges } = action.payload;
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
        nodePlans: action.payload.nodePlans || [],
        nodesReady: true
      };
    };
    case 'CONFIGURATION_REPLACED': {
      // Handle full configuration replacement
      return {
        ...state,
        nodes: action.payload.nodes,
        edges: action.payload.edges,
        rootNodeId: action.payload.rootNodeId || state.rootNodeId,
        needsLayout: true,
        layoutTrigger: 'FORCE',
        pendingLoadConfig: null,
        loadStatus: 'complete'
      };
    };
    case 'CONFIGURATION_PARTIALLY_LOADED': {
      // Handle partial configuration replacement
      const { nodes: newNodes, edges: newEdges, replacedNodeId, newNodeId } = action.payload;
      
      // Find nodes that need to be removed (the replaced node and its inflows)
      const nodesToRemove = new Set<string>();
      
      // Helper function to recursively find all inflow nodes
      const findInflowNodes = (nodeId: string) => {
        nodesToRemove.add(nodeId);
        
        // Find the node
        const node = state.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        // Check for inflow IDs
        if (Array.isArray(node.data.inflowIds)) {
          node.data.inflowIds.forEach(inflowId => {
            if (!nodesToRemove.has(inflowId)) {
              findInflowNodes(inflowId);
            }
          });
        }
      };
      
      // Start with the node to be replaced
      findInflowNodes(replacedNodeId);
      
      // Filter out nodes that are being removed
      const remainingNodes = state.nodes.filter(node => !nodesToRemove.has(node.id));
      
      // Filter out edges connected to removed nodes
      const remainingEdges = state.edges.filter(
        edge => !nodesToRemove.has(edge.source) && !nodesToRemove.has(edge.target)
      );
      
      // Update logical connections for the replaced node
      // Find nodes that had the replaced node as their logical parent
      const nodesNeedingParentUpdate = state.nodes.filter(
        node => node.data.logicalParentId === replacedNodeId && !nodesToRemove.has(node.id)
      );
      
      // Update these nodes to point to the new node
      const updatedNodes = remainingNodes.map(node => {
        if (nodesNeedingParentUpdate.some(n => n.id === node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              logicalParentId: newNodeId,
              outflowIds: node.data.outflowIds ? 
                ((node.data.outflowIds as string[]).map(id => 
                  id === replacedNodeId ? newNodeId : id)) : 
                undefined
            }
          };
        }
        return node;
      });
      
      // Create edges connecting the new nodes to the remaining graph
      const connectionEdges: Edge[] = [];
      
      // Find the parent node of the replaced node
      const replacedNodeParent = state.nodes.find(
        node => Array.isArray(node.data.inflowIds) && 
               (node.data.inflowIds as string[]).includes(replacedNodeId)
      );
      
      if (replacedNodeParent) {
        // Create an edge from the parent to the new root node
        connectionEdges.push({
          id: `edge-${replacedNodeParent.id}-${newNodeId}`,
          source: replacedNodeParent.id,
          target: newNodeId,
          type: 'custom'
        });
        
        // Update the parent's inflowIds
        const parentIndex = updatedNodes.findIndex(n => n.id === replacedNodeParent.id);
        if (parentIndex !== -1) {
          updatedNodes[parentIndex] = {
            ...updatedNodes[parentIndex],
            data: {
              ...updatedNodes[parentIndex].data,
              inflowIds: ((updatedNodes[parentIndex].data.inflowIds as string[]) || [])
                .map(id => id === replacedNodeId ? newNodeId : id)
            }
          };
        }
      }
      
      return {
        ...state,
        nodes: [...updatedNodes, ...newNodes],
        edges: [...remainingEdges, ...newEdges, ...connectionEdges],
        needsLayout: true,
        layoutTrigger: 'FORCE',
        pendingLoadConfig: null,
        loadStatus: 'complete'
      };
    };
    default:
      return state;
  }
};

// Context interface
interface FlowContextType {
  nodes: Node[];
  edges: Edge[];
  desiredAmount: number;
  nodesReady: boolean;
  rootNodeId: string;
  needsLayout: boolean;
  layoutTrigger: 'FORCE' | 'NODE_CHANGE' | 'STRUCTURE_CHANGE' | 'MEASUREMENTS_READY' | 'CONFIG_CHANGE' | 'WAITING_FOR_MEASUREMENTS' | 'REQUEST_LAYOUT' | null;
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

// Create the context
const FlowContext = createContext<FlowContextType | undefined>(undefined);

// Hook to use the context
export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
};

// Provider component
export const FlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(flowReducer, initialState);
  const nodesRef = useRef<Node[]>([]);
  const { memoryDb } = usePouchDB();
  const { createRootProductNode } = useNodeOrchestrator(dispatch);
  const processNodeOrchestrator = useProcessNodeOrchestrator(dispatch);
  
  // Data fetching hooks for loading configurations
  const { getProductDetails } = useProductDetails();
  const { getProcessesByProductId } = useProcessesByProductId();
  const { getProductImage } = useProductImage();

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

        // Find parent node
        const logicalParent = state.nodes.find(node => node.id === logicalParentId);
        if (!logicalParent) throw new Error(`Parent node with ID ${logicalParentId} not found`);

        const logicalParentAmount = logicalParent.data.amount as number || 0;
        const logicalParentProductId = (logicalParent.data.productDetails as { id: string } | undefined)?.id || '';

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

  // Handle pending save operation using ConfigurationSaveService
  useEffect(() => {
    if (state.pendingSaveNodeId !== null && memoryDb && state.saveStatus === 'pending') {
      const saveConfiguration = async () => {
        try {
          // Use the ConfigurationSaveService to save the configuration
          const configId = await ConfigurationSaveService.saveConfiguration(
            state.pendingSaveNodeId!,
            nodesRef.current as InfluenceNode[],
            memoryDb
          );
          
          dispatch({ 
            type: 'SAVE_COMPLETE',
            payload: { configId }
          });
        } catch (error) {
          console.error('Error saving configuration:', error);
          dispatch({
            type: 'SAVE_ERROR',
            payload: { error: String(error) }
          });
        }
      };
      
      saveConfiguration();
    }
  }, [state.pendingSaveNodeId, state.saveStatus, memoryDb]);

  // Handle configuration loading using ConfigurationLoadService
  useEffect(() => {
    if (!state.pendingLoadConfig || !memoryDb) return;

    console.log('[FlowContext > load configuration] Loading of configuration triggered: ', state.pendingLoadConfig);
    
    const loadConfiguration = async () => {
      try {
        const { nodeId, configId, mode } = state.pendingLoadConfig!;
        
        // Fetch product data for all products that might be needed
        const fetchDataForProduct = async (productId: string) => {
          return await ProductDataFetchingService.fetchProductData(
            productId,
            { getProductDetails, getProcessesByProductId, getProductImage }
          );
        };
        
        // Create a product data map as configurations are loaded
        const productDataMap: Record<string, any> = {};
        
        // Helper function to populate product data map
        const populateProductDataMap = async (productId: string) => {
          if (!productDataMap[productId]) {
            productDataMap[productId] = await fetchDataForProduct(productId);
            console.log(`[FlowContext > load configuration] Populating product data map for product ID: ${productId}: `, productDataMap);
          }
        };
        
        // Fetch the configuration document to get the focal product ID
        const configDoc = await memoryDb.get(configId);
        // Try to access focalProductId from configDoc, fallback to configDoc.data?.focalProductId if needed
        const focalProductId = (configDoc as any).focalProductId ?? (configDoc as any).data?.focalProductId;
        if (focalProductId) {
          await populateProductDataMap(focalProductId);
        }
        
        // Load the configuration using the service
        const result = await ConfigurationLoadService.loadConfiguration(
          configId,
          memoryDb,
          mode,
          mode === 'partial' ? nodeId : undefined,
          productDataMap
        );
        
        // Handle the result based on the mode
        if (mode === 'full') {
          dispatch({
            type: 'CONFIGURATION_REPLACED',
            payload: {
              nodes: result.nodes,
              edges: result.edges,
              rootNodeId: result.rootNodeId
            }
          });
        } else {
          // For partial replacement
          const replacementInfo = result.replacementInfo!;
          dispatch({
            type: 'CONFIGURATION_PARTIALLY_LOADED',
            payload: {
              nodes: result.nodes,
              edges: result.edges,
              replacedNodeId: replacementInfo.originalNodeId,
              newNodeId: replacementInfo.newNodeId
            }
          });
        }
        
        dispatch({ type: 'LOAD_COMPLETE' });
      } catch (error) {
        console.error('[FlowContext] Error loading configuration:', error);
        dispatch({
          type: 'LOAD_ERROR',
          payload: { error: String(error) }
        });
      }
    };
    
    loadConfiguration();
  }, [
    state.pendingLoadConfig,
    memoryDb,
    getProductDetails,
    getProcessesByProductId,
    getProductImage
  ]);

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
        loadStatus: state.loadStatus,
        loadError: state.loadError,
        nodesRef,
        dispatch
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};
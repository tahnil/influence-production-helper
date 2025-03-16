import React, { createContext, useContext, useReducer, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';

// Define the state interface
interface FlowState {
  nodes: Node[];
  edges: Edge[];
  desiredAmount: number;
  nodesReady: boolean;
  rootNodeId: string;
}

// Define the action types
type FlowAction =
  | { type: 'SET_NODES'; payload: Node[] }
  | { type: 'SET_EDGES'; payload: Edge[] }
  | { type: 'SET_DESIRED_AMOUNT'; payload: number }
  | { type: 'SET_NODES_READY'; payload: boolean }
  | { type: 'SET_ROOT_NODE_ID'; payload: string }
  | { type: 'BATCH_UPDATE'; payload: Partial<FlowState> };

// Initial state
const initialState: FlowState = {
  nodes: [],
  edges: [],
  desiredAmount: 1,
  nodesReady: false,
  rootNodeId: 'root'
};

// Create the reducer function
const flowReducer = (state: FlowState, action: FlowAction): FlowState => {
  switch (action.type) {
    case 'SET_NODES':
      return { ...state, nodes: action.payload };
    case 'SET_EDGES':
      return { ...state, edges: action.payload };
    case 'SET_DESIRED_AMOUNT':
      return { ...state, desiredAmount: action.payload };
    case 'SET_NODES_READY':
      return { ...state, nodesReady: action.payload };
    case 'SET_ROOT_NODE_ID':
      return { ...state, rootNodeId: action.payload };
    case 'BATCH_UPDATE':
      return { ...state, ...action.payload };
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
    nodesRef: React.MutableRefObject<Node[]>;
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
  
    return (
      <FlowContext.Provider 
        value={{ 
          nodes: state.nodes, 
          edges: state.edges, 
          desiredAmount: state.desiredAmount, 
          nodesReady: state.nodesReady, 
          rootNodeId: state.rootNodeId,
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
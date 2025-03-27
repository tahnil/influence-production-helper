// hooks/useReactFlowSetup.ts

import { useCallback } from 'react';
import { 
    OnNodesChange, 
    OnEdgesChange, 
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge
} from '@xyflow/react';
import { useFlow } from '@/contexts/FlowContext';

export const useReactFlowSetup = () => {
    const { nodes, edges, dispatch } = useFlow();

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => dispatch({ 
            type: 'SET_NODES', 
            payload: applyNodeChanges(changes, nodes) 
        }),
        [dispatch, nodes]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => dispatch({ 
            type: 'SET_EDGES', 
            payload: applyEdgeChanges(changes, edges) 
        }),
        [dispatch, edges]
    );

    const onConnect: OnConnect = useCallback(
        (connection) => dispatch({ 
            type: 'SET_EDGES', 
            payload: addEdge(connection, edges) 
        }),
        [dispatch, edges]
    );

    return {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect
    };
};
// hooks/useReactFlowSetup.ts

import { useCallback } from 'react';
import { 
    OnNodesChange, 
    OnEdgesChange, 
    OnConnect,
    Connection,
    NodeChange,
    EdgeChange
} from '@xyflow/react';
import { useFlow } from '@/contexts/FlowContext';

export const useReactFlowSetup = () => {
    const { nodes, edges, dispatch } = useFlow();

    // Simplify to dispatch the changes directly to the reducer
    const onNodesChange: OnNodesChange = useCallback(
        (changes: NodeChange[]) => {
            dispatch({ type: 'APPLY_NODE_CHANGES', payload: changes });
        },
        [dispatch]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            dispatch({ type: 'APPLY_EDGE_CHANGES', payload: changes });
        },
        [dispatch]
    );

    const onConnect: OnConnect = useCallback(
        (connection: Connection) => {
            dispatch({ type: 'CONNECT_NODES', payload: connection });
        },
        [dispatch]
    );

    return {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect
    };
};
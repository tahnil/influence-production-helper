// hooks/useReactFlowSetup.ts

import { useCallback } from 'react';
import { 
    Connection,
    NodeChange,
    EdgeChange
} from '@xyflow/react';
import { useFlow } from '@/contexts/FlowContext';

export const useReactFlowSetup = () => {
    const { nodes, edges, dispatch } = useFlow();

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            dispatch({ type: 'APPLY_NODE_CHANGES', payload: changes });
        },
        [dispatch]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            dispatch({ type: 'APPLY_EDGE_CHANGES', payload: changes });
        },
        [dispatch]
    );

    const onConnect = useCallback(
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
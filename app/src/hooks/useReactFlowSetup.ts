// hooks/useReactFlowSetup.ts

import { useCallback } from 'react';
import { 
    Node, 
    Edge, 
    OnNodesChange, 
    OnEdgesChange, 
    OnConnect,
    useNodesState,
    useEdgesState,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges
} from '@xyflow/react';
import { useFlow } from '@/contexts/FlowContext';

export const useReactFlowSetup = () => {
    const { nodes, setNodes, edges, setEdges } = useFlow();

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onConnect: OnConnect = useCallback(
        (connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges]
    );

    return {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect
    };
};
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Node, Edge } from '@xyflow/react';
import { ProductNodeData } from '@/types/reactFlowTypes';

interface FlowContextType {
    nodes: Node<ProductNodeData>[];
    setNodes: React.Dispatch<React.SetStateAction<Node<ProductNodeData>[]>>;
    edges: Edge[];
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export const useFlow = () => {
    const context = useContext(FlowContext);
    if (!context) {
        throw new Error('useFlow must be used within a FlowProvider');
    }
    return context;
};

export const FlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [nodes, setNodes] = useState<Node<ProductNodeData>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    return (
        <FlowContext.Provider value={{ nodes, setNodes, edges, setEdges }}>
            {children}
        </FlowContext.Provider>
    );
};

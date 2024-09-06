import React, { createContext, useContext, useState, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';

interface FlowContextType {
    nodes: Node[];
    edges: Edge[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    nodesRef: React.MutableRefObject<Node[]>;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export const useFlow = () => {
    const context = useContext(FlowContext);
    if (typeof window !== 'undefined' && !context) {
        console.warn('useFlow is being called outside of FlowProvider. Make sure FlowProvider is wrapping your component tree.');
        // Return a default context or throw an error based on your preference
        return {
            nodes: [],
            edges: [],
            setNodes: () => {},
            setEdges: () => {},
            nodesRef: { current: [] },
        };
    }
    return context!;
};

export const FlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const nodesRef = useRef<Node[]>([]);

    return (
        <FlowContext.Provider value={{ nodes, edges, setNodes, setEdges, nodesRef }}>
            {children}
        </FlowContext.Provider>
    );
};
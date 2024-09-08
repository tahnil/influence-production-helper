import React, { createContext, useContext, useState, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';

interface FlowContextType {
    nodes: Node[];
    edges: Edge[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    nodesRef: React.MutableRefObject<Node[]>;
    desiredAmount: number;
    setDesiredAmount: React.Dispatch<React.SetStateAction<number>>;
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
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const nodesRef = useRef<Node[]>([]);
    const [desiredAmount, setDesiredAmount] = useState<number>(1);

    return (
        <FlowContext.Provider value={{ 
            nodes, 
            edges, 
            setNodes, 
            setEdges, 
            nodesRef, 
            desiredAmount, 
            setDesiredAmount 
        }}>
            {children}
        </FlowContext.Provider>
    );
};
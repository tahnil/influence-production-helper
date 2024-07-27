// components/TreeVisualizer/ProcessNodeContent.tsx
import React from 'react';
import { ProcessNode } from '@/types/d3Types';

interface NodeContentProps {
    node: ProcessNode;
}

const NodeContent: React.FC<NodeContentProps> = ({
    node
}) => {
    return (
        <>
            <h4>Process: {node.name}</h4>
            <div>Duration: {node.totalDuration ?? 'N/A'} hours</div>
            <div>Runs: {node.totalRuns ?? 'N/A'}</div>
        </>
    );
};

export default NodeContent;

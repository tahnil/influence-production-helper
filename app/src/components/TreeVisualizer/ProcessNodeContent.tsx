// components/TreeVisualizer/ProcessNodeContent.tsx
import React from 'react';
import { ProcessNode } from '@/types/d3Types';
import ReactDOM from 'react-dom';

interface NodeContentProps {
    node: ProcessNode;
    container: HTMLElement;
}

const NodeContent: React.FC<NodeContentProps> = ({
    node,
    container
}) => {
    const content = (
        <div>
            <h4>Process: {node.name}</h4>
            <div>Duration: {node.totalDuration ?? 'N/A'} hours</div>
            <div>Runs: {node.totalRuns ?? 'N/A'}</div>
        </div>
    );

    return container ? ReactDOM.createPortal(content, container) : null;
};

export default NodeContent;

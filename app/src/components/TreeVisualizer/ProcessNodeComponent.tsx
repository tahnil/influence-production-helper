import React from 'react';
import { ProcessNode } from '@/types/d3Types';

interface ProcessNodeComponentProps {
    nodeData: ProcessNode;
}

const ProcessNodeComponent: React.FC<ProcessNodeComponentProps> = ({ nodeData }) => {
    return (
        <div className="process-node-card">
            <div className="title-section">
                <img src={nodeData.imageBase64} alt={nodeData.name} />
                <span>{nodeData.name}</span>
            </div>
            <div className="stats-section">
                <div>Duration: {nodeData.totalDuration}</div>
                <div>Runs: {nodeData.totalRuns}</div>
            </div>
        </div>
    );
};

export default ProcessNodeComponent;

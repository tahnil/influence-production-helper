// components/TreeVisualizer/ProcessNodeComponent.tsx

import React from 'react';
import { ProcessNode } from '../../types/d3Types';

interface ProcessNodeComponentProps {
    node: ProcessNode;
}

const ProcessNodeComponent: React.FC<ProcessNodeComponentProps> = ({ node }) => {
    return (
        <div className="border rounded-md p-2 bg-white shadow text-sm w-44">
            <div>PROCESS</div>
            <div><strong>{node.name}</strong></div>
            <div>Building: {node.influenceProcess.buildingId}</div>
            <div>Duration: <span className="number-format" data-value={node.totalDuration}></span> hours</div>
            <div>SRs: <span className="number-format" data-value={node.totalRuns}></span></div>
        </div>
    );
};

export default ProcessNodeComponent;

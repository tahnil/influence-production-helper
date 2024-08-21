// components/TreeVisualizer/ProcesssNodeComponent.tsx

import { Handle, Position, NodeProps } from '@xyflow/react';
import { ProcessNodeData } from '@/types/reactFlowTypes';

function ProcessNodeComponent({ data }: { data: ProcessNodeData }) {
    const { 
        name, 
        processData, 
        totalDuration, 
        totalRuns, 
        imageBase64 
    } = data;

    console.log("ProcessNodeCompponent data:", data);

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-300">
            <div className="flex items-center mb-2">
                <img src={imageBase64} alt={name} className="w-12 h-12 mr-2" />
                <span className="text-lg font-semibold">{name}</span>
            </div>
            <div className="text-sm text-gray-700 mb-2">
                <div>Runs: {totalRuns}</div>
                <div>Duration: {totalDuration} hours</div>
            </div>
            {/* Handles for connecting nodes */}
            <Handle
                type="target"
                position={Position.Top}
            />
            <Handle
                type="source"
                position={Position.Bottom}
            />
        </div>
    );
};

export default ProcessNodeComponent;

// components/TreeVisualizer/ProcesssNodeComponent.tsx

import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface ProcessNodeProps {
  id: string;
  data: {
    processName: string;
    inputProducts: string[];
  };
}

const ProcessNode: React.FC<ProcessNodeProps> = ({ id, data }) => {
  const { processName, inputProducts } = data;

    return (
    <div className="process-node">
      <Handle type="target" position={Position.Top} />
      <div>
        <strong>{processName}</strong>
        <ul>
          {inputProducts.map((product) => (
            <li key={product}>{product}</li>
          ))}
        </ul>
            </div>
      <Handle type="source" position={Position.Bottom} id={`source-${id}`} />
        </div>
    );
};

export default ProcessNode;

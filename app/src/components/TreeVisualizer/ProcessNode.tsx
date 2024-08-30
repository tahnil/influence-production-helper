// components/TreeVisualizer/ProcessNode.tsx

import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { InfluenceProcess, ProcessInput } from '@/types/influenceTypes';

export type ProcessNode = Node<
  {
    processDetails: InfluenceProcess;
    inputProducts: ProcessInput[];
  }
>;

const ProcessNode: React.FC<NodeProps<ProcessNode>> = ({ id, data }) => {
  const { processDetails, inputProducts } = data;
  const { name, buildingId, bAdalianHoursPerAction, mAdalianHoursPerSR } = processDetails;

  return (
    <div className="process-node p-4 bg-gray-800 border rounded shadow-sm">
      <Handle type="target" position={Position.Top} className="bg-blue-500" />
      <div className="flex flex-col items-center">
        <strong className="text-white">{name}</strong>
        <p>{id}</p>
        <ul className="list-disc list-inside text-gray-200">
          {inputProducts.map((input) => (
            <li key={input.product.name}>
              {input.product.name} ({input.product.massKilogramsPerUnit} kg, {input.product.volumeLitersPerUnit} L)
            </li>
          ))}
        </ul>
      </div>
      <Handle type="source" position={Position.Bottom} className="bg-green-500" id={`source-${id}`} />
    </div>
  );
};

export default ProcessNode;

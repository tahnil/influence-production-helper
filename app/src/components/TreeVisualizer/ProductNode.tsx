// components/TreeVisualizer/ProductNode.tsx

import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';

export type ProductNode = Node<
  {
    InfluenceProduct: InfluenceProduct;
    image: string;
    processesByProductId: InfluenceProcess[];
    selectedProcessId: string | null;
    onSelectProcess: (processId: string, nodeId: string) => void;
  }
>;

const ProductNode: React.FC<NodeProps<ProductNode>> = ({ id, data }) => {
  const { InfluenceProduct, image, processesByProductId, selectedProcessId, onSelectProcess } = data;

  const { name, massKilogramsPerUnit: weight, volumeLitersPerUnit: volume, type, category } = InfluenceProduct;

  const handleSelectProcess = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const processId = event.target.value;
    onSelectProcess(processId, id);
  };

  return (
    <div className="product-node p-4 bg-black border rounded shadow-sm">
      <Handle type="target" position={Position.Top} className="bg-blue-500" />
      <div className="flex flex-col items-center">
        <h1>{name}</h1>
        <p>{id}</p>
        <p>Stats: {weight} kg | {volume} L | {type} | {category}</p>
        {image && (
          <img
            src={image}
            alt={`${InfluenceProduct.name} image`}
            className="mb-2 w-16 h-16 object-contain"
          />
        )}
        <label htmlFor={`process-select-${id}`} className="text-sm font-medium">
          Select Process for {InfluenceProduct.name}:
        </label>
        <select
          id={`process-select-${id}`}
          value={selectedProcessId || ''}
          onChange={handleSelectProcess}
          className="mt-2 p-1 border rounded text-sm bg-gray-800 nodrag nowheel nopan"
        >
          <option value="">Select a process</option>
          {processesByProductId.map((process: InfluenceProcess) => (
            <option key={process.id} value={process.id}>
              {process.name}
            </option>
          ))}
        </select>
      </div>
      <Handle type="source" position={Position.Bottom} className="bg-green-500" />
    </div>
  );
};

export default ProductNode;

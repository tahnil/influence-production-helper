// components/TreeVisualizer/ProductNode.tsx

import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { InfluenceProduct, InfluenceProcess } from '@/types/influenceTypes';

interface ProductNodeProps {
  id: string;
  data: {
    InfluenceProduct: InfluenceProduct;  // Updated to match the new structure
    ProductionChainData: any;  // Placeholder for now; update as needed
    processes: InfluenceProcess[];  // Array of processes
    onProcessSelected: (processId: string) => void;
  };
}

const handleStyle = { left: 10 };

const ProductNode: React.FC<ProductNodeProps> = ({ id, data }) => {
  const { InfluenceProduct, processes, onProcessSelected } = data;

  const handleSelectProcess = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedProcessId = event.target.value;
      if (selectedProcessId) {
        onProcessSelected(selectedProcessId);
    }
    },
    [onProcessSelected]
  );

  return (
    <div className="product-node">
      <Handle type="target" position={Position.Top} />
      <div>
        <label htmlFor={`process-select-${id}`}>Select Process for {InfluenceProduct.name}:</label>
        <select id={`process-select-${id}`} onChange={handleSelectProcess}>
          <option value="">Select a process</option>
          {processes.map((process: InfluenceProcess) => (
            <option key={process.id} value={process.id}>
              {process.name}
            </option>
          ))}
        </select>
      </div>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  );
};

export default ProductNode;

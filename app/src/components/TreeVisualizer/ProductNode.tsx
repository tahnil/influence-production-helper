import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { InfluenceProduct } from '@/types/influenceTypes';

interface ProductNodeProps {
  id: string;
  data: {
    InfluenceProduct: InfluenceProduct;  // Updated to match the new structure
    ProductionChainData: any;  // Placeholder for now; update as needed
    onProcessSelected: (process: string) => void;
  };
}

const handleStyle = { left: 10 };

const ProductNode: React.FC<ProductNodeProps> = ({ id, data }) => {
  const { InfluenceProduct, onProcessSelected } = data;

  // Assuming 'processes' should come from some aspect of InfluenceProduct or ProductionChainData.
  // Since it's not in InfluenceProduct, you may need to define it or fetch it elsewhere.
  const processes = data.ProductionChainData.processes || [];  // Update this line to get the correct processes list

  const handleSelectProcess = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProcess = event.target.value;
    if (selectedProcess) {
      onProcessSelected(selectedProcess);
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
          {processes.map((process: string) => (
            <option key={process} value={process}>
              {process}
            </option>
          ))}
        </select>
      </div>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  );
};

export default ProductNode;

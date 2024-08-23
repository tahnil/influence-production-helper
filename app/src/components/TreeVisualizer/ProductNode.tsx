import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

interface ProductNodeProps {
    id: string;
  data: {
    product: string;
    processes: string[];
    onProcessSelected: (process: string) => void;
  };
}

const handleStyle = { left: 10 };

const ProductNode: React.FC<ProductNodeProps> = ({ id, data }) => {
  const { product, processes, onProcessSelected } = data;

  const handleSelectProcess = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProcess = event.target.value;
    if (selectedProcess) {
      onProcessSelected(selectedProcess);
    }
  }, [onProcessSelected]);

    return (
    <div className="product-node">
      <Handle type="target" position={Position.Top} />
            <div>
        <label htmlFor={`process-select-${id}`}>Select Process for {product}:</label>
        <select id={`process-select-${id}`} onChange={handleSelectProcess}>
          <option value="">Select a process</option>
                    {processes.map((process) => (
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

// components/ProcessConfigurator.tsx
import React, { useEffect } from 'react';
import { Process, Product } from '../../types/types';
import { generateUniqueId } from '../../lib/uniqueId';
import useProcessesByProductId from '../../hooks/useProcessesByProductId'; // Import the correct hook
import useProcessInputs from '../../hooks/useProcessInputs';
import ProcessSelector from './ProcessSelector';

interface ProcessConfiguratorProps {
  product: Product;
  amount: number;
  selectedProcesses: { [key: string]: string };
  onProcessSelect: (uniqueId: string, processId: string) => void;
  level?: number;
  parentId?: string | null;
}

const ProcessConfigurator: React.FC<ProcessConfiguratorProps> = ({ product, amount, selectedProcesses, onProcessSelect, level = 0, parentId = null }) => {
  const uniqueId = generateUniqueId(product.id, level, parentId);
  const outputProductId = product.id; // Use product ID as outputProductId

  // Use the hook to fetch processes based on outputProductId
  const { processes, loading: processesLoading, error: processesError } = useProcessesByProductId(outputProductId);
  const { inputs, loading: inputsLoading, error: inputsError } = useProcessInputs(selectedProcesses[uniqueId] || '');

  useEffect(() => {
    if (processesError) {
      console.error('Error fetching processes:', processesError);
    }
  }, [processesError]);

  useEffect(() => {
    if (inputsError) {
      console.error('Error fetching inputs:', inputsError);
    }
  }, [inputsError]);

  const handleProcessChange = (value: string) => {
    onProcessSelect(uniqueId, value);
  };

  return (
    <div className="mb-4 ml-5">
      <h3 className="text-md font-semibold mb-2">{product.name}</h3>
      {processesLoading ? (
        <p>Loading processes...</p>
      ) : processesError ? (
        <p className="text-red-500">Failed to load processes.</p>
      ) : (
        <div>
          <p>Processes: {processes.length > 0 ? processes.map(process => process.name).join(', ') : 'No processes available'}</p>
          <ProcessSelector
            processes={processes}
            selectedProcess={selectedProcesses[uniqueId]}
            onProcessChange={handleProcessChange}
          />
        </div>
      )}
      {/* Optional: display inputs if necessary */}
      {inputsLoading && <p>Loading inputs...</p>}
      {inputsError && <p className="text-red-500">Failed to load inputs.</p>}
      {inputs && inputs.length > 0 && (
        <div>
          <h4 className="text-md font-semibold mb-2">Inputs:</h4>
          <ul>
            {inputs.map(input => (
              <li key={input.id}>{input.name}: {input.quantity}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProcessConfigurator;

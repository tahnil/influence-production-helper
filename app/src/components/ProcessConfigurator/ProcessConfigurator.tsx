import React, { useEffect } from 'react';
import { Process, Product, Input } from '../../types/types';
import { generateUniqueId } from '../../lib/uniqueId';
import useProcesses from '../../hooks/useProcesses';
import useProcessInputs from '../../hooks/useProcessInputs';
import ProcessSelector from './ProcessSelector';
import ProcessInputs from './ProcessInputs';

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
  const { processes, loading: processesLoading, error: processesError } = useProcesses(product.id);
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
          <p>Processes: {JSON.stringify(processes)}</p> {/* Add this line */}
          <ProcessSelector
            processes={processes}
            selectedProcess={selectedProcesses[uniqueId]}
            onProcessChange={handleProcessChange}
          />
        </div>
      )}
      {/* Rest of the component */}
    </div>
  );
};

export default ProcessConfigurator;

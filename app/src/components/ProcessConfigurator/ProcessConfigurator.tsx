// components/ProcessConfigurator.tsx
import React, { useEffect, useState } from 'react';
import { Process, Product, Input, ProcessConfiguratorProps } from '../../types/types';
import { generateUniqueId } from '../../lib/uniqueId';
import useProcessesByProductId from '../../hooks/useProcessesByProductId';
import useInputsByProcessId from '../../hooks/useInputsByProcessId';
import ProcessSelector from './ProcessSelector';

const ProcessConfigurator: React.FC<ProcessConfiguratorProps> = ({ product, amount, selectedProcesses, onProcessSelect, level = 0, parentId = null }) => {
  const uniqueId = generateUniqueId(product.id, level, parentId);
  const outputProductId = product.id;

  // Use the existing hooks
  const { processes, loading: processesLoading, error: processesError } = useProcessesByProductId(outputProductId);
  const { inputs, loading: inputsLoading, error: inputsError } = useInputsByProcessId(selectedProcesses[uniqueId]);

  // State to manage intermediate products
  const [intermediateProducts, setIntermediateProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (inputsError) {
      console.error('Error fetching inputs:', inputsError);
    } else if (!inputsLoading && inputs.length > 0) {
      // Extract products from inputs and fetch processes for each
      const newIntermediateProducts = inputs.map(input => input.product);
      console.log(`Intermediate products for ${product.name}:`, newIntermediateProducts);
      setIntermediateProducts(newIntermediateProducts);
    }
  }, [inputs, inputsLoading, inputsError]);

  useEffect(() => {
    if (processesError) {
      console.error('Error fetching processes:', processesError);
    }
  }, [processesError]);

  const handleProcessChange = (value: string) => {
    console.log(`Process selected for ${product.name} at level ${level}:`, value);
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
          <ProcessSelector
            processes={processes}
            selectedProcess={selectedProcesses[uniqueId]}
            onProcessChange={handleProcessChange}
          />
        </div>
      )}
      {inputsLoading ? (
        <p>Loading inputs...</p>
      ) : inputsError ? (
        <p className="text-red-500">Failed to load inputs.</p>
      ) : (
        intermediateProducts.map((product, index) => (
          <ProcessConfigurator
            key={index}
            product={product}
            amount={amount}
            selectedProcesses={selectedProcesses}
            onProcessSelect={onProcessSelect}
            level={level + 1}
            parentId={uniqueId}
          />
        ))
      )}
    </div>
  );
};

export default ProcessConfigurator;

// src/components/ProcessConfigurator/ProcessConfigurator.tsx
import React, { useState, useEffect } from 'react';
import { Process, Product, Input } from '../../types/types';
import { generateUniqueId } from '../../lib/uniqueId';
import { fetchProcesses, fetchInputs } from '../../services/apiService';
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
  const [processes, setProcesses] = useState<Process[]>([]);
  const [inputs, setInputs] = useState<Input[]>([]);
  const uniqueId = generateUniqueId(product.id, level, parentId);

  useEffect(() => {
    const loadProcesses = async () => {
      try {
        const processesData = await fetchProcesses(product.id);
        setProcesses(processesData);
      } catch (error) {
        console.error('Error fetching processes:', error);
      }
    };

    loadProcesses();
  }, [product.id]);

  useEffect(() => {
    const loadInputs = async () => {
      if (selectedProcesses[uniqueId]) {
        try {
          const inputsData = await fetchInputs(selectedProcesses[uniqueId]);
          setInputs(inputsData);
        } catch (error) {
          console.error('Error fetching inputs:', error);
        }
      } else {
        setInputs([]);
      }
    };

    loadInputs();
  }, [uniqueId, selectedProcesses]);

  const handleProcessChange = (value: string) => {
    onProcessSelect(uniqueId, value);
  };

  return (
    <div className="mb-4" style={{ marginLeft: level * 20 }}>
      <h3 className="text-md font-semibold mb-2">{product.name}</h3>
      <ProcessSelector processes={processes} selectedProcess={selectedProcesses[uniqueId]} onProcessChange={handleProcessChange} />
      <ProcessInputs inputs={inputs} amount={amount} selectedProcesses={selectedProcesses} onProcessSelect={onProcessSelect} level={level + 1} parentId={uniqueId} />
    </div>
  );
};

export default ProcessConfigurator;

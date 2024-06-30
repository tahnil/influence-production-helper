// src/components/ProcessConfigurator.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Process, Product, Input, ProcessConfiguratorProps } from '../types/types';

// Generate a unique identifier for each product instance based on product ID and level
const generateUniqueId = (productId: string, level: number) => `${productId}-${level}`;

const ProcessConfigurator: React.FC<ProcessConfiguratorProps> = ({ product, amount, selectedProcesses, onProcessSelect, level = 0 }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [inputs, setInputs] = useState<Input[]>([]);
  const uniqueId = generateUniqueId(product.id, level);

  useEffect(() => {
    axios.get(`/api/processes?productId=${product.id}`)
      .then(response => {
        setProcesses(response.data);
      })
      .catch(error => {
        console.error('Error fetching processes:', error);
      });
  }, [product.id]);

  useEffect(() => {
    if (selectedProcesses[uniqueId]) {
      axios.get(`/api/inputs?processId=${selectedProcesses[uniqueId]}`)
        .then(response => {
          setInputs(response.data);
        })
        .catch(error => {
          console.error('Error fetching inputs:', error);
        });
    } else {
      setInputs([]);
    }
  }, [uniqueId, selectedProcesses]);

  const handleProcessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const processId = e.target.value;
    onProcessSelect(uniqueId, processId);
  };

  return (
    <div className="mb-4" style={{ marginLeft: level * 20 }}>
      <h3 className="text-md font-semibold mb-2">{product.name}</h3>
      <label>
        Select Process:
        <select
          value={selectedProcesses[uniqueId] || ''}
          onChange={handleProcessChange}
          className="w-full border rounded-lg p-2 mb-2"
        >
          <option value="">Select a process</option>
          {processes.map(process => (
            <option key={process.id} value={process.id}>{process.name}</option>
          ))}
        </select>
      </label>
      <div>
        {inputs.map(input => (
          <ProcessConfigurator
            key={generateUniqueId(input.product.id, level + 1)}
            product={input.product}
            amount={amount}
            selectedProcesses={selectedProcesses}
            onProcessSelect={onProcessSelect}
            level={level + 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ProcessConfigurator;

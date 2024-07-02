// src/components/ProcessConfigurator.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Process, Product, Input, ProcessConfiguratorProps } from '../types/types';
import { generateUniqueId } from '../lib/uniqueId';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const ProcessConfigurator: React.FC<ProcessConfiguratorProps> = ({ product, amount, selectedProcesses, onProcessSelect, level = 0, parentId = null }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [inputs, setInputs] = useState<Input[]>([]);
  const uniqueId = generateUniqueId(product.id, level, parentId);

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

  const handleProcessChange = (value: string) => {
    onProcessSelect(uniqueId, value);
  };

  return (
    <div className="mb-4 ml-6">
      <h3 className="text-md font-semibold mb-2">{product.name}</h3>
      <Label htmlFor="process-select">Select a process</Label>
        <Select onValueChange={handleProcessChange} defaultValue={selectedProcesses[uniqueId] || ''}>
          <SelectTrigger id="process-select" className="w-full border rounded-lg p-2 mb-2">
            <SelectValue placeholder="---" />
          </SelectTrigger>
          <SelectContent>
            {processes.map(process => (
              <SelectItem key={process.id} value={process.id}>{process.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      <div>
        {inputs.map(input => (
          <ProcessConfigurator
            key={generateUniqueId(input.product.id, level + 1, uniqueId)}
            product={input.product}
            amount={amount}
            selectedProcesses={selectedProcesses}
            onProcessSelect={onProcessSelect}
            level={level + 1}
            parentId={uniqueId}
          />
        ))}
      </div>
    </div>
  );
};

export default ProcessConfigurator;

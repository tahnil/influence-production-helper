// src/components/ProcessConfigurator/ProcessInputs.tsx
import React from 'react';
import { Input, Product } from '../../types/types';
import ProcessConfigurator from './ProcessConfigurator';
import { generateUniqueId } from '../../lib/uniqueId';

interface ProcessInputsProps {
  inputs: Input[];
  amount: number;
  selectedProcesses: { [key: string]: string };
  onProcessSelect: (uniqueId: string, processId: string) => void;
  level: number;
  parentId: string;
}

const ProcessInputs: React.FC<ProcessInputsProps> = ({ inputs, amount, selectedProcesses, onProcessSelect, level, parentId }) => {
  return (
    <div>
      {inputs.map(input => (
        <ProcessConfigurator
          key={generateUniqueId(input.product.id, level, parentId)}
          product={input.product}
          amount={amount}
          selectedProcesses={selectedProcesses}
          onProcessSelect={onProcessSelect}
          level={level}
          parentId={parentId}
        />
      ))}
    </div>
  );
};

export default ProcessInputs;

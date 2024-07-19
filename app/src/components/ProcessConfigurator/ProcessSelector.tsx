// src/components/ProcessConfigurator/ProcessSelector.tsx
import React from 'react';
import { Process } from '../../types/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ProcessSelectorProps {
  processes: Process[];
  selectedProcess?: string;
  onProcessChange: (value: string) => void;
}

const ProcessSelector: React.FC<ProcessSelectorProps> = ({ processes, selectedProcess, onProcessChange }) => {
  if (!Array.isArray(processes)) {
    return <p>No processes available</p>;
  }

  return (
    <div>
      <Label htmlFor="process-select">Select a process</Label>
      <Select onValueChange={onProcessChange} defaultValue={selectedProcess || ''}>
        <SelectTrigger id="process-select" className="w-full border rounded-lg p-2 mb-2">
          <SelectValue placeholder="---" />
        </SelectTrigger>
        <SelectContent>
          {processes.map(process => (
            <SelectItem key={process.id} value={process.id}>{process.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
export default ProcessSelector;

import React, { useState, useEffect } from 'react';
import { Process, Product } from '../types/types';
interface Input {
  product: Product;
  unitsPerSR: string;
}

interface ProcessSelectorProps {
  productId: string;
  onSelect: (process: Process) => void;
  onInputsLoaded: (inputs: Input[]) => void;
}

const ProcessSelector: React.FC<ProcessSelectorProps> = ({ productId, onSelect, onInputsLoaded }) => {
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [inputs, setInputs] = useState<Input[]>([]);

  useEffect(() => {
    fetch(`/api/processes?productId=${productId}`)
      .then(response => response.json())
      .then(data => setProcesses(data));
  }, [productId]);

  const handleSelect = () => {
    if (selectedProcess) {
      fetch(`/api/inputs?processId=${selectedProcess.id}`)
        .then(response => response.json())
        .then(data => {
          setInputs(data);
          onInputsLoaded(data);
          onSelect(selectedProcess);
        });
    }
  };

  return (
    <div>
      <h2>Select Process</h2>
      <select onChange={e => setSelectedProcess(processes.find(p => p.id === e.target.value) || null)}>
        <option value="">Select a process</option>
        {processes.map(process => (
          <option key={process.id} value={process.id}>
            {process.name}
          </option>
        ))}
      </select>
      <button onClick={handleSelect}>Next</button>
    </div>
  );
};

export default ProcessSelector;

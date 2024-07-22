import React from 'react';
import { InfluenceProcess } from '@/types/influenceTypes';

interface ProcessSelectorProps {
    processes: InfluenceProcess[];
    onSelect: (process: InfluenceProcess) => void;
}

const ProcessSelector: React.FC<ProcessSelectorProps> = ({ processes, onSelect }) => {
    return (
        <select onChange={(e) => {
            const selectedProcess = processes.find(process => process.id === e.target.value);
            if (selectedProcess) onSelect(selectedProcess);
        }}>
            <option value="">Select a Process</option>
            {processes.map(process => (
                <option key={process.id} value={process.id}>{process.name}</option>
            ))}
        </select>
    );
};

export default ProcessSelector;

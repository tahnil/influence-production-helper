import React from 'react';
import { InfluenceProcess } from '@/types/influenceTypes';

interface ProcessSelectorProps {
    processes: InfluenceProcess[];
    onSelect: (processId: string) => void;
}

const ProcessSelector: React.FC<ProcessSelectorProps> = ({ processes, onSelect }) => {
    // console.log('ProcessSelector processes:', processes);
    return (
        <select onChange={(e) => onSelect(e.target.value)}>
            <option value="">Select a Process</option>
            {processes.map(process => (
                <option key={process.id} value={process.id}>{process.name}</option>
            ))}
        </select>
    );
};

export default ProcessSelector;

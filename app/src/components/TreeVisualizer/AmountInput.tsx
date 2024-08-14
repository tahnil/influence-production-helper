// components/TreeVisualizer/AmountInput.tsx
import React from 'react';
import { Input } from '@/components/ui/input'; // Adjust the import path as necessary
import { Label } from '@/components/ui/label';

interface AmountInputProps {
    desiredAmount: number;
    onChange: (desiredAmount: number) => void;
    label: string;
    className?: string;
}

const AmountInput: React.FC<AmountInputProps> = ({ desiredAmount, onChange, label, className }) => {
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        onChange(value || 1);
    };

    return (
        <div>
            <Label htmlFor="amount-input">{label}</Label>
            <Input 
                type="number" 
                id="amount-input" 
                value={desiredAmount} 
                onChange={handleInputChange} 
                className={className}
            />
        </div>
    );
};

export default AmountInput;

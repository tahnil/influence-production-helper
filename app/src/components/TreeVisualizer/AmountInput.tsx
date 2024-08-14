// components/TreeVisualizer/AmountInput.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumericFormat } from 'react-number-format';


interface AmountInputProps {
    desiredAmount: number;
    onChange: (desiredAmount: number) => void;
    label: string;
    className?: string;
}

const AmountInput: React.FC<AmountInputProps> = ({ desiredAmount, onChange, label, className }) => {
    const handleInputChange = (event: { floatValue: number | undefined }) => {
        const value = event.floatValue !== undefined ? event.floatValue : 1;
        onChange(value || 1);
    };

    return (
        <div>
            <Label htmlFor="amount-input">{label}</Label>
            <NumericFormat 
                id="amount-input" 
                value={desiredAmount} 
                thousandSeparator=","
                decimalScale={2}
                fixedDecimalScale={false}
                onValueChange={handleInputChange}
                customInput={Input}
                className={className}
            />
        </div>
    );
};

export default AmountInput;

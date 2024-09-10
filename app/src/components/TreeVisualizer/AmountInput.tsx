// components/TreeVisualizer/AmountInput.tsx

import React from 'react';
import { NumericFormat } from 'react-number-format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlow } from '@/contexts/FlowContext';

interface AmountInputProps {
    label: string;
    className?: string;
}

const AmountInput: React.FC<AmountInputProps> = ({ 
    label, 
    className 
}) => {
    const { desiredAmount, setDesiredAmount } = useFlow();

    const handleInputChange = (event: { floatValue: number | undefined }) => {
        const value = event.floatValue !== undefined ? event.floatValue : 1;
        setDesiredAmount(value);
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
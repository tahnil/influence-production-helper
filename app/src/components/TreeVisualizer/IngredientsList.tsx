// components/TreeVisualizer/IngredientsList.tsx

import React from 'react';
import { ClipboardCopy } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Ingredient } from '@/utils/TreeVisualizer/useIngredientsList';

interface IngredientsListProps {
    ingredients: Ingredient[];
}

const IngredientsList: React.FC<IngredientsListProps> = ({ ingredients }) => {
    const { toast } = useToast();

    if (ingredients.length === 0) {
        return null;
    }

    const copyToClipboard = () => {
        const text = ingredients.map(ing => `${ing.name}\t${ing.rawAmount}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: "Copied to clipboard",
                description: "The raw ingredients list has been copied to your clipboard.",
                duration: 3000,
            });
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast({
                title: "Copy failed",
                description: "Failed to copy the ingredients list. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        });
    };
    
    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Ingredients List</h3>
                <ClipboardCopy
                    size={20}
                    onClick={copyToClipboard}
                    className="text-falconWhite hover:text-fuscousGray-400 transition-colors cursor-pointer"
                />
            </div>
            <ul className="list-disc pl-4">
                {ingredients.map((ingredient, index) => (
                    <li key={index} className="mb-1">
                        {ingredient.name}: {ingredient.amount} {ingredient.scale} {ingredient.unit}
                        </li>
                ))}
            </ul>
        </div>
    );
};

export default IngredientsList;
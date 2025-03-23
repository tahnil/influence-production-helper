// components/TreeVisualizer/IngredientsList.tsx

import React, { useState } from 'react';
import { ClipboardCopy, LayoutList, List } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Ingredient, IngredientsListMode } from '@/utils/TreeVisualizer/useIngredientsList';
import { Button } from '@/components/ui/button';

interface IngredientsListProps {
    rawMaterialIngredients: Ingredient[];
    allProductIngredients: Ingredient[];
}

const IngredientsList: React.FC<IngredientsListProps> = ({
    rawMaterialIngredients,
    allProductIngredients
}) => {
    const { toast } = useToast();
    const [activeMode, setActiveMode] = useState<IngredientsListMode>('rawMaterials');

    const ingredients = activeMode === 'rawMaterials' ? rawMaterialIngredients : allProductIngredients;

    if (rawMaterialIngredients.length === 0 && allProductIngredients.length === 0) {
        return null;
    }

    const copyToClipboard = () => {
        const text = ingredients.map(ing => `${ing.name}\t${ing.rawAmount}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: "Copied to clipboard",
                description: `The ${activeMode === 'rawMaterials' ? 'raw materials' : 'full product'} list has been copied to your clipboard.`,
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
                <h3 className="text-lg font-semibold">
                    Ingredients List
                </h3>
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1 text-falconWhite hover:text-fuscousGray-400 transition-colors cursor-pointer"
                    >
                        <p className="text-sm">
                            Copy
                        </p>
                        <ClipboardCopy
                            size={20}
                        />
                    </button>
                </div>
            </div>
            {/* Controls for switching between raw materials and all products */}
            <div>
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={activeMode === 'rawMaterials' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveMode('rawMaterials')}
                            className="flex items-center gap-1"
                        >
                            <LayoutList size={16} />
                            <span className="sr-only sm:not-sr-only sm:inline-block">Raw Materials</span>
                        </Button>
                        <Button
                            variant={activeMode === 'allProducts' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveMode('allProducts')}
                            className="flex items-center gap-1"
                        >
                            <List size={16} />
                            <span className="sr-only sm:not-sr-only sm:inline-block">All Products</span>
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-betwee mb-4">
                    <p className="text-sm text-muted-foreground">
                        {activeMode === 'rawMaterials' ? 'Inputs only' : 'Full chain'}
                    </p>
                </div>
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
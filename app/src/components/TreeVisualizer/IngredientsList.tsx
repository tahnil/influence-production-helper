// components/TreeVisualizer/IngredientsList.tsx

// display logic for the ingredients list
// retrieve the ingredients list from state

import React from 'react';

interface IngredientsListProps {
    ingredients: string[];
}

const IngredientsList: React.FC<IngredientsListProps> = ({ ingredients }) => {
    if (ingredients.length === 0) {
        return null;
    }
    
    return (
        <div>
            <h3 className="text-lg font-semibold">Ingredients List</h3>
            <ul className="list-disc pl-4">
                {ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                ))}
            </ul>
        </div>
    );
};

export default IngredientsList;

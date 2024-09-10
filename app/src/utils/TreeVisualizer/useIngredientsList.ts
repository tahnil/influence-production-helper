// utils/TreeVisualizer/useIngredientsList.ts

// get called from useEffect in TreeRenderer.tsx
// get triggered by change in nodes state
// retrieve the ingredients list from nodes
// write the ingredients list to state

import { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { ProductNodeData, ProcessNodeData } from '@/types/reactFlowTypes';
import { formatNumber } from '@/utils/formatNumber';

export interface Ingredient {
    name: string;
    amount: number;
    unit: string;
}

function useIngredientsList(nodes: Node[]): Ingredient[] {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    useEffect(() => {
        const isLeafNode = (node: Node): boolean => {
            if (node.type === 'productNode') {
                const childNodes = nodes.filter(n => n.parentId === node.id);
                if (childNodes.length === 0) {
                    return true;
                }
                return childNodes.every(child => {
                    if (child.type === 'processNode') {
                        const processData = child.data as ProcessNodeData;
                        return processData.inputProducts.length === 0;
                    }
                    return false;
                });
            }
            return false;
        };

        const newIngredients = nodes
            .filter(isLeafNode)
            .map(node => {
                const data = node.data as ProductNodeData;
                const { formattedValue, unit } = formatNumber(data.amount, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    scaleForUnit: true,
                    scaleType: 'units',
                });
                return {
                    name: data.productDetails.name,
                    amount: parseFloat(formattedValue),
                    unit: unit
                };
            })
            .reduce((acc, curr) => {
                const existingIngredient = acc.find(ing => ing.name === curr.name);
                if (existingIngredient) {
                    existingIngredient.amount += curr.amount;
                } else {
                    acc.push(curr);
                }
                return acc;
            }, [] as Ingredient[]);

        setIngredients(newIngredients);
    }, [nodes]);

    return ingredients;
}

export default useIngredientsList;
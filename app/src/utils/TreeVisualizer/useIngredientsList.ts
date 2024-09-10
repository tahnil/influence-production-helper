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
    amount: string;
    scale: string;
    rawAmount: number;
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
                const { formattedValue, scale, unit } = formatNumber(data.amount, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    scaleForUnit: true,
                    scaleType: 'units',
                });
                return {
                    name: data.productDetails.name,
                    amount: formattedValue,
                    scale,
                    rawAmount: data.amount,
                    unit
                };
            })
            .reduce((acc: Ingredient[], curr: Ingredient) => {
                const existingIngredient = acc.find(ing => ing.name === curr.name);
                if (existingIngredient) {
                    const { formattedValue, scale, unit } = formatNumber(
                        existingIngredient.rawAmount + curr.rawAmount,
                        {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                            scaleForUnit: true,
                            scaleType: 'units',
                        }
                    );
                    existingIngredient.amount = formattedValue;
                    existingIngredient.scale = scale;
                    existingIngredient.rawAmount += curr.rawAmount;
                    existingIngredient.unit = unit;
                } else {
                    acc.push(curr);
                }
                return acc;
            }, []);

        setIngredients(newIngredients);
    }, [nodes]);

    return ingredients;
}

export default useIngredientsList;
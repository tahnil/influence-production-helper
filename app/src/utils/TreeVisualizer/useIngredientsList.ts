// utils/TreeVisualizer/useIngredientsList.ts

import { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { ProductNodeData } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNodeData } from '@/components/TreeVisualizer/ProcessNode';
import { formatNumber } from '@/utils/formatNumber';
import { InfluenceNode } from '@/types/reactFlowTypes';

export interface Ingredient {
    name: string;
    amount: string;
    scale: string;
    rawAmount: number;
    unit: string;
}

export type IngredientsListMode = 'rawMaterials' | 'allProducts';

function useIngredientsList(nodes: InfluenceNode[], mode: IngredientsListMode = 'rawMaterials'): Ingredient[] {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    useEffect(() => {
        // Function to check if a node is a leaf node (product with no inflows)
        const isLeafNode = (node: InfluenceNode): boolean => {
            if (node.type === 'productNode') {
                const childNodes = nodes.filter(n => n.data.logicalParentId === node.id);
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

        // Function to get all product nodes
        const getProductNodes = (nodes: InfluenceNode[]): InfluenceNode[] => {
            return nodes.filter(node => node.type === 'productNode');
        };

        // Choose nodes based on the selected mode
        const nodesToInclude = mode === 'rawMaterials' 
            ? nodes.filter(isLeafNode)
            : getProductNodes(nodes);

        const newIngredients = nodesToInclude
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
    }, [nodes, mode]);

    return ingredients;
}

export default useIngredientsList;
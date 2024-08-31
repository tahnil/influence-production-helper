// utils/TreeVisualizer/useIngredientsList.ts

// get called from useEffect in TreeRenderer.tsx
// get triggered by change in nodes state
// retrieve the ingredients list from nodes
// write the ingredients list to state

import { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { ProductNodeData, ProcessNodeData } from '@/types/reactFlowTypes';


function useIngredientsList(nodes: Node[]): string[] {
    const [ingredients, setIngredients] = useState<string[]>([]);

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
            .map(node => (node.data as ProductNodeData).productDetails.name)
            .filter((value, index, self) => self.indexOf(value) === index);

        setIngredients(newIngredients);
    }, [nodes]);

    return ingredients;
}

export default useIngredientsList;

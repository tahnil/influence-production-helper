// utils/TreeVisualizer/useIngredientsList.ts

// get called from useEffect in TreeRenderer.tsx
// get triggered by change in nodes state
// retrieve the ingredients list from nodes
// write the ingredients list to state

import { Node } from '@xyflow/react';
import { ProductNodeData, ProcessNodeData } from '@/types/reactFlowTypes';

function useIngredientsList(nodes: Node[]): string[] {
    // Function to determine if a node is a leaf node
    const isLeafNode = (node: Node): boolean => {
        if (node.type === 'productNode') {
            // Check if the product node has no children or only has a process node with no children
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

    // Aggregate ingredients from leaf nodes
    const ingredients = nodes
        .filter(isLeafNode)
        .map(node => (node.data as ProductNodeData).InfluenceProduct.name)
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

    return ingredients;
}

export default useIngredientsList;

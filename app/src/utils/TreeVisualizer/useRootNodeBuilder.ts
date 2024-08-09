// components/TreeVisualizer/useRootNodeBuilder.ts
// 
// — State Management: Uses useState to manage the state of the root node.
// — Building Root Node: Builds the root node based on the selected product and its associated processes.

import { useState, useEffect } from 'react';
import { ProductNode } from '@/types/d3Types';
import { buildProductNode } from '@/utils/TreeVisualizer/buildProductNode';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';

const useRootNodeBuilder = ({ 
    selectedProductId, 
    influenceProducts, 
    processes 
}: { 
    selectedProductId: string | null, 
    influenceProducts: InfluenceProduct[], 
    processes: InfluenceProcess[] 
}) => {
    const [rootNode, setRootNode] = useState<ProductNode | null>(null);

    useEffect(() => {
        if (selectedProductId && influenceProducts) {
            const selectedProduct = influenceProducts.find((product: InfluenceProduct) => product.id === selectedProductId);
            if (selectedProduct) {
                const newNode = buildProductNode(selectedProduct, processes);
                setRootNode(newNode);
            }
        }
    }, [selectedProductId, influenceProducts, processes]);

    return { rootNode };
};

export default useRootNodeBuilder;

// components/TreeVisualizer/useRootNodeBuilder.ts
// 
// — State Management: Uses useState to manage the state of the root node.
// — Building Root Node: Builds the root node based on the selected product and its associated processes.

import { useState, useEffect } from 'react';
import { ProductNode } from '@/types/d3Types';
import { buildProductNode } from '@/components/TreeVisualizer/buildProductNode';

const useRootNodeBuilder = ({ selectedProductId, influenceProducts, processes }) => {
    const [rootNode, setRootNode] = useState<ProductNode | null>(null);

    useEffect(() => {
        console.log('[useRootNodeBuilder] selectedProductId:', selectedProductId);
        if (selectedProductId && influenceProducts) {
            const selectedProduct = influenceProducts.find(product => product.id === selectedProductId);
            // console.log('[useRootNodeBuilder] selectedProduct:', selectedProduct);
            if (selectedProduct) {
                const newNode = buildProductNode(selectedProduct, processes);
                setRootNode(newNode);
                // console.log('[useRootNodeBuilder] newNode:', newNode);
            }
        }
    }, [selectedProductId, influenceProducts, processes]);

    return { rootNode };
};

export default useRootNodeBuilder;

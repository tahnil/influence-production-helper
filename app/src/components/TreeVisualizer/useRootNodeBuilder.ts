// components/TreeVisualizer/useRootNodeBuilder.ts

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

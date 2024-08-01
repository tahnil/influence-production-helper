// components/TreeVisualizer/useRootNodeBuilder.ts

import { useState, useEffect } from 'react';
import { ProductNode } from '@/types/d3Types';
import { generateUniqueId } from '@/utils/generateUniqueId';

const useRootNodeBuilder = ({ selectedProductId, influenceProducts }) => {
    const [rootNode, setRootNode] = useState<ProductNode | null>(null);

    useEffect(() => {
        console.log('[useRootNodeBuilder] selectedProductId:', selectedProductId);
        if (selectedProductId && influenceProducts) {
            const selectedProduct = influenceProducts.find(product => product.id === selectedProductId);
            console.log('[useRootNodeBuilder] selectedProduct:', selectedProduct);
            if (selectedProduct) {
                const newNode: ProductNode = {
                    id: generateUniqueId(),
                    name: selectedProduct.name,
                    nodeType: 'product',
                    productData: selectedProduct,
                    amount: 0,
                    totalWeight: 0,
                    totalVolume: 0,
                    children: [],
                    _children: [],
                    processes: []
                };
                setRootNode(newNode);
                console.log('[useRootNodeBuilder] newNode:', newNode);
            }
        }
    }, [selectedProductId, influenceProducts]);

    return { rootNode };
};

export default useRootNodeBuilder;

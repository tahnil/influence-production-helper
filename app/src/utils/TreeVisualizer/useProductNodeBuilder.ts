// utils/TreeVisualizer/useProductNodeBuilder.ts

import { useCallback } from 'react';
import { Node } from '@xyflow/react'
import { generateUniqueId } from '../generateUniqueId';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import useProductImage from '@/hooks/useProductImage';
import { ProductNodeData } from '@/components/TreeVisualizer/ProductNode';

// This hook should focus purely on building the node data structure
const useProductNodeBuilder = () => {
    const { getProductDetails } = useProductDetails();
    const { getProcessesByProductId } = useProcessesByProductId();
    const { getProductImage } = useProductImage();

    const buildProductNode = useCallback(async (
        selectedProductId: string,
        amount: number,
    ): Promise<Node<ProductNodeData> | null> => {
        try {
            const [productDetails, processesByProductId, productImage] = await Promise.all([
                getProductDetails(selectedProductId),
                getProcessesByProductId(selectedProductId),
                getProductImage(selectedProductId),
            ]);

            const weight: number = productDetails.massKilogramsPerUnit ? parseFloat(productDetails.massKilogramsPerUnit) : 0;
            const totalWeight = amount * weight;

            const volume: number = productDetails.volumeLitersPerUnit ? parseFloat(productDetails.volumeLitersPerUnit) : 0;
            const totalVolume = amount * volume;

            const newProductNode: Node<ProductNodeData> = {
                id: generateUniqueId(),
                type: 'productNode',
                position: { x: 0, y: 0 },
                data: {
                    amount,
                    totalWeight,
                    totalVolume,
                    productDetails,
                    image: productImage,
                    processesByProductId,
                    inflowIds: [],
                    outflowIds: [],
                    // Not including callbacks - these will be added by the consumer
                }
            };

            return newProductNode;
        } catch (err) {
            console.error('[useProductNodeBuilder] Error:', err);
            return null;
        }
    }, [getProductDetails, getProcessesByProductId, getProductImage]);

    return { buildProductNode };
};

export default useProductNodeBuilder;
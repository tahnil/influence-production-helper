// utils/TreeVisualizer/useProductNodeBuilder.ts

import { useCallback } from 'react';
import { Node } from '@xyflow/react'
import { generateUniqueId } from '../generateUniqueId';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import useProductImage from '@/hooks/useProductImage';

const useProductNodeBuilder = () => {
    const { getProductDetails } = useProductDetails();
    const { getProcessesByProductId } = useProcessesByProductId();
    const { getProductImage } = useProductImage();

    const buildProductNode = useCallback(async (
        selectedProductId: string,
        amount: number,
    ): Promise<Node | null> => {
        try {
            const [productDetails, processesByProductId, productImage] = await Promise.all([
                getProductDetails(selectedProductId),
                getProcessesByProductId(selectedProductId),
                getProductImage(selectedProductId),
            ]);

            const weight: number = productDetails.massKilogramsPerUnit ? parseFloat(productDetails.massKilogramsPerUnit) : 0;
            const totalWeight = amount * weight;

            const volume: number = productDetails.volumeLitersPerUnit? parseFloat(productDetails.volumeLitersPerUnit) : 0;
            const totalVolume = amount * volume;

            const newProductNode: Node = {
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
                },
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
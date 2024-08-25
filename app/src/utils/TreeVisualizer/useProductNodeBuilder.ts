// utils/TreeVisualizer/useProductNodeBuilder.ts

import { useCallback } from 'react';
import { Node } from '@xyflow/react';
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
        selectedProcessId: string | null,
        onSelectProcess: (processId: string, nodeId: string) => void,
        parentId?: string,
    ): Promise<Node | null> => {
        try {
            const [productDetails, processesByProductId, productImage] = await Promise.all([
                getProductDetails(selectedProductId),
                getProcessesByProductId(selectedProductId),
                getProductImage(selectedProductId),
            ]);

            const newProductNode: Node = {
                id: generateUniqueId(),
                type: 'productNode',
                position: { x: 0, y: 0 },
                parentId: parentId || undefined, 
                data: {
                    InfluenceProduct: productDetails,
                    image: productImage,
                    processesByProductId,
                    selectedProcessId,
                    onSelectProcess,
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
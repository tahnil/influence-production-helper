// components/TreeVisualizer/useProductNodeBuilder.ts
// 
// — Fetching Product Details and Processes: Uses useProductDetails and useProcessesByProductId to fetch the 
//   necessary data.
// — Building Product Node: Constructs a new product node with the fetched details and processes.
// — getProductNode Function: An asynchronous function to fetch details and processes for a specific product 
//   and build a product node.

import { useEffect, useCallback } from 'react';
import { ProductNode } from '@/types/d3Types';
import { buildProductNode } from '@/utils/TreeVisualizer/buildProductNode';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';

const useProductNodeBuilder = ({ 
    selectedProductId 
}: { 
    selectedProductId: string | null 
}) => {
    const { productDetails, loading: productLoading, error: productError, getProductDetails } = useProductDetails();
    const { processesByProductId, loading: processesLoading, error: processesError, getProcessesByProductId } = useProcessesByProductId();

    useEffect(() => {
        if (selectedProductId) {
            getProductDetails(selectedProductId);
            getProcessesByProductId(selectedProductId);
        }
    }, [selectedProductId, getProductDetails, getProcessesByProductId]);

    const buildCurrentProductNode = useCallback((): ProductNode | null => {
        if (productDetails && !productLoading && !productError && processesByProductId && !processesLoading && !processesError) {
            return buildProductNode(productDetails, processesByProductId, 0);
        }
        return null;
    }, [productDetails, productLoading, productError, processesByProductId, processesLoading, processesError]);

    const getProductNode = useCallback(async (productId: string, requiredAmount: number) => {
        try {
            const [details, processList] = await Promise.all([getProductDetails(productId), getProcessesByProductId(productId)]);
            if (details && processList) {
                return buildProductNode(details, processList, requiredAmount);
            }
            throw new Error('Product details or processes not available');
        } catch (error) {
            console.error('[useProductNodeBuilder] Error:', error);
            throw error;
        }
    }, [getProductDetails, getProcessesByProductId]);

    return { buildCurrentProductNode, productLoading, productError, processesLoading, processesError, getProductNode };
};

export default useProductNodeBuilder;

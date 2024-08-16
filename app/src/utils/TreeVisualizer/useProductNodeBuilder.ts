// components/TreeVisualizer/useProductNodeBuilder.ts
// 
// — Fetching Product Details and Processes: Uses useProductDetails and useProcessesByProductId to fetch the 
//   necessary data.
// — Building Product Node: Constructs a new product node with the fetched details and processes.
// — getProductNode Function: An asynchronous function to fetch details and processes for a specific product 
//   and build a product node.

import { useState, useEffect, useCallback } from 'react';
import { ProductNode } from '@/types/d3Types';
import { buildProductNode } from '@/utils/TreeVisualizer/buildProductNode';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';

const useProductNodeBuilder = ({ selectedProductId }: { selectedProductId: string | null }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { productDetails, loading: productLoading, error: productError, getProductDetails } = useProductDetails();
    const { processesByProductId, loading: processesLoading, error: processesError, getProcessesByProductId } = useProcessesByProductId();

    useEffect(() => {
        if (selectedProductId) {
            setLoading(true);
            Promise.all([
                getProductDetails(selectedProductId),
                getProcessesByProductId(selectedProductId)
            ])
            .then(() => setLoading(false))
            .catch(err => {
                console.error('[useProductNodeBuilder] Error:', err);
                setError('Failed to load product details or processes');
                setLoading(false);
            });
        }
    }, [selectedProductId, getProductDetails, getProcessesByProductId]);

    const buildCurrentProductNode = useCallback((): ProductNode | null => {
        if (productDetails && !loading && !error && processesByProductId) {
            return buildProductNode(productDetails, processesByProductId, 0);
        }
        return null;
    }, [productDetails, loading, error, processesByProductId]);

    const getProductNode = useCallback(async (productId: string, requiredAmount: number) => {
        setLoading(true);
        try {
            const [details, processList] = await Promise.all([
                getProductDetails(productId),
                getProcessesByProductId(productId)
            ]);
            setLoading(false);
            if (details && processList) {
                return buildProductNode(details, processList, requiredAmount);
            }
            throw new Error('Product details or processes not available');
        } catch (error) {
            console.error('[useProductNodeBuilder] Error:', error);
            setError('Failed to load product details or processes');
            setLoading(false);
            throw error;
        }
    }, [getProductDetails, getProcessesByProductId]);

    return { buildCurrentProductNode, loading, error, getProductNode };
};

export default useProductNodeBuilder;

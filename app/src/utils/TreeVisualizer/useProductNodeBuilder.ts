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

    const fetchProductImageBase64 = useCallback(async (productId: string) => {
        try {
            const response = await fetch(`/api/productImage?productId=${productId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch product image');
            }
            const { base64Image } = await response.json();
            return base64Image;
        } catch (error) {
            console.error('Error fetching product image:', error);
            return '';
        }
    }, []);

    const buildCurrentProductNode = useCallback(async (): Promise<ProductNode | null> => {
        if (productDetails && !loading && !error && processesByProductId) {
            const imageBase64 = await fetchProductImageBase64(productDetails.id);
            return buildProductNode(productDetails, processesByProductId, 0, imageBase64);
        }
        return null;
    }, [productDetails, loading, error, processesByProductId, fetchProductImageBase64]);

    const getProductNode = useCallback(async (productId: string, requiredAmount: number) => {
        setLoading(true);
        try {
            const [details, processList] = await Promise.all([
                getProductDetails(productId),
                getProcessesByProductId(productId)
            ]);
            setLoading(false);
            const imageBase64 = await fetchProductImageBase64(productId);
            if (details && processList) {
                return buildProductNode(details, processList, requiredAmount, imageBase64);
            }
            throw new Error('Product details or processes not available');
        } catch (error) {
            console.error('[useProductNodeBuilder] Error:', error);
            setError('Failed to load product details or processes');
            setLoading(false);
            throw error;
        }
    }, [getProductDetails, getProcessesByProductId, fetchProductImageBase64]);

    return { buildCurrentProductNode, loading, error, getProductNode };
};

export default useProductNodeBuilder;

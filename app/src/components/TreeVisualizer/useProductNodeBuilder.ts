// components/TreeVisualizer/useProductNodeBuilder.ts
// 
// — State Management: Uses useState to manage the state of the product node being built.
// — Fetching Product Details and Processes: Uses useProductDetails and useProcessesByProductId to fetch the 
//   necessary data.
// — Building Product Node: Constructs a new product node with the fetched details and processes.
// — getProductNode Function: An asynchronous function to fetch details and processes for a specific product 
//   and build a product node.

import { useState, useEffect, useCallback } from 'react';
import { ProductNode } from '@/types/d3Types';
import { buildProductNode } from '@/components/TreeVisualizer/buildProductNode';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';

const useProductNodeBuilder = ({ selectedProductId }: { selectedProductId: string | null }) => {
    const [productNode, setProductNode] = useState<ProductNode | null>(null);
    const { productDetails, loading: productLoading, error: productError, getProductDetails } = useProductDetails();
    const { processes, loading: processesLoading, error: processesError, getProcesses } = useProcessesByProductId();

    useEffect(() => {
        if (selectedProductId) {
            getProductDetails(selectedProductId);
            getProcesses(selectedProductId);
        }
    }, [selectedProductId, getProductDetails, getProcesses]);

    useEffect(() => {
        if (productDetails && !productLoading && !productError && processes && !processesLoading && !processesError) {
            const newNode = buildProductNode(productDetails, processes);
            setProductNode(newNode);
            // console.log('[useProductNodeBuilder] newNode:', newNode);
        }
    }, [productDetails, productLoading, productError, processes, processesLoading, processesError]);

    const getProductNode = useCallback(async (productId: string) => {
        try {
            const [details, processList] = await Promise.all([getProductDetails(productId), getProcesses(productId)]);
            if (details && processList) {
                const newNode = buildProductNode(details, processList);
                return newNode;
            }
            throw new Error('Product details or processes not available');
        } catch (error) {
            console.error('[useProductNodeBuilder] Error:', error);
            throw error;
        }
    }, [getProductDetails, getProcesses]);

    return { productNode, productLoading, productError, processesLoading, processesError, getProductNode };
};

export default useProductNodeBuilder;

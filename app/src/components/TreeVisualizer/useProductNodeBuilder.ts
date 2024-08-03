// components/TreeVisualizer/useProductNodeBuilder.ts

import { useState, useEffect } from 'react';
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
        if (productDetails && !productLoading && !productError && !processesLoading && !processesError) {
            const newNode = buildProductNode(productDetails, processes);
            setProductNode(newNode);
            // console.log('[useProductNodeBuilder] newNode:', newNode);
        }
    }, [productDetails, productLoading, productError, processes, processesLoading, processesError]);

    return { productNode, productLoading, productError, processesLoading, processesError };
};

export default useProductNodeBuilder;

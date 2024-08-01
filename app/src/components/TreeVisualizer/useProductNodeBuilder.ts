// components/TreeVisualizer/useProductNodeBuilder.ts

import { useState, useEffect } from 'react';
import { ProductNode } from '@/types/d3Types';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
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
            const newNode: ProductNode = {
                id: productDetails.id,
                name: productDetails.name,
                nodeType: 'product',
                productData: productDetails,
                amount: 0,
                totalWeight: 0,
                totalVolume: 0,
                children: [],
                processes
            };
            setProductNode(newNode);
            console.log('[useProductNodeBuilder] newNode:', newNode);
        }
    }, [productDetails, productLoading, productError, processes, processesLoading, processesError]);

    return { productNode, productLoading, productError, processesLoading, processesError };
};

export default useProductNodeBuilder;

// components/productNodeBuilder.ts

import { useEffect, useMemo, useState } from 'react';
import useProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { ProductNode } from '@/types/d3Types';

interface UseProductNodeBuilderParams {
    selectedProductId: string | null;
}

const useProductNodeBuilder = ({ selectedProductId }: UseProductNodeBuilderParams) => {
    const { productDetails: influenceProductData, loading: productLoading, error: productError } = useProductDetails(selectedProductId || '');
    const { processes: processesData, loading: processesLoading, error: processesError } = useProcessesByProductId(selectedProductId || '');

    const productNode = useMemo(() => {
        console.log('[productNodeBuilder] Building productNode with dependencies:', {
            selectedProductId,
            productLoading,
            processesLoading,
            influenceProductData,
            processesData,
        });

        if (!selectedProductId || productLoading || processesLoading || !influenceProductData || !processesData) {
            return null;
        }

        const node = {
            id: selectedProductId,
            uniqueNodeId: generateUniqueId(),
            nodeType: 'product',
            name: influenceProductData.name,
            category: influenceProductData.category,
            quantized: influenceProductData.quantized,
            massKgPerUnit: influenceProductData.massKilogramsPerUnit,
            volLitersPerUnit: influenceProductData.volumeLitersPerUnit,
            influenceType: influenceProductData.type,
            amount: 0,
            totalWeight: calculateTotalWeight(processesData),
            totalVolume: calculateTotalVolume(processesData),
            processes: processesData,
        } as ProductNode;

        console.log('Generated productNode:', node);

        return node;
    }, [selectedProductId, productLoading, processesLoading, influenceProductData, processesData]);

    return {
        productNode,
        productLoading,
        productError,
        processesLoading,
        processesError,
    };
};

const calculateTotalWeight = (processes: any[]): number => {
    // Implement your logic to calculate total weight
    return processes.reduce((acc, process) => acc + process.weight, 0);
};

const calculateTotalVolume = (processes: any[]): number => {
    // Implement your logic to calculate total volume
    return processes.reduce((acc, process) => acc + process.volume, 0);
};

export default useProductNodeBuilder;

// src/components/TreeVisualizer/useProcessNodeBuilder.ts

import { useState, useCallback } from 'react';
import { ProcessNode, ProductNode } from '@/types/d3Types';
import useInputsByProcessId from '@/hooks/useInputsByProcessId';
import { generateUniqueId } from '@/utils/generateUniqueId';

const useProcessNodeBuilder = () => {
    const [processNode, setProcessNode] = useState<ProcessNode | null>(null);
    const { inputs, loading, error, getInputsByProcessId } = useInputsByProcessId();

    const buildProcessNode = useCallback(async (selectedProcessId: string | null) => {
        if (selectedProcessId) {
            await getInputsByProcessId(selectedProcessId);
            if (!loading && !error) {
            const newProcessNode: ProcessNode = {
                id: generateUniqueId(),
                name: selectedProcessId, // Adjust as needed to get the process name
                nodeType: 'process',
                totalDuration: 0,
                totalRuns: 0,
                children: inputs.map(input => ({
                    id: generateUniqueId(),
                    name: input.productId, // Replace with actual product name if available
                    nodeType: 'product',
                    productData: { id: input.productId, name: input.productId, category: '', massKilogramsPerUnit: '', type: '', volumeLitersPerUnit: '' }, // Replace with actual product data if available
                    amount: 0,
                    totalWeight: 0,
                    totalVolume: 0,
                    children: [],
                    processes: []
                })),
                sideProducts: [] // Add side products if needed
            };
            setProcessNode(newProcessNode);
        }
        }
    }, [getInputsByProcessId, inputs, loading, error]);

    return { processNode, buildProcessNode, loading, error };
};

export default useProcessNodeBuilder;

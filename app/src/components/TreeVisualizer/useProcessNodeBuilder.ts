// src/components/TreeVisualizer/useProcessNodeBuilder.ts

import { useState, useEffect, useCallback } from 'react';
import { ProcessNode, ProductNode } from '@/types/d3Types';
import useInputsByProcessId from '@/hooks/useInputsByProcessId';
import useProductNodeBuilder from './useProductNodeBuilder';
import { generateUniqueId } from '@/utils/generateUniqueId';

const useProcessNodeBuilder = () => {
    const [processNode, setProcessNode] = useState<ProcessNode | null>(null);
    const { inputs, loading: inputsLoading, error: inputsError, getInputsByProcessId } = useInputsByProcessId();
    const { getProductNode } = useProductNodeBuilder({ selectedProductId: null });

    const buildProcessNode = useCallback(async (selectedProcessId: string | null) => {
        if (!selectedProcessId) return;

        try {
            console.log('[useProcessNodeBuilder] Fetching Input products for process with id:', selectedProcessId);
            await getInputsByProcessId(selectedProcessId);

            const inputNodes: ProductNode[] = await Promise.all(
                inputs.map(async (input) => {
                    const node = await getProductNode(input.productId);
                    return node;
                })
            );

            const newProcessNode: ProcessNode = {
                id: generateUniqueId(),
                name: selectedProcessId, // Adjust as needed to get the process name
                nodeType: 'process',
                totalDuration: 0,
                totalRuns: 0,
                children: inputNodes,
                sideProducts: [] // Add side products if needed
            };

            setProcessNode(newProcessNode);
            console.log('[useProcessNodeBuilder] New process node:', newProcessNode);
        } catch (err) {
            console.error('[useProcessNodeBuilder] Error building process node:', err);
        }
    }, [inputs, getProductNode, getInputsByProcessId]);

    return { processNode, buildProcessNode, loading: inputsLoading, error: inputsError };
};

export default useProcessNodeBuilder;

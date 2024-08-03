// src/components/TreeVisualizer/useProcessNodeBuilder.ts

import { useState, useEffect, useCallback } from 'react';
import { ProcessNode, ProductNode } from '@/types/d3Types';
import { InfluenceProcessInputOutput } from '@/types/influenceTypes';
import useInputsByProcessId from '@/hooks/useInputsByProcessId';
import useProductNodeBuilder from './useProductNodeBuilder';
import { generateUniqueId } from '@/utils/generateUniqueId';

const useProcessNodeBuilder = () => {
    const [processNode, setProcessNode] = useState<ProcessNode | null>(null);
    const { inputs, loading, error, getInputsByProcessId } = useInputsByProcessId();
    const { productNode, getProductNode } = useProductNodeBuilder({ selectedProductId: null });

    const buildProcessNode = useCallback(async (selectedProcessId: string | null) => {
        if (!selectedProcessId) return;

        try {
            console.log('[useProcessNodeBuilder] Fetching Input products for process with id:', selectedProcessId);
            await getInputsByProcessId(selectedProcessId);

            const inputNodes: ProductNode[] = [];
            for (const input of inputs) {
                await getProductNode(input.productId);
                if (productNode) {
                    inputNodes.push(productNode);
                }
            }

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
    }, [inputs, getProductNode, productNode, getInputsByProcessId]);

    return { processNode, buildProcessNode, loading, error };
};

export default useProcessNodeBuilder;

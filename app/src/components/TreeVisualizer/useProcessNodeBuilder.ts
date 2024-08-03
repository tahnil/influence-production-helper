// src/components/TreeVisualizer/useProcessNodeBuilder.ts
// 
// — State Management: Uses useState to manage the state of the process node being built.
// — Fetching Inputs: Fetches the required inputs for a process using getInputsByProcessId.
// — Building Product Nodes: Uses getProductNode to build nodes for each input product.
// — Building Process Node: Constructs a new process node with the fetched input nodes as children.

import { useState, useCallback } from 'react';
import { ProcessNode, ProductNode } from '@/types/d3Types';
import useInputsByProcessId from '@/hooks/useInputsByProcessId';
import useProductNodeBuilder from './useProductNodeBuilder';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { ProcessInput } from '@/types/influenceTypes';

const useProcessNodeBuilder = () => {
    const [processNode, setProcessNode] = useState<ProcessNode | null>(null);
    const { getInputsByProcessId } = useInputsByProcessId();
    const { getProductNode } = useProductNodeBuilder({ selectedProductId: null });

    const buildProcessNode = useCallback(async (selectedProcessId: string | null) => {
        if (!selectedProcessId) return;

        try {
            console.log('[useProcessNodeBuilder] Fetching Input products for process with id:', selectedProcessId);
            const fetchedInputs = await getInputsByProcessId(selectedProcessId);
            console.log('[useProcessNodeBuilder] Inputs fetched:', fetchedInputs);

            const inputNodes: ProductNode[] = await Promise.all(
                fetchedInputs.map(async (input: ProcessInput) => {
                    const node = await getProductNode(input.product.id);  // Accessing product.id
                    console.log('[useProcessNodeBuilder]\nProcess Node:', node,'\nInput:', input);
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
                _children: [],
                sideProducts: [] // Add side products if needed
            };

            setProcessNode(newProcessNode);
            console.log('[useProcessNodeBuilder] New process node:', newProcessNode);
        } catch (err) {
            console.error('[useProcessNodeBuilder] Error building process node:', err);
        }
    }, [getProductNode, getInputsByProcessId]);

    return { processNode, buildProcessNode };
};

export default useProcessNodeBuilder;

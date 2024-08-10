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
import { ProcessInput, InfluenceProcess } from '@/types/influenceTypes';
import useProcessDetails from '@/hooks/useProcessDetails';

const useProcessNodeBuilder = () => {
    const { getInputsByProcessId } = useInputsByProcessId();
    const { getProductNode } = useProductNodeBuilder({ selectedProductId: null });
    const { getProcessDetails } = useProcessDetails();

    const buildProcessNode = useCallback(async (selectedProcessId: string | null, parentAmount: number, parentId: string): Promise<ProcessNode | null> => {
        if (!selectedProcessId) return null;

        try {
            // console.log('[useProcessNodeBuilder] Fetching process details and inputs for process with id:', selectedProcessId);

            // Fetch detailed process information
            const processDetails: InfluenceProcess = await getProcessDetails(selectedProcessId);
            // console.log('[useProcessNodeBuilder] Process details fetched:', processDetails);

            // Fetch inputs for the process
            const fetchedInputs = await getInputsByProcessId(selectedProcessId);
            // console.log('[useProcessNodeBuilder] Inputs fetched:', fetchedInputs);
            
            // Calculate the required runs based on parentAmount
            // console.log('[useProcessNodeBuilder] parentId: ',parentId);
            // console.log('[useProcessNodeBuilder] processDetails: ',processDetails);
            // console.log('[useProcessNodeBuilder] outputs: ',processDetails.outputs);
            const output = processDetails.outputs.find(output => output.productId === parentId);
            // console.log('[useProcessNodeBuilder] output: ',output);
            if (!output) {
            throw new Error(`No matching output found for product ID: ${parentId}`);
            }

            const unitsPerSR = parseFloat(output.unitsPerSR || '0');
            // console.log('[useProcessNodeBuilder] unitsPerSR: ',output?.unitsPerSR);
            const totalRuns = Math.ceil(parentAmount / unitsPerSR);
            // console.log('[useProcessNodeBuilder] totalRuns: ',totalRuns);
            const totalDuration = totalRuns * parseFloat(processDetails.bAdalianHoursPerAction);
            // console.log('[useProcessNodeBuilder] totalDuration: ',totalDuration);

            // Build input nodes
            const inputNodes: ProductNode[] = await Promise.all(
                fetchedInputs.map(async (input: ProcessInput) => {
                    try {
                        const node = await getProductNode(input.product.id, totalRuns * parseFloat(input.unitsPerSR));
                        // console.log('[useProcessNodeBuilder] Product Node:', node, 'Input:', input);
                        return node;
                    } catch (error) {
                        // console.error('[useProcessNodeBuilder] Error fetching product node for input:', error);
                        throw error;
                    }
                })
            );

            // Create the new process node
            const newProcessNode: ProcessNode = {
                id: generateUniqueId(),
                name: processDetails.name,
                nodeType: 'process',
                processData: processDetails,
                totalDuration,
                totalRuns,
                children: inputNodes,
                _children: [],
                sideProducts: [] 
            };

            // console.log('[useProcessNodeBuilder] New process node:', newProcessNode);
            return newProcessNode;
        } catch (err) {
            // console.error('[useProcessNodeBuilder] Error building process node:', err);
            return null;
        }
    }, [getProductNode, getInputsByProcessId, getProcessDetails]);

    return { buildProcessNode };
};

export default useProcessNodeBuilder;

// utils/TreeVisualizer/useProcessNodeBuilder.ts

import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { generateUniqueId } from '../generateUniqueId';
import useProcessDetails from '@/hooks/useProcessDetails';
import useInputsByProcessId from '@/hooks/useInputsByProcessId';
import useProductNodeBuilder from '@/utils/TreeVisualizer/useProductNodeBuilder';

const useProcessNodeBuilder = () => {
    const { getProcessDetails } = useProcessDetails();
    const { getInputsByProcessId } = useInputsByProcessId();
    const { buildProductNode } = useProductNodeBuilder();

    const buildProcessNode = useCallback(async (
        selectedProcessId: string,
        parentId: string,
        handleSelectProcess: (processId: string, nodeId: string) => void // Add this parameter
    ): Promise<Node[] | null> => {
        try {
            const [processDetails, inputProducts] = await Promise.all([
                getProcessDetails(selectedProcessId),
                getInputsByProcessId(selectedProcessId),
            ]);

            const newProcessNodeId = generateUniqueId();

            const newProcessNode: Node = {
                id: newProcessNodeId,
                type: 'processNode',
                position: { x: 0, y: 0 },
                parentId: parentId,
                data: {
                    processDetails,
                    inputProducts,
                },
            };

            // Now build product nodes for each input product
            const inputProductNodes = await Promise.all(
                inputProducts.map(async (inputProduct) => {
                    const productNode = await buildProductNode(
                        inputProduct.product.id, 
                        null, 
                        handleSelectProcess,
                        newProcessNodeId // Set parentId to the current process node's ID
                    );
                    return productNode;
                })
            );

            // Filter out any null nodes (in case any failed to build)
            const validInputProductNodes = inputProductNodes.filter(node => node !== null) as Node[];

            // Return both the process node and its children
            return [newProcessNode, ...validInputProductNodes];
        } catch (err) {
            console.error('[useProcessNodeBuilder] Error:', err);
            return null;
        }
    }, [getProcessDetails, getInputsByProcessId, buildProductNode]);

    return { buildProcessNode };
};

export default useProcessNodeBuilder;

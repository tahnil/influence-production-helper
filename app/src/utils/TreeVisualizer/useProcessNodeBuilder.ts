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
        onSelectProcess: (processId: string, nodeId: string) => void
    ): Promise<{ processNode: Node, productNodes: Node[] } | null> => {
        try {
            const [processDetails, inputProducts] = await Promise.all([
                getProcessDetails(selectedProcessId),
                getInputsByProcessId(selectedProcessId),
            ]);

            const processNodeId = generateUniqueId();

            const newProcessNode: Node = {
                id: processNodeId,
                type: 'processNode',
                position: { x: 0, y: 0 },
                parentId: parentId,
                data: {
                    processDetails,
                    inputProducts,
                },
            };

            // Build input ProductNodes
            const productNodesPromises = inputProducts.map(async (inputProduct) => {
                const productNode = await buildProductNode(
                    inputProduct.product.id,
                    null, // No selected process initially for these nodes
                    onSelectProcess
                );

                if (productNode) {
                    // Set the ProcessNode as the parent of this ProductNode
                    productNode.parentId = processNodeId;
                    return productNode;
                }

                return null;
            });

            const productNodes = (await Promise.all(productNodesPromises)).filter(Boolean) as Node[];

            return { processNode: newProcessNode, productNodes };
        } catch (err) {
            console.error('[useProcessNodeBuilder] Error:', err);
            return null;
        }
    }, [getProcessDetails, getInputsByProcessId, buildProductNode]);

    return { buildProcessNode };
};

export default useProcessNodeBuilder;

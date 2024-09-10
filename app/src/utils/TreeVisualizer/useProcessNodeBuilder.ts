// utils/TreeVisualizer/useProcessNodeBuilder.ts

import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { generateUniqueId } from '../generateUniqueId';
import useProcessDetails from '@/hooks/useProcessDetails';
import useInputsByProcessId from '@/hooks/useInputsByProcessId';
import useProductNodeBuilder from '@/utils/TreeVisualizer/useProductNodeBuilder';
import useBuildingIcon from '@/hooks/useBuildingIcon';

const useProcessNodeBuilder = () => {
    const { getProcessDetails } = useProcessDetails();
    const { getInputsByProcessId } = useInputsByProcessId();
    const { getBuildingIcon } = useBuildingIcon();
    const { buildProductNode } = useProductNodeBuilder();

    const buildProcessNode = useCallback(async (
        selectedProcessId: string,
        parentId: string,
        parentNodeAmount: number,
        parentNodeProductId: string,
        handleSelectProcess: (processId: string, nodeId: string) => void,
        handleSerialize: (focalProductId: string) => void,
    ): Promise<{ processNode: Node, productNodes: Node[] } | null> => {
        try {
            const [processDetails, inputProducts] = await Promise.all([
                getProcessDetails(selectedProcessId),
                getInputsByProcessId(selectedProcessId)
            ]);

            const [buildingIcon] = await Promise.all([
                getBuildingIcon(processDetails.buildingId),
            ]);

            const processNodeId = generateUniqueId();

            const ancestorIds: string[] = [];
            const descendantIds: string[] = [];

            const output = processDetails.outputs.find(output => output.productId === parentNodeProductId);
            // console.log(`### ProcessNode builder Step 1 ###
            //     \nparentId: ${parentNodeProductId}
            //     \noutput.productId: ${output?.productId}
            //     \nprocessDetails: `,processDetails,`
            //     \noutputs: `,processDetails.outputs,`
            //     \noutput: `, output );

            const outputUnitsPerSR = output ? parseFloat(output.unitsPerSR) : 0;
            // console.log(`### ProcessNode builder Step 2 ###\noutput.unitsPerSR: ${output?.unitsPerSR}\noutputUnitsPerSR: ${outputUnitsPerSR}`);

            const totalRuns = parentNodeAmount / outputUnitsPerSR || 1;
            // console.log(`### ProcessNode builder Step 3 ###\noutput: ${output}\noutputUnitsPerSR: ${outputUnitsPerSR}\ntotalRuns: ${totalRuns}`);

            // Build input ProductNodes
            const productNodesPromises = inputProducts.map(async (inputProduct) => {
                const amount = parseFloat(inputProduct.unitsPerSR) * totalRuns;
                // console.log(`### ProcessNode builder Step 4 ###\ninputProduct:`, inputProduct ,`\ninputProduct.unitsPerSR: `, inputProduct.unitsPerSR ,`\namount: ${amount}`);

                const productNode = await buildProductNode(
                    inputProduct.product.id,
                    amount,
                );

                if (productNode) {
                    const newProductNode = {
                        ...productNode,
                        parentId: processNodeId,
                        data: {
                            ...productNode.data,
                            handleSelectProcess,
                            handleSerialize,
                            ancestorIds: [], // Input products have no ancestors initially
                            descendantIds: [processNodeId], // The process node is a descendant
                        }
                    };

                    return newProductNode;
                }

                return null;
            });

            // After all product nodes are created
            const productNodes = (await Promise.all(productNodesPromises)).filter(Boolean) as Node[];

            // Update the process node
            const newProcessNode: Node = {
                id: processNodeId,
                type: 'processNode',
                position: { x: 0, y: 0 },
                parentId: parentId,
                data: {
                    processDetails,
                    inputProducts,
                    image: buildingIcon,
                    totalRuns,
                    ancestorIds: productNodes.map(node => node.id), // Input products are ancestors of the process
                    descendantIds: [parentId], // The parent product node is the descendant
                },
            };

            return { processNode: newProcessNode, productNodes };
        } catch (err) {
            console.error('[useProcessNodeBuilder] Error:', err);
            return null;
        }
    }, [getProcessDetails, getInputsByProcessId, buildProductNode]);

    return { buildProcessNode };
};

export default useProcessNodeBuilder;

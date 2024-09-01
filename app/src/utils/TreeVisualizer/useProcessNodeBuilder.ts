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
        onSelectProcess: (processId: string, nodeId: string) => void,
        onSerialize: (focalProductId: string) => void,
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

            const output = processDetails.outputs.find(output => output.productId === parentNodeProductId);
            // console.log(`### ProcessNode builder Step 1 ###
            //     \nparentId: ${parentNodeProductId}
            //     \noutput.productId: ${output?.productId}
            //     \nprocessDetails: `,processDetails,`
            //     \noutputs: `,processDetails.outputs,`
            //     \noutput: `, output );
            
            const outputUnitsPerSR = output ? parseFloat(output.unitsPerSR): 0;
            // console.log(`### ProcessNode builder Step 2 ###\noutput.unitsPerSR: ${output?.unitsPerSR}\noutputUnitsPerSR: ${outputUnitsPerSR}`);
            
            const totalRuns = parentNodeAmount / outputUnitsPerSR || 1;
            // console.log(`### ProcessNode builder Step 3 ###\noutput: ${output}\noutputUnitsPerSR: ${outputUnitsPerSR}\ntotalRuns: ${totalRuns}`);

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
                },
            };

            // Build input ProductNodes
            const productNodesPromises = inputProducts.map(async (inputProduct) => {
                const amount = parseFloat(inputProduct.unitsPerSR) * totalRuns;
                // console.log(`### ProcessNode builder Step 4 ###\ninputProduct:`, inputProduct ,`\ninputProduct.unitsPerSR: `, inputProduct.unitsPerSR ,`\namount: ${amount}`);
                
                const productNode = await buildProductNode(
                    inputProduct.product.id,
                    null, // No selected process initially for these nodes
                    amount,
                    onSelectProcess,
                    onSerialize,
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

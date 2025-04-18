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
        logicalParentId: string,
        parentNodeAmount: number,
        parentNodeProductId: string,
        handleSelectProcess: (processId: string, nodeId: string) => void,
        handleSerialize: (focalProductId: string) => void,
    ): Promise<{ processNode: Node, productNodes: Node[], sideProductNodes: Node[] } | null> => {
        try {
            const [processDetails, inputProducts] = await Promise.all([
                getProcessDetails(selectedProcessId),
                getInputsByProcessId(selectedProcessId)
            ]);

            const [buildingIcon] = await Promise.all([
                getBuildingIcon(processDetails.buildingId),
            ]);

            const processNodeId = generateUniqueId();

            const inflowIds: string[] = [];
            const outflowIds: string[] = [];

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
                        data: {
                            ...productNode.data,
                            handleSelectProcess,
                            handleSerialize,
                            inflowIds: [], // Input products have no inflows initially
                            outflowIds: [processNodeId], // The process node is a outflow
                            logicalParentId: processNodeId,
                        }
                    };

                    return newProductNode;
                }

                return null;
            });

            // Build SideProductNodes
            const sideProductNodesPromises = processDetails.outputs
                .filter(output => output.productId !== parentNodeProductId)
                .map(async (output) => {
                    console.log(`[SideProducts] Creating side product for output:`, output);
                    const amount = parseFloat(output.unitsPerSR) * totalRuns;

                    const sideProductNode = await buildProductNode(
                        output.productId,
                        amount,
                    );

                    if (sideProductNode) {
                        console.log(`[SideProducts] Created node for ${output.productId} with ID ${sideProductNode.id}`);
                        const newSideProductNode = {
                            ...sideProductNode,
                            type: 'sideProductNode',
                            data: {
                                ...sideProductNode.data,
                                ancestorIds: [processNodeId], // The process node is the ancestor
                                handleSelectProcess,
                                handleSerialize,
                            }
                        };

                        return newSideProductNode;
                    }
                    return null;
                });

            // After all product nodes are created
            const productNodes = (await Promise.all(productNodesPromises)).filter(Boolean) as Node[];
            const sideProductNodes = (await Promise.all(sideProductNodesPromises)).filter(Boolean) as Node[];
            console.log(`[SideProducts] Finished creating ${sideProductNodes.length} side product nodes:`, 
                sideProductNodes.map(n => ({ id: n.id, productId: (n.data as { productDetails: { id: string } }).productDetails.id })));

            // Update the process node
            const newProcessNode: Node = {
                id: processNodeId,
                type: 'processNode',
                position: { x: 0, y: 0 },
                data: {
                    processDetails,
                    inputProducts,
                    image: buildingIcon,
                    totalRuns,
                    inflowIds: productNodes.map(node => node.id), // Input products are inflows of the process
                    outflowIds: [logicalParentId, ...sideProductNodes.map(node => node.id)], // The parent product node is the outflow
                    logicalParentId: logicalParentId,
                },
            };

            return { processNode: newProcessNode, productNodes, sideProductNodes };
        } catch (err) {
            console.error('[useProcessNodeBuilder] Error:', err);
            return null;
        }
    }, [getProcessDetails, getInputsByProcessId, buildProductNode]);

    return { buildProcessNode };
};

export default useProcessNodeBuilder;

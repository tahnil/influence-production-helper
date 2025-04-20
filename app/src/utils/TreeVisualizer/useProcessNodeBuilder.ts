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
        processId: string,
        logicalParentId: string,
        logicalParentIdAmount: number,
        logicalParentIdProductId: string,
        handleSelectProcess: (processId: string, nodeId: string) => void,
        handleSerialize: (focalProductId: string) => void,
    ): Promise<{ compoundNode: Node, processNode: Node, productNodes: Node[], sideProductNodes: Node[] } | null> => {
        try {

            const [processDetails, inputProducts] = await Promise.all([
                getProcessDetails(processId),
                getInputsByProcessId(processId)
            ]);

            const [buildingIcon] = await Promise.all([
                getBuildingIcon(processDetails.buildingId),
            ]);

            const processNodeId = generateUniqueId();
            const compoundNodeId = `compound-${processNodeId}`;

            const output = processDetails.outputs.find(output => output.productId === logicalParentIdProductId);

            const outputUnitsPerSR = output ? parseFloat(output.unitsPerSR) : 0;

            const totalRuns = logicalParentIdAmount / outputUnitsPerSR || 1;

            // Create compound node
            const compoundNode: Node = {
                id: compoundNodeId,
                type: 'compoundNode',
                position: { x: 0, y: 0 },
                data: {
                    id: compoundNodeId,
                    width: 400,  // Default width, will be measured/adjusted by layout
                    height: 300, // Default height, will be measured/adjusted by layout
                    processId: processNodeId
                }
            };

            console.log('[useProcessNodeBuilder] Creating compound node:', compoundNode);

            // Build input ProductNodes
            const productNodesPromises = inputProducts.map(async (inputProduct) => {
                console.log(`[useProcessNodeBuilder] Executing productNodesPromises, creating product node for input:`, inputProduct);
                const amount = parseFloat(inputProduct.unitsPerSR) * totalRuns;

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
                    console.log(`[useProcessNodeBuilder] Created node for ${inputProduct.product.id} with ID ${newProductNode.id}`, newProductNode);
                    return newProductNode;
                }

                return null;
            });

            // Build SideProductNodes
            const sideProductNodesPromises = processDetails.outputs
                .filter(output => output.productId !== logicalParentIdProductId)
                .map(async (output) => {
                    console.log(`[SideProducts] Creating side product for output:`, output);
                    const amount = parseFloat(output.unitsPerSR) * totalRuns;

                    const sideProductNode = await buildProductNode(
                        output.productId,
                        amount,
                    );

                    if (sideProductNode) {
                        console.log(`[SideProducts] Created node for ${output.productId} with ID ${sideProductNode.id}`, sideProductNode);
                        const newSideProductNode = {
                            ...sideProductNode,
                            type: 'sideProductNode',
                            parentId: compoundNodeId,
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
                parentId: compoundNodeId,
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

            console.log('[useProcessNodeBuilder] Created following nodes:', compoundNode, newProcessNode, productNodes, sideProductNodes);

            return { 
                compoundNode,
                processNode: newProcessNode, 
                productNodes, 
                sideProductNodes 
            };
        } catch (err) {
            console.error('[useProcessNodeBuilder] Error:', err);
            return null;
        }
    }, [getProcessDetails, getInputsByProcessId, buildProductNode]);

    return { buildProcessNode };
};

export default useProcessNodeBuilder;

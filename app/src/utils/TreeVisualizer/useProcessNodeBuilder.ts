// utils/TreeVisualizer/useProcessNodeBuilder.ts

import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
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
    ): Promise<{
        sideProductCompoundNode?: Node,
        processNode: Node,
        productNodes: Node[],
        sideProductNodes: Node[],
        edges: Edge[]
    } | null> => {
        try {
            const [processDetails, inputProducts] = await Promise.all([
                getProcessDetails(processId),
                getInputsByProcessId(processId)
            ]);

            const [buildingIcon] = await Promise.all([
                getBuildingIcon(processDetails.buildingId),
            ]);

            const processNodeId = generateUniqueId();

            // Check if this process has side products
            const sideProductOutputs = processDetails.outputs.filter(
                output => output.productId !== logicalParentIdProductId
            );

            const hasSideProducts = sideProductOutputs.length > 0;
            console.log(`[useProcessNodeBuilder] Process ${processId} has ${sideProductOutputs.length} side products`);

            // Only create a sideProductCompound node if we have side products
            const sideProductCompoundNodeId = hasSideProducts ? `sideProductCompound-${processNodeId}` : undefined;
            let sideProductCompoundNode: Node | undefined;

            if (hasSideProducts && sideProductCompoundNodeId) {
                sideProductCompoundNode = {
                    id: sideProductCompoundNodeId,
                    type: 'sideProductCompoundNode',
                    position: { x: 0, y: 0 },
                    data: {
                        id: sideProductCompoundNodeId,
                        width: 400,  // Default width, will be measured/adjusted by layout
                        height: 300, // Default height, will be measured/adjusted by layout
                        processId: processNodeId,
                        label: 'Side Products',
                    }
                };
                console.log('[useProcessNodeBuilder] Creating sideProductCompound node:', sideProductCompoundNode);
            }

            const output = processDetails.outputs.find(output => output.productId === logicalParentIdProductId);
            const outputUnitsPerSR = output ? parseFloat(output.unitsPerSR) : 0;
            const totalRuns = logicalParentIdAmount / outputUnitsPerSR || 1;

            // Build input ProductNodes
            const productNodesPromises = inputProducts.map(async (inputProduct) => {
                console.log(`[useProcessNodeBuilder] Creating product node for input:`, inputProduct);
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
                    console.log(`[useProcessNodeBuilder] Created node for ${inputProduct.product.id} with ID ${newProductNode.id}`);
                    return newProductNode;
                }

                return null;
            });

            // Build SideProductNodes only if there are side products
            const sideProductNodes: Node[] = [];
            if (hasSideProducts) {
                const sideProductNodesPromises = sideProductOutputs.map(async (output) => {
                    console.log(`[SideProducts] Creating side product for output:`, output);
                    const amount = parseFloat(output.unitsPerSR) * totalRuns;

                    const sideProductNode = await buildProductNode(
                        output.productId,
                        amount,
                    );

                    if (sideProductNode && sideProductCompoundNodeId) {
                        console.log(`[SideProducts] Created node for ${output.productId} with ID ${sideProductNode.id}`);
                        const newSideProductNode = {
                            ...sideProductNode,
                            type: 'sideProductNode',
                            parentId: sideProductCompoundNodeId,
                            extent: 'parent',
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

                const resolvedSideProductNodes = (await Promise.all(sideProductNodesPromises)).filter(Boolean) as Node[];
                sideProductNodes.push(...resolvedSideProductNodes);

                console.log(`[SideProducts] Finished creating ${sideProductNodes.length} side product nodes:`,
                    sideProductNodes.map(n => ({ id: n.id, productId: (n.data as { productDetails: { id: string } }).productDetails.id })));
            }

            // After all product nodes are created
            const productNodes = (await Promise.all(productNodesPromises)).filter(Boolean) as Node[];

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
                    outflowIds: [
                        logicalParentId,
                        ...(hasSideProducts ? sideProductNodes.map(node => node.id) : [])
                    ], // The parent product node and any side products are outflows
                    logicalParentId: logicalParentId,
                },
            };

            // Create edges for the nodes
            const edges: Edge[] = [];

            // Log successful creation
            if (hasSideProducts) {
                console.log('[useProcessNodeBuilder] Created sideProductCompound node, process node, product nodes, and side product nodes');
            } else {
                console.log('[useProcessNodeBuilder] Created process node and product nodes (no side products)');
            }

            return {
                sideProductCompoundNode, // This will be undefined if no side products
                processNode: newProcessNode,
                productNodes,
                sideProductNodes,
                edges // Return the edges to be added by the caller
            };
        } catch (err) {
            console.error('[useProcessNodeBuilder] Error:', err);
            return null;
        }
    }, [getProcessDetails, getInputsByProcessId, buildProductNode, getBuildingIcon]);

    return { buildProcessNode };
};

export default useProcessNodeBuilder;
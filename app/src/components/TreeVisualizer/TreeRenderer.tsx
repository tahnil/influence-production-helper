// components/TreeVisualizer/TreeRenderer.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    MiniMap,
    useNodesInitialized,
} from '@xyflow/react';
import { usePouchDB } from '@/contexts/PouchDBContext';
import { useFlow } from '@/contexts/FlowContext';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import ProcessNode from './ProcessNode';
import ProductNode from './ProductNode';
import SideProductNode from './SideProductNode';
import { ProductNode as ProductNodeType, ProcessNode as ProcessNodeType, InfluenceNode } from '@/types/reactFlowTypes';
import '@xyflow/react/dist/style.css';
import useProductNodeBuilder from '@/utils/TreeVisualizer/useProductNodeBuilder';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import LayoutConfigPanel from './LayoutConfigPanel';
import applyDagreLayout from '@/utils/TreeVisualizer/applyDagreLayout';
import useIngredientsList from '@/utils/TreeVisualizer/useIngredientsList';
import IngredientsList from './IngredientsList';
import AmountInput from './AmountInput';
import calculateDesiredAmount from '@/utils/TreeVisualizer/calculateDesiredAmount';
import { serializeProductionChain } from '@/utils/TreeVisualizer/serializeProductionChain';
import { getDescendantIds } from '@/utils/TreeVisualizer/getDescendantIds';
import PouchDBViewer from '@/components/TreeVisualizer/PouchDbViewer';
import debounce from '@/utils/TreeVisualizer/debounce';
import { useReactFlowSetup } from '@/hooks/useReactFlowSetup';
import { useDagreConfig } from '@/hooks/useDagreConfig';

interface ProcessSelection {
    nodeId: string;
    processId: string;
}

const nodeTypes = {
    productNode: ProductNode,
    processNode: ProcessNode,
    sideProductNode: SideProductNode,
};

const TreeRenderer: React.FC = () => {
    const { memoryDb } = usePouchDB();
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useReactFlowSetup();
    const { dagreConfig, updateDagreConfig } = useDagreConfig();
    const { setNodes, setEdges, nodesRef, desiredAmount, setDesiredAmount, nodesReady, setNodesReady, rootNodeId, setRootNodeId } = useFlow();
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedProcessMap, setSelectedProcessMap] = useState<ProcessSelection[]>([]);

    const nodesInitialized = useNodesInitialized();

    useEffect(() => {
        if (nodes.length !== nodesRef.current.length) {
            nodesRef.current = nodes;
            // console.log('TreeRenderer nodes updated:', nodes.length);
        }
    }, [nodes, nodesRef]);

    const { buildProductNode } = useProductNodeBuilder();
    const { buildProcessNode } = useProcessNodeBuilder();

    const handleSelectProcess = useCallback(
        debounce((processId: string, nodeId: string) => {
            // Add a new log entry with the node ID and process ID to the state
            setSelectedProcessMap((prevMap) => [
                ...prevMap,
                { nodeId, processId },
            ]);

            // console.log('Selected Process Map:', [
            //     ...selectedProcessMap,
            //     { nodeId, processId },
            // ]);

        }, 300),
        []
    );

    const handleSerialize = useCallback(
        async (focalNodeId: string) => {
            if (focalNodeId && nodesRef.current.length > 0 && memoryDb) {
                try {
                    await serializeProductionChain(focalNodeId, nodesRef.current as InfluenceNode[], memoryDb);
                    // console.log('Production chain serialized and saved successfully');
                } catch (error) {
                    console.error('Error serializing production chain:', error);
                }
            } else {
                // console.log('No focal node selected, nodes are empty, or database is not initialized.');
            }
        },
        [memoryDb, nodesRef]
    );

    const ingredients = useIngredientsList(nodes);
    const updatedAmount = useMemo(() => calculateDesiredAmount(nodes, desiredAmount, rootNodeId), [desiredAmount]);

    useEffect(() => {
        if (nodesInitialized && nodes.every(node => node.measured?.width && node.measured?.height)) {
            setNodesReady(true);
        } else {
            setNodesReady(false);
        }
    }, [nodesInitialized, nodes]);

    useEffect(() => {
        if (nodesReady) {
            const updatedNodes = calculateDesiredAmount(nodes, desiredAmount, rootNodeId);
            const { layoutedNodes, layoutedEdges } = applyDagreLayout(updatedNodes, edges, dagreConfig);
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
        }
    }, [nodesReady, desiredAmount, dagreConfig]);

    useEffect(() => {
        const fetchAndBuildRootNode = async () => {
            if (selectedProductId) {
                setNodes([]); // Reset nodes when a new product is selected
                setEdges([]); // Reset edges

                const rootNode = await buildProductNode(
                    selectedProductId,
                    desiredAmount,
                );

                if (rootNode) {
                    // console.log('Root node created:', rootNode);
                    const namedRootNode = {
                        ...rootNode,
                        data: {
                            ...rootNode.data,
                            handleSelectProcess,
                            handleSerialize,
                        }
                    };

                    setNodes([namedRootNode]);
                    setRootNodeId(namedRootNode.id);
                }
            }
        };

        fetchAndBuildRootNode();
    }, [selectedProductId, buildProductNode]);

    useEffect(() => {
        const fetchAndBuildProcessNode = async () => {
            if (selectedProcessMap.length > 0) {
                const lastEntry = selectedProcessMap[selectedProcessMap.length - 1];
                const { nodeId: parentNodeId, processId } = lastEntry;

                if (processId && parentNodeId) {
                    // Find the parent node and its amount
                    const parentNode = nodes.find((node) => node.id === parentNodeId);
                    const parentNodeAmount: number = (parentNode as ProductNodeType)?.data?.amount ?? 1;
                    const parentNodeProductId: string = (parentNode as ProductNodeType)?.data?.productDetails?.id ?? '';
                    // console.log(`Amount for parentNode`, parentNode ,`: ${parentNodeAmount}`);

                    // Build the process node
                    const result = await buildProcessNode(
                        processId,
                        parentNodeId,
                        parentNodeAmount,
                        parentNodeProductId,
                        handleSelectProcess,
                        handleSerialize,
                    );
                    if (result) {
                        const { processNode, productNodes, sideProductNodes } = result;

                        setNodes((currentNodes) => {
                            let updatedNodes = [...currentNodes];
                            let updatedEdges = [...edges];

                            // Step 1: Find the existing ProcessNode with the same parentId
                            const existingProcessNode = updatedNodes.find(
                                (node) => node.parentId === parentNodeId && node.type === 'processNode'
                            );

                            if (existingProcessNode) {
                                // Step 2: Recursively find and remove all descendants
                                const descendantIds = getDescendantIds(existingProcessNode.id, updatedNodes);

                                // Remove the existing ProcessNode and its descendants
                                updatedNodes = updatedNodes.filter(
                                    (node) => ![existingProcessNode.id, ...descendantIds].includes(node.id)
                                );

                                // Also remove all edges connected to these nodes
                                updatedEdges = updatedEdges.filter(
                                    (edge) => ![existingProcessNode.id, ...descendantIds].includes(edge.source)
                                );
                            }

                            // Step 4: Add the new ProcessNode and its child ProductNodes
                            updatedNodes = [...updatedNodes, processNode, ...productNodes, ...sideProductNodes];

                            // Step 5: Create edges between the ProcessNode and each ProductNode
                            const newEdges = productNodes.map((productNode) => ({
                                id: `edge-${processNode.id}-${productNode.id}`,
                                source: processNode.id,
                                target: productNode.id,
                                type: 'smoothstep',
                            }));

                            // Create edges for side product nodes
                            const sideProductEdges = sideProductNodes.map((sideProductNode) => ({
                                id: `edge-${sideProductNode.id}-${processNode.id}`,
                                source: sideProductNode.id,
                                target: processNode.id,
                                sourceHandle: null, // This will default to the bottom handle of the SideProductNode
                                targetHandle: `side-product-${processNode.id}`,
                                type: 'smoothstep',
                            }));

                            // Step 6: Add the edge between the parent ProductNode and the ProcessNode
                            updatedEdges.push({
                                id: `edge-${parentNodeId}-${processNode.id}`,
                                source: parentNodeId,
                                target: processNode.id,
                                type: 'smoothstep',
                            });

                            updatedEdges = [...updatedEdges, ...newEdges, ...sideProductEdges];

                            // Step 7: Set the ancestorId in the data properties of the parent ProductNode to the id of current ProcessNode
                            const parentProductNode = updatedNodes.find(
                                (node) => node.id === parentNodeId && node.type === 'productNode'
                            );

                            if (parentProductNode) {
                                parentProductNode.data.ancestorIds = [processNode.id];
                            }

                            setEdges(updatedEdges);
                            return updatedNodes;
                        });
                    }
                }
            }
        };

        fetchAndBuildProcessNode();
    }, [selectedProcessMap, buildProcessNode]);

    return (
        <div className="w-full h-full relative">
            <div className="tree-renderer" style={{ width: '100%', height: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    style={{ backgroundColor: '#282C34' }}
                    minZoom={0.1}
                    maxZoom={1}
                    nodesDraggable={false}
                    colorMode="dark"
                >
                    <div className="absolute bottom-4 left-4 bg-background p-4 shadow-lg rounded-lg z-10 max-h-[90vh] overflow-y-auto w-[35ch]">
                        <h2 className="text-xl font-semibold mb-4">Controls</h2>
                        <ProductSelector
                            selectedProductId={selectedProductId}
                            onProductSelect={setSelectedProductId}
                            className="p-2 border rounded border-gray-300 mb-4 w-full"
                        />
                        <AmountInput
                            label="Desired Amount"
                        />
                        <IngredientsList
                            ingredients={ingredients}
                        /> {/* Display ingredients list */}
                        <PouchDBViewer
                            handleSelectProcess={handleSelectProcess}
                            handleSerialize={handleSerialize}
                        />
                    </div>
                    <LayoutConfigPanel
                        dagreConfig={dagreConfig}
                        updateDagreConfig={updateDagreConfig}
                    />
                    <MiniMap
                        nodeStrokeWidth={3}
                        pannable={true}
                        inversePan={true}
                        maskColor='rgba(30,30,30,1)'
                    />
                </ReactFlow>
            </div>
        </div>
    );
};

TreeRenderer.displayName = 'TreeRenderer';

export default TreeRenderer;

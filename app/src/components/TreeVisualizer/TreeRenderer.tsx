// components/TreeVisualizer/TreeRenderer.tsx

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { ProductNode as ProductNodeType, ProcessNode as InfluenceNode } from '@/types/reactFlowTypes';
import '@xyflow/react/dist/style.css';
import useProductNodeBuilder from '@/utils/TreeVisualizer/useProductNodeBuilder';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import LayoutConfigPanel from './LayoutConfigPanel';
import useIngredientsList, { IngredientsListMode } from '@/utils/TreeVisualizer/useIngredientsList';
import IngredientsList from './IngredientsList';
import AmountInput from './AmountInput';
import calculateDesiredAmount from '@/utils/TreeVisualizer/calculateDesiredAmount';
import { serializeProductionChain } from '@/utils/TreeVisualizer/serializeProductionChain';
import PouchDBViewer from '@/components/TreeVisualizer/PouchDbViewer';
import debounce from '@/utils/TreeVisualizer/debounce';
import { useReactFlowSetup } from '@/hooks/useReactFlowSetup';
import { useDagreConfig } from '@/hooks/useDagreConfig';
import CustomEdge from '@/components/TreeVisualizer/CustomEdges';
import { selectProductThunk, selectProcessThunk } from '@/utils/TreeVisualizer/flowThunks';

interface ProcessSelection {
    nodeId: string;
    processId: string;
}

const nodeTypes = {
    productNode: ProductNode,
    processNode: ProcessNode,
};

// Define edge types
const edgeTypes = {
    custom: CustomEdge,
};

/**
 * TreeRenderer component for visualizing production chains
 * 
 * This component is responsible for rendering the production chain graph
 * and handling user interactions like selecting products and processes.
 */
const TreeRenderer: React.FC = () => {
    const { memoryDb } = usePouchDB();
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useReactFlowSetup();
    const { dagreConfig, updateDagreConfig } = useDagreConfig();
    const {
        nodesRef,
        desiredAmount,
        nodesReady,
        setNodesReady,
        rootNodeId,
        needsLayout,
        isLoading,
        error,
        dispatch
    } = useFlow();
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedProcessMap, setSelectedProcessMap] = useState<ProcessSelection[]>([]);
    const layoutTriggerRef = useRef<boolean>(false);
    const prevNodesRef = useRef<number>(0);
    const prevEdgesRef = useRef<number>(0);

    const nodesInitialized = useNodesInitialized();

    const rawMaterialIngredients = useIngredientsList(nodes, 'rawMaterials');
    const allProductIngredients = useIngredientsList(nodes, 'allProducts');

    // Create debounced version of handleSelectProcess
    const handleSelectProcess = useCallback(
        debounce((processId: string, nodeId: string) => {
            // Add a new log entry with the node ID and process ID to the state
            setSelectedProcessMap((prevMap) => [
                ...prevMap,
                { nodeId, processId },
            ]);
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

    useEffect(() => {
        if (nodesInitialized && nodes.every(node => node.measured?.width && node.measured?.height)) {
            setNodesReady(true);
        } else {
            setNodesReady(false);
        }
    }, [nodesInitialized, nodes]); // check of setNodesReady makes trouble

    useEffect(() => {
        if (nodesReady) {
            layoutTriggerRef.current = true;
        }
    }, [nodesReady, desiredAmount, dagreConfig]);

    // START check if we still need this code section
    useEffect(() => {
        if (nodes.length !== nodesRef.current.length) {
            nodesRef.current = nodes;
            // console.log('TreeRenderer nodes updated:', nodes.length);
        }
    }, [nodes, nodesRef]);

    // we're trying to replace this pattern with the new thunks pattern
    // const { buildProductNode } = useProductNodeBuilder();
    // const { buildProcessNode } = useProcessNodeBuilder();

    // Layout effect for applying layout when nodes change or layout is needed
    useEffect(() => {
        console.log("Layout effect triggered with state:", {
            nodesLength: nodes.length,
            edgesLength: edges.length,  // Add this
            prevNodesRef: prevNodesRef.current,
            prevEdgesRef: prevEdgesRef.current,  // Add this ref for tracking edge changes
            needsLayoutState: needsLayout,
            nodesReadyState: nodesReady,
            layoutTriggerRef: layoutTriggerRef.current,
            rootNodeId
        });

        const hasStructuralChanges =
            prevNodesRef.current !== nodes.length ||
            prevEdgesRef.current !== edges.length ||
            needsLayout;

        // If nodes have been added or needsLayout is true, apply a preliminary layout
        // even if measurements aren't ready
        if (hasStructuralChanges) {
            console.log("Applying preliminary layout");

            // Use fallback dimensions for nodes without measurements
            const nodesWithFallbackDimensions = nodes.map(node => {
                if (!node.measured?.width || !node.measured?.height) {
                    return {
                        ...node,
                        measured: {
                            width: node.type === 'processNode' ? 250 : 300,
                            height: node.type === 'processNode' ? 120 : 150,
                            ...node.measured
                        }
                    };
                }
                return node;
            });

            // Dispatch the specialized layout action
            dispatch({
                type: 'APPLY_LAYOUT',
                payload: {
                    nodes: nodesWithFallbackDimensions,
                    edges,
                    dagreConfig,
                    needsReset: true
                }
            });

            prevNodesRef.current = nodes.length;
            prevEdgesRef.current = edges.length;
            return;
        }
        // Apply more precise layout once all measurements are ready
        if (layoutTriggerRef.current && nodesReady) {
            console.log("Applying final layout with measurements");

            // Dispatch the specialized layout action
            dispatch({
                type: 'APPLY_LAYOUT',
                payload: {
                    nodes,
                    edges,
                    dagreConfig,
                    needsReset: false
                }
            });

            layoutTriggerRef.current = false;
        }
    }, [nodes, edges, nodesReady, rootNodeId, dagreConfig, needsLayout, dispatch]); // we removed desiredAmount from the dependency array

    // Effect for product selection using the thunk pattern
    useEffect(() => {
        if (selectedProductId) {
            selectProductThunk(
                dispatch,
                selectedProductId,
                desiredAmount,
                handleSelectProcess,
                handleSerialize
            );
        }
    }, [selectedProductId, desiredAmount, dispatch, handleSelectProcess, handleSerialize]);

    // Effect for process selection using the thunk pattern
    useEffect(() => {
        if (selectedProcessMap.length > 0) {
            const lastEntry = selectedProcessMap[selectedProcessMap.length - 1];
            const { nodeId: parentNodeId, processId } = lastEntry;

            if (processId && parentNodeId) {
                // Find the parent node and its amount
                const parentNode = nodesRef.current.find((node) => node.id === parentNodeId) as ProductNodeType;
                if (!parentNode) return;

                const parentNodeAmount = parentNode?.data?.amount ?? 1;
                const parentNodeProductId = parentNode?.data?.productDetails?.id ?? '';

                selectProcessThunk(
                    dispatch,
                    processId,
                    parentNodeId,
                    parentNodeAmount,
                    parentNodeProductId,
                    edges,
                    handleSelectProcess,
                    handleSerialize
                );
            }
        }
    }, [selectedProcessMap, dispatch, edges, nodesRef, handleSelectProcess, handleSerialize]);

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
                    edgeTypes={edgeTypes}
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
                            rawMaterialIngredients={rawMaterialIngredients}
                            allProductIngredients={allProductIngredients}
                        />
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

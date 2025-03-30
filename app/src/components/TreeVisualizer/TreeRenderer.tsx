// components/TreeVisualizer/TreeRenderer.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    ReactFlow,
    MiniMap,
    useNodesInitialized
} from '@xyflow/react';
import { usePouchDB } from '@/contexts/PouchDBContext';
import { useFlow } from '@/contexts/FlowContext';
import { useReactFlowSetup } from '@/hooks/useReactFlowSetup';
import { useDagreConfig } from '@/hooks/useDagreConfig';
import { useLayoutManager } from '@/hooks/useLayoutManager';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import ProcessNode from './ProcessNode';
import ProductNode from './ProductNode';
import CustomEdge from '@/components/TreeVisualizer/CustomEdges';
import { ProductNode as ProductNodeType, ProcessNode as InfluenceNode } from '@/types/reactFlowTypes';
import '@xyflow/react/dist/style.css';
import LayoutConfigPanel from './LayoutConfigPanel';
import useIngredientsList from '@/utils/TreeVisualizer/useIngredientsList';
import IngredientsList from './IngredientsList';
import AmountInput from './AmountInput';
import { serializeProductionChain } from '@/utils/TreeVisualizer/serializeProductionChain';
import PouchDBViewer from '@/components/TreeVisualizer/PouchDbViewer';
import debounce from '@/utils/TreeVisualizer/debounce';
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
        isLoading,
        error,
        dispatch
    } = useFlow();
    const { applyLayout } = useLayoutManager(nodes, edges, dagreConfig, nodesReady);

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedProcessMap, setSelectedProcessMap] = useState<ProcessSelection[]>([]);
    
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

    // Check if nodes have measurements
    useEffect(() => {
        if (nodesInitialized && nodes.every(node => node.measured?.width && node.measured?.height)) {
            setNodesReady(true);
        } else {
            setNodesReady(false);
        }
    }, [nodesInitialized, nodes, setNodesReady]); // check of setNodesReady makes trouble

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
                    fitView={nodes.length > 0}
                    fitViewOptions={{ padding: 0.2 }}
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

// components/TreeVisualizer/TreeRenderer.tsx

import React, {
    useCallback,
    useEffect,
    useRef
} from 'react';
import {
    ReactFlow,
    MiniMap,
    useNodesInitialized,
} from '@xyflow/react';
import { usePouchDB } from '@/contexts/PouchDBContext';
import { useFlow } from '@/contexts/FlowContext';
import ProcessNode from './ProcessNode';
import ProductNode from './ProductNode';
import {
    ProcessNode as InfluenceNode
} from '@/types/reactFlowTypes';
import '@xyflow/react/dist/style.css';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import LayoutConfigPanel from './LayoutConfigPanel';
import useIngredientsList from '@/utils/TreeVisualizer/useIngredientsList';
import { serializeProductionChain } from '@/utils/TreeVisualizer/serializeProductionChain';
import debounce from '@/utils/TreeVisualizer/debounce';
import { useReactFlowSetup } from '@/hooks/useReactFlowSetup';
import { useDagreConfig } from '@/hooks/useDagreConfig';
import CustomEdge from '@/components/TreeVisualizer/CustomEdges';
import ControlPanel from '@/components/TreeVisualizer/ControlPanel';

const nodeTypes = {
    productNode: ProductNode,
    processNode: ProcessNode,
};

const edgeTypes = {
    custom: CustomEdge,
};

const TreeRenderer: React.FC = () => {
    const { memoryDb } = usePouchDB();

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect
    } = useReactFlowSetup();

    const {
        dagreConfig,
        updateDagreConfig
    } = useDagreConfig();

    const {
        nodesRef,
        desiredAmount,
        nodesReady,
        rootNodeId,
        needsLayout,
        selectedProductId,
        processSelections,
        dispatch
    } = useFlow();

    const layoutTriggerRef = useRef<boolean>(false);

    const prevNodesRef = useRef<number>(0);

    const nodesInitialized = useNodesInitialized();

    useEffect(() => {
        if (nodes.length !== nodesRef.current.length) {
            nodesRef.current = nodes;
        }
    }, [nodes, nodesRef]);

    const { buildProcessNode } = useProcessNodeBuilder();

    const handleSelectProcess = useCallback(
        // TODO: Investigate if handleSelectProcess is still needed. It appears to be unused.
        // Maintains Node Interactivity: When loading saved 
        // configurations, handleSelectProcess ensures that 
        // process nodes remain interactive and can trigger 
        // state updates when selected.
        debounce((processId: string, nodeId: string) => {
            // Add a new log entry with the node ID and process ID to the state
            dispatch({
                type: 'SELECT_PROCESS',
                payload: { nodeId, processId }
            });
        }, 300),
        []
    );

    const handleProductSelect = useCallback((productId: string) => {
        dispatch({
            type: 'SELECT_PRODUCT',
            payload: productId
        });
    }, [dispatch]);

    const handleSerialize = useCallback(
        async (focalNodeId: string) => {
            if (focalNodeId && nodesRef.current.length > 0 && memoryDb) {
                try {
                    await serializeProductionChain(focalNodeId, nodesRef.current as InfluenceNode[], memoryDb);
                } catch (error) {
                    console.error('Error serializing production chain:', error);
                }
            } else {
                console.log('No focal node selected, nodes are empty, or database is not initialized.');
            }
        },
        [memoryDb, nodesRef]
    );

    const rawMaterialIngredients = useIngredientsList(nodes, 'rawMaterials');

    const allProductIngredients = useIngredientsList(nodes, 'allProducts');

    useEffect(() => {
        if (nodesInitialized && nodes.every(node => node.measured?.width && node.measured?.height)) {
            dispatch({
                type: 'SET_NODES_READY',
                payload: true
            });
        } else {
            dispatch({
                type: 'SET_NODES_READY',
                payload: false
            });
        }
    }, [nodesInitialized, nodes, dispatch]);


    const applyLayoutIfNeeded = useCallback(() => {
        // Check if preliminary layout is needed
        if (prevNodesRef.current !== nodes.length || needsLayout) {

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
        }
        // Apply more precise layout once all measurements are ready
        else if (layoutTriggerRef.current && nodesReady) {

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
    }, [nodesReady, dagreConfig, needsLayout, dispatch]);

    useEffect(() => {
        applyLayoutIfNeeded();
    }, [applyLayoutIfNeeded]);

    useEffect(() => {
        if (nodesReady) {
            layoutTriggerRef.current = true;
            applyLayoutIfNeeded(); // Apply layout immediately when triggered
        }
    }, [nodesReady, dagreConfig, applyLayoutIfNeeded]);

    useEffect(() => {
        if (selectedProductId) {
            dispatch({
                type: 'BATCH_UPDATE',
                payload: {
                    nodes: [],
                    edges: []
                }
            });

            dispatch({
                type: 'REQUEST_PRODUCT_NODE_CREATION',
                payload: {
                    productId: selectedProductId,
                    amount: desiredAmount,
                    isRoot: true
                }
            });
        }
    }, [selectedProductId, dispatch]);

    const lastProcessedSelectionRef = useRef<number>(0);

    useEffect(() => {
        // Only process selections we haven't seen yet
        if (processSelections.length > lastProcessedSelectionRef.current) {
            // Get only the newest selection
            const newSelection = processSelections[processSelections.length - 1];
            const { nodeId: parentNodeId, processId } = newSelection;

            if (processId && parentNodeId) {
                // Update our ref to mark this selection as processed
                lastProcessedSelectionRef.current = processSelections.length;

                // Request node creation through the reducer
                dispatch({
                    type: 'REQUEST_PROCESS_NODE_CREATION',
                    payload: {
                        processId,
                        parentNodeId
                    }
                });
            }
        }
    }, [processSelections, buildProcessNode]);

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
                    <ControlPanel
                        rawMaterialIngredients={rawMaterialIngredients}
                        allProductIngredients={allProductIngredients}
                        handleSelectProcess={handleSelectProcess}
                        handleSerialize={handleSerialize}
                    />
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

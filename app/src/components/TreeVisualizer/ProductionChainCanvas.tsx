// components/TreeVisualizer/ProductionChainCanvas.tsx

import React, { useCallback, useEffect, useRef } from 'react';
import { ReactFlow, MiniMap, useNodesInitialized } from '@xyflow/react';
import { useReactFlowSetup } from '@/hooks/useReactFlowSetup';
import ProductNode from './ProductNode';
import ProcessNode from './ProcessNode';
import SideProductNode from './SideProductNode';
import SideProductCompoundNode from './SideProductCompoundNode';
import OutflowsCompoundNode from './OutflowsCompoundNode';
import CustomEdge from './CustomEdges';
import ControlPanel from './ControlPanel';
import LayoutConfigPanel from './LayoutConfigPanel';
import useIngredientsList from '@/utils/TreeVisualizer/useIngredientsList';
import debounce from '@/utils/TreeVisualizer/debounce';
import { useFlow } from '@/contexts/FlowContext';
import { useDagreConfig } from '@/hooks/useDagreConfig';
import '@xyflow/react/dist/style.css';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { layout } from '@dagrejs/dagre';

const nodeTypes = {
    productNode: ProductNode,
    processNode: ProcessNode,
    sideProductNode: SideProductNode,
    sideProductCompoundNode: SideProductCompoundNode,
    outflowsCompoundNode: OutflowsCompoundNode,
};

const edgeTypes = {
    custom: CustomEdge,
};

const ProductionChainCanvas: React.FC = () => {

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
        needsLayout,
        layoutTrigger,
        dispatch
    } = useFlow();

    // Calculate ingredient lists
    const rawMaterialIngredients = useIngredientsList(nodes as InfluenceNode[], 'rawMaterials');
    const allProductIngredients = useIngredientsList(nodes as InfluenceNode[], 'allProducts');

    // Process selection handler
    const handleSelectProcess = useCallback(
        debounce((processId: string, nodeId: string) => {
            dispatch({
                type: 'SELECT_PROCESS',
                payload: { nodeId, processId }
            });
        }, 300),
        []
    );

    // Serialization handler
    const handleSerialize = useCallback((focalNodeId: string): Promise<void> => {
        return Promise.resolve(
            dispatch({
                type: 'SAVE_PRODUCTION_CHAIN',
                payload: { focalNodeId }
            })
        );
    }, [dispatch]);

    // -- Integrated from TreeRenderer --
    const nodesInitialized = useNodesInitialized();
    const lastLayoutTimeRef = useRef(0);
    const measurementRequestedRef = useRef(false);

    // Check if all nodes have measurements - with debounce and safeguards
    useEffect(() => {
        // Avoid repeated measurement requests in short succession
        if (nodesInitialized &&
            nodes.length > 0 &&
            !measurementRequestedRef.current &&
            nodes.every(node => node.measured?.width && node.measured?.height)) {

            // Add 500ms minimum interval between layout requests to avoid loops
            const now = Date.now();
            if (now - lastLayoutTimeRef.current > 500) {
                measurementRequestedRef.current = true;
                lastLayoutTimeRef.current = now;

                dispatch({
                    type: 'REQUEST_LAYOUT',
                    payload: { trigger: 'MEASUREMENTS_READY' }
                });

                // Reset after a short delay
                setTimeout(() => {
                    measurementRequestedRef.current = false;
                }, 500);
            }
        }
    }, [nodesInitialized, nodes, dispatch]);
    // -- End of integrated TreeRenderer logic --

    // Handle layout application
    useEffect(() => {
        if (needsLayout && layoutTrigger && layoutTrigger === 'MEASUREMENTS_READY') {
            console.log(`[ProductionChainCanvas | Dagre] Applying layout with trigger: ${layoutTrigger}, node count: ${nodes.length}`);
            console.log("[ProductionChainCanvas | Dagre] About to apply layout with config:", dagreConfig);

            dispatch({
                type: 'APPLY_LAYOUT',
                payload: {
                    nodes,
                    edges,
                    dagreConfig,
                    layoutTrigger: layoutTrigger
                }
            });
        }
    }, [nodes, edges, dagreConfig, layoutTrigger, needsLayout, dispatch]);

    return (
        <div className="w-full h-full relative">
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
                {/* Control Panel Component */}
                <ControlPanel
                    rawMaterialIngredients={rawMaterialIngredients}
                    allProductIngredients={allProductIngredients}
                    handleSelectProcess={handleSelectProcess}
                    handleSerialize={handleSerialize}
                />

                {/* Layout Config Panel */}
                <LayoutConfigPanel
                    dagreConfig={dagreConfig}
                    updateDagreConfig={updateDagreConfig}
                />

                {/* MiniMap */}
                <MiniMap
                    nodeStrokeWidth={3}
                    pannable={true}
                    inversePan={true}
                    maskColor='rgba(30,30,30,1)'
                />
            </ReactFlow>
        </div>
    );
};

export default ProductionChainCanvas;
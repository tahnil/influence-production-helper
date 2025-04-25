import React, { useCallback } from 'react';
import { ReactFlow, MiniMap } from '@xyflow/react';
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
        nodesRef,
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
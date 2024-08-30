// components/TreeVisualizer/TreeRenderer.tsx

import React, { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    MiniMap,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Edge,
    Node,
    NodeChange,
    EdgeChange,
    Connection,
    ReactFlowProvider,
    useNodesInitialized,
    getSmoothStepPath,
} from '@xyflow/react';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import ProductNode from './ProductNode';
import { ProductNode as ProductNodeType } from '@/types/reactFlowTypes'
import ProcessNode from './ProcessNode';
import '@xyflow/react/dist/style.css';
import useProductNodeBuilder from '@/utils/TreeVisualizer/useProductNodeBuilder';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import ControlPanel from './ControlPanel';
import useDagreLayout from '@/utils/TreeVisualizer/useDagreLayout';
import useIngredientsList from '@/utils/TreeVisualizer/useIngredientsList';
import IngredientsList from './IngredientsList';
import AmountInput from './AmountInput';
import useDesiredAmount from '@/utils/TreeVisualizer/useDesiredAmount';

interface ProcessSelection {
    nodeId: string;
    processId: string;
}

const nodeTypes = {
    productNode: ProductNode,
    processNode: ProcessNode,
};

const TreeRenderer: React.FC = () => {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedProcessMap, setSelectedProcessMap] = useState<ProcessSelection[]>([]);
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [desiredAmount, setDesiredAmount] = useState<number>(1);

    const nodesInitialized = useNodesInitialized();

    const [dagreConfig, setDagreConfig] = useState({
        align: 'DR',
        rankdir: 'TB',
        nodesep: 20,
        ranksep: 70,
        edgesep: 10,
        marginx: 0,
        marginy: 0,
        acyclicer: 'greedy',
        ranker: 'network-simplex',
        minlen: 2,
        weight: 1,
        labelpos: 'r',
        labeloffset: 10,
        direction: 'LR',
    });

    const updateDagreConfig = (newConfig: Partial<typeof dagreConfig>) => {
        setDagreConfig((prevConfig) => ({
            ...prevConfig,
            ...newConfig,
        }));
    };

    const { buildProductNode } = useProductNodeBuilder();
    const { buildProcessNode } = useProcessNodeBuilder();

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [nodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
        []
    );

    const debounce = (fn: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout | undefined;

        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    };

    const handleSelectProcess = useCallback(
        debounce((processId: string, nodeId: string) => {
            // Add a new log entry with the node ID and process ID to the state
            setSelectedProcessMap((prevMap) => [
                ...prevMap,
                { nodeId, processId },
            ]);

            console.log('Selected Process Map:', [
                ...selectedProcessMap,
                { nodeId, processId },
            ]);
        }, 300),
        []
    );

    useEffect(() => {
        const newIngredients = useIngredientsList(nodes);
        setIngredients(newIngredients);
    }, [nodes]);

    useEffect(() => {
        if (nodesInitialized) {
            const { nodes: layoutedNodes, edges: layoutedEdges } = useDagreLayout(nodes, edges, dagreConfig);

            const smoothstepEdges = layoutedEdges.map((edge) => ({
                ...edge,
                type: 'smoothstep',
            }));

            setNodes(layoutedNodes);
            setEdges(smoothstepEdges);
        }
    }, [nodesInitialized, dagreConfig]);

    useEffect(() => {
        const fetchAndBuildRootNode = async () => {
            if (selectedProductId) {
                setNodes([]); // Reset nodes when a new product is selected
                setEdges([]); // Reset edges

                const rootNode = await buildProductNode(
                    selectedProductId,
                    selectedProcessId,
                    desiredAmount,
                    handleSelectProcess,
                );

                if (rootNode) {
                    const namedRootNode = {
                        ...rootNode,
                        id: 'root',
                    };

                    setNodes([namedRootNode]); // Set the new root node
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
                    const result = await buildProcessNode(processId, parentNodeId, parentNodeAmount, parentNodeProductId, handleSelectProcess);
                    if (result) {
                        const { processNode, productNodes } = result;

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
                            updatedNodes = [...updatedNodes, processNode, ...productNodes];

                            // Step 5: Create edges between the ProcessNode and each ProductNode
                            const newEdges = productNodes.map((productNode) => ({
                                id: `edge-${processNode.id}-${productNode.id}`,
                                source: processNode.id,
                                target: productNode.id,
                            }));

                            updatedEdges = [...updatedEdges, ...newEdges];

                            // Step 6: Add the edge between the parent ProductNode and the ProcessNode
                            updatedEdges.push({
                                id: `edge-${parentNodeId}-${processNode.id}`,
                                source: parentNodeId,
                                target: processNode.id,
                            });

                            setEdges(updatedEdges);
                            return updatedNodes;
                        });
                    }
                }
            }
        };

        fetchAndBuildProcessNode();
    }, [selectedProcessMap, buildProcessNode]);

    useEffect(() => {
        if (nodesInitialized) {
            setNodes((prevNodes) => {
                const updatedNodes = prevNodes.map(node => {
                    const updatedNode = { ...node };
                    const updatedNodeData = useDesiredAmount([updatedNode], desiredAmount);
                    return { ...updatedNode, data: { ...updatedNodeData[0].data } };
                });
                return updatedNodes;
            });
        };
    }, [desiredAmount, nodesInitialized]);

    // Utility function to get all descendant ids of a given node id
    const getDescendantIds = (nodeId: string, nodes: Node[]): string[] => {
        // Find all direct children (ProductNodes)
        const directChildren = nodes.filter((node) => node.parentId === nodeId);

        // Recursively find all descendants for each direct child
        const allDescendants = directChildren.reduce<string[]>((acc, child) => {
            const childDescendants = getDescendantIds(child.id, nodes);
            return [...acc, child.id, ...childDescendants];
        }, []);

        // Return the list of all descendant IDs
        return allDescendants;
    };

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
                >
                    <div className="absolute bottom-4 left-4 bg-background p-4 shadow-lg rounded-lg z-10 max-h-[90vh] overflow-y-auto w-[35ch]">
                        <h2 className="text-xl font-semibold mb-4">Controls</h2>
                        <ProductSelector
                            onProductSelect={setSelectedProductId}
                            className="p-2 border rounded border-gray-300 mb-4 w-full"
                        />
                        <AmountInput
                            desiredAmount={desiredAmount}
                            onChange={setDesiredAmount}
                            label="Desired Amount"
                        />
                        {/* <ControlPanel
                            dagreConfig={dagreConfig}
                            updateDagreConfig={updateDagreConfig}
                        /> */}
                        <IngredientsList ingredients={ingredients} /> {/* Display ingredients list */}
                    </div>
                    <MiniMap
                        nodeStrokeWidth={3}
                        pannable={true}
                    />
                </ReactFlow>
            </div>
        </div>
    );
};

export default function () {
    return (
        <ReactFlowProvider>
            <TreeRenderer />
        </ReactFlowProvider>
    );
}

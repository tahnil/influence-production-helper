// components/TreeVisualizer/TreeRenderer.tsx
// 
// The TreeRenderer component is a React component that visualizes a hierarchical tree structure using D3.js. 
// It allows users to select a product, which then populates the tree with nodes representing the product and 
// its associated processes. Users can further interact with the tree by selecting processes for each product 
// node, dynamically updating the tree with additional nodes representing the inputs required for the selected processes.
// 
// ########################
// Key Components and Hooks
// ########################
// 
// 1. TreeRenderer Component
// — Manages the state for the selected product, desired amount, and the tree data.
// — Renders the product selector and the D3 visualization container.
// — Utilizes custom hooks to fetch data and build the tree nodes.
// 2. Custom Hooks
// — useInfluenceProducts: Fetches the list of products available in the system.
// — useProcessesByProductId: Fetches processes associated with a specific product.
// — useProcessNodeBuilder: Builds process nodes by fetching inputs and calculating values.
// — useProductNodeBuilder: Builds product nodes including their details and associated processes.
// 3. D3 Utilities
// — initializeD3Tree: Initializes the D3 tree with the root node, setting up nodes and links in the tree layout.
// — updateD3Tree: Updates the existing D3 tree with new nodes and links as the tree data changes.
// — injectForeignObjects: Adds interactive elements (foreign objects) to D3 nodes, such as process selection dropdowns, and copy-to-clipboard functionality.
// 
// ########################
// Detailed Explanation of Each Component and Function
// ########################
// 
// — State Management: Uses useState to manage the selected product ID, tree data, the desired end product amount, and the current transform state of the D3 tree.
// — Refs: Uses useRef to manage references to the D3 container, the root node of the tree, and the update function for the D3 tree.
// — Product Selection: The handleSelectProduct function updates the selected product ID, fetches associated processes, and builds the root node of the tree.
// — Tree Rendering: The useEffect hook listens for changes in the rootNode and initializes the D3 tree, ensuring that the visualization updates appropriately.
// — Injecting Foreign Objects: Another useEffect hook injects foreign objects (like dropdowns and interactive elements) into the D3 nodes, allowing for user interaction with the tree visualization.
// — Error Handling: Uses conditional rendering to display error messages if data fetching fails or if there's an issue with building process nodes.
//
// ########################
// The TreeRenderer component and its associated hooks and utilities manage a dynamic D3 tree visualization. 
// It allows users to select a product, initializes the tree with the selected product as the root node, 
// and dynamically updates the tree based on user interactions (such as selecting processes). The 
// architecture is modular, with custom hooks handling data fetching and node building, and D3 utilities 
// managing the rendering and updating of the tree visualization. This structure ensures that the tree 
// remains responsive to user inputs and updates in real time.
// ########################

import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, Edge, Node, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import ProductNode from './ProductNode';
import ProcessNode from './ProcessNode';
import '@xyflow/react/dist/style.css';
import useProductNodeBuilder from '@/utils/TreeVisualizer/useProductNodeBuilder';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';

interface ProductionChainData {
    // Define this interface based on your requirements later
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
    const [selectedProcessMap, setSelectedProcessMap] = useState<{ [key: string]: string | null }>({});

    const { buildProductNode } = useProductNodeBuilder();
    const { buildProcessNode } = useProcessNodeBuilder();

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
        []
    );

    type AnyFunction = (...args: any[]) => void;

    const debounce = (fn: AnyFunction, delay: number) => {
        let timeoutId: NodeJS.Timeout | undefined;

        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    };

    const handleSelectProcess = useCallback(debounce((processId: string, nodeId: string) => {
        // Store the object with the node ID and process ID in the state
        setSelectedProcessMap((prevMap) => {
            if (prevMap[nodeId] !== processId) {
                return {
                    ...prevMap,
                    [nodeId]: processId
                };
            }
            return prevMap;
        });

        console.log('Selected Process Map:', {
            ...selectedProcessMap,
            [nodeId]: processId,
        });
    }, 300), []);

    useEffect(() => {
        const fetchAndBuildRootNode = async () => {
            if (selectedProductId) {
                setNodes([]); // Reset nodes when a new product is selected
                setEdges([]); // Reset edges

                const rootNode = await buildProductNode(
                    selectedProductId,
                    selectedProcessId,
                    handleSelectProcess,
                );

                if (rootNode) {
                    setNodes([rootNode]); // Set the new root node
                }
            }
        };

        fetchAndBuildRootNode();
    }, [selectedProductId, buildProductNode]);

    useEffect(() => {
        const fetchAndBuildProcessNode = async () => {
            const processEntries = Object.entries(selectedProcessMap);
            if (processEntries.length > 0) {
                const lastEntry = processEntries[processEntries.length - 1];
                const [parentNodeId, processId] = lastEntry;

                if (processId && parentNodeId) {
                    const result = await buildProcessNode(processId, parentNodeId, handleSelectProcess);

                    if (result) {
                        const { processNode, productNodes } = result;
                        setNodes((currentNodes) => [
                            ...currentNodes,
                            processNode,
                            ...productNodes,
                        ]);
                    }
                }
            }
        };

        fetchAndBuildProcessNode();
    }, [selectedProcessMap, buildProcessNode]);

    // Utility function to get all descendant ids of a given node id
    const getDescendantIds = (nodeId: string, nodes: Node[]): string[] => {
        const directChildren = nodes.filter((node) => node.parentId === nodeId);
        const allDescendants = directChildren.flatMap((child) =>
            [child.id, ...getDescendantIds(child.id, nodes)]
        );
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
                >
                    <div className="absolute bottom-4 right-4 bg-background p-4 shadow-lg rounded-lg z-10 max-h-[90vh] overflow-y-auto w-[35ch]">
                        <h2 className="text-xl font-semibold mb-4">Controls</h2>
                        <ProductSelector
                            onProductSelect={setSelectedProductId}
                            className="p-2 border rounded border-gray-300 mb-4 w-full"
                        />
                    </div>
                </ReactFlow>
            </div>
        </div>
    );
};

export default TreeRenderer;

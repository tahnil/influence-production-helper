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

import React, { useState, useCallback } from 'react';
import { ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, Edge, Node } from '@xyflow/react';
import ProductNode from './ProductNode';
import ProcessNode from './ProcessNode';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import { generateUniqueId } from '@/utils/generateUniqueId';
import '@xyflow/react/dist/style.css';
import { InfluenceProcess } from '@/types/influenceTypes';

interface ProductionChainData {
    // Define this interface based on your requirements later
}

const nodeTypes = {
    productNode: ProductNode,
    processNode: ProcessNode,
};

const TreeRenderer: React.FC = () => {
    const { influenceProducts } = useInfluenceProducts();
    const { getProcessesByProductId } = useProcessesByProductId();
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onConnect = useCallback(
        (connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges]
    );

    const removeNodeAndDescendants = useCallback(
        (nodeId: string) => {
            const descendantEdges = edges.filter(edge => edge.source === nodeId);

            descendantEdges.forEach(edge => removeNodeAndDescendants(edge.target));

            // Remove the node and its associated edges
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        },
        [edges]
    );

    const handleProcessSelected = useCallback(
        async (parentNodeId: string, selectedProcessId: string) => {
            const processNodeId = generateUniqueId(); // Generate a unique ID for the process node

            // Find the selected process by its ID
            console.log('nodes: ', nodes);
            const parentNode = nodes.find(node => node.id === parentNodeId);
            if (!parentNode || !parentNode.data) {
                console.error(`Parent node with id ${parentNodeId} not found`);
                return;
            }

            const selectedProcess = parentNode.data.processes.find(
                (process: InfluenceProcess) => process.id === selectedProcessId
            );

            if (!selectedProcess) {
                console.error(`Process with id ${selectedProcessId} not found`);
                return;
            }

            // Check if there is an existing process node connected to this parent product node
            const existingProcessNode = nodes.find((node) =>
                node.parentId === parentNodeId && node.type === 'processNode'
            );

            if (existingProcessNode) {
                removeNodeAndDescendants(existingProcessNode.id);
            }

            // Create the new process node
            const newProcessNode: Node = {
                id: processNodeId,
                type: 'processNode',
                position: { x: 200, y: 100 },
                data: {
                    processName: selectedProcess.name,
                    inputProducts: selectedProcess.inputs.map(input => input.productId),
                },
                parentId: parentNodeId,
            };

            // Create new product nodes for the inputs
            const inputProductNodesPromises = newProcessNode.data.inputProducts.map(async (productId, index) => {
                const inputProductNodeId = generateUniqueId();

                const selectedProduct = influenceProducts.find(product => product.id === productId);
                if (!selectedProduct) {
                    console.error(`Product with id ${productId} not found`);
                    return null;
                }

                const processes = await getProcessesByProductId(productId);

                return {
                    id: inputProductNodeId,
                    type: 'productNode',
                    position: { x: 400, y: index * 100 },
                    data: {
                        InfluenceProduct: selectedProduct,
                        ProductionChainData: {}, // Initialize empty ProductionChainData (to be defined later)
                        processes, // Store the fetched processes in the node data
                        onProcessSelected: (process: string) =>
                            handleProcessSelected(inputProductNodeId, process),
                    },
                    parentId: processNodeId, // This product node's parent is the process node
                };
            });

            const inputProductNodes = (await Promise.all(inputProductNodesPromises)).filter(Boolean);

            console.log('A new ProcessNode has been created:\n', newProcessNode);
            console.log('One or many children ProductNode has been created:\n', inputProductNodes);

            setNodes((nds) => nds.concat(newProcessNode, ...inputProductNodes));

            // Create an edge to connect the process node to the product node
            const newEdge: Edge = {
                id: generateUniqueId(),
                source: parentNodeId,
                target: processNodeId,
            };

            // Create edges to connect the process node to the input product nodes
            const inputProductEdges = inputProductNodes.map((inputNode) => ({
                id: generateUniqueId(),
                source: processNodeId,
                target: inputNode.id,
            }));

            setEdges((eds) => eds.concat(newEdge, ...inputProductEdges));
        },
        [nodes, edges, removeNodeAndDescendants, influenceProducts, getProcessesByProductId]
    );

    const handleProductSelect = useCallback(
        async (productId: string) => {
            const rootNodeId = generateUniqueId(); // Generate unique ID for the root product node
            const selectedProduct = influenceProducts.find(product => product.id === productId);

            if (!selectedProduct) {
                console.error(`Product with id ${productId} not found`);
                return;
            }

            try {
                // Fetch processes that yield this product
                const processes = await getProcessesByProductId(productId);

                const initialNode: Node = {
                    id: rootNodeId,
                    type: 'productNode',
                    position: { x: 0, y: 0 },
                    data: {
                        InfluenceProduct: selectedProduct, // Store the detailed product data
                        ProductionChainData: {}, // Initialize empty ProductionChainData (to be defined later)
                        processes, // Store the fetched processes in the node data
                        onProcessSelected: async (processId: string) => {
                            await handleProcessSelected(rootNodeId, processId); // Directly call the handler with the updated node
                        },
                    },
                };

                console.log('A new Root ProductNode has been created:\n', initialNode);

                setNodes([initialNode]);
                setEdges([]);
            } catch (error) {
                console.error('Error fetching processes:', error);
            }
        },
        [handleProcessSelected, influenceProducts, getProcessesByProductId]
    );

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
                            onProductSelect={handleProductSelect}
                            className="p-2 border rounded border-gray-300 mb-4 w-full"
                        />
                    </div>
                </ReactFlow>
            </div>
        </div>
    );
};

export default TreeRenderer;

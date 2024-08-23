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
import { ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import ProductNode from './ProductNode';
import ProcessNode from './ProcessNode';
import '@xyflow/react/dist/style.css';

import ProductSelector from '@/components/TreeVisualizer/ProductSelector';

const initialNodes = [
    {
        id: '1',
        type: 'productNode',
        position: { x: 0, y: 0 },
        data: {
            product: 'End Product',
            processes: ['Process A', 'Process B', 'Process C'],
            onProcessSelected: (process: string) => console.log(`Process selected: ${process}`),
        },
    },
];

const nodeTypes = {
    productNode: ProductNode,
    processNode: ProcessNode,
};

const TreeRenderer: React.FC = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

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

    const handleProcessSelected = useCallback(
        (nodeId, selectedProcess) => {
            const processNodeId = `${nodeId}-process-${selectedProcess}`;
            const newProcessNode = {
                id: processNodeId,
                type: 'processNode',
                position: { x: 200, y: 100 },
                data: {
                    processName: selectedProcess,
                    inputProducts: ['Input Product 1', 'Input Product 2'],
                },
            };

            const inputProductNodes = ['Input Product 1', 'Input Product 2'].map(
                (product, index) => ({
                    id: `${processNodeId}-product-${index}`,
                    type: 'productNode',
                    position: { x: 400, y: index * 100 },
                    data: {
                        product,
                        processes: ['Process X', 'Process Y'],
                        onProcessSelected: (process: string) =>
                            handleProcessSelected(`${processNodeId}-product-${index}`, process),
                    },
                })
            );

            setNodes((nds) => nds.concat(newProcessNode, ...inputProductNodes));

            const newEdges = inputProductNodes.map((inputNode) => ({
                id: `e-${processNodeId}-${inputNode.id}`,
                source: processNodeId,
                target: inputNode.id,
            }));

            setEdges((eds) => eds.concat(newEdges));
        },
        [setNodes, setEdges]
    );

    const handleProductSelect = useCallback(
        (productName: string) => {
            const initialNode = {
                id: 'initial-product',
                type: 'productNode',
                position: { x: 0, y: 0 },
                data: {
                    product: productName,
                    processes: ['Process A', 'Process B', 'Process C'],
                    onProcessSelected: (process: string) =>
                        handleProcessSelected('initial-product', process),
                },
            };

            setNodes([initialNode]);
            setEdges([]);
        },
        [handleProcessSelected]
    );

    return (
        <div className="w-full h-full relative">
            <div className="absolute bottom-4 right-4 bg-background p-4 shadow-lg rounded-lg z-10 max-h-[90vh] overflow-y-auto w-[35ch]">
                <h2 className="text-xl font-semibold mb-4">Controls</h2>
                <ProductSelector
                    onProductSelect={handleProductSelect}
                    className="p-2 border rounded border-gray-300 mb-4 w-full"
                />
            </div>
            <div className="tree-renderer" style={{ width: '100%', height: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    style={{ backgroundColor: '#D3D2E5' }}
                />
            </div>
        </div>
    );
};

export default TreeRenderer;

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
import { ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ProductNodeComponent from './ProductNodeComponent';
import ProcessNodeComponent from './ProcessNodeComponent';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import AmountInput from '@/components/TreeVisualizer/AmountInput';
import ProductionInputs from '@/components/TreeVisualizer/ProductionInputs';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import { fetchProductImageBase64 } from '@/utils/TreeVisualizer/fetchProductImageBase64';
import { buildProductNode } from '@/utils/TreeVisualizer/buildProductNode';

const nodeTypes = {
    productNode: ProductNodeComponent,
    processNode: ProcessNodeComponent,
};

const TreeRenderer = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedProductId, setSelectedProduct] = useState<string | null>(null);
    const [desiredAmount, setDesiredAmount] = useState<number>(1);
    const [treeData, setTreeData] = useState<Node | null>(null); // Store the root node

    const { influenceProducts, loading, error } = useInfluenceProducts();
    const { getProcessesByProductId } = useProcessesByProductId();
    const { buildProcessNode } = useProcessNodeBuilder();

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

    // Convert the tree structure to React Flow nodes and edges
    const convertTreeToNodesAndEdges = (rootNode: Node): { nodes: Node[], edges: Edge[] } => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        const traverseTree = (node: Node, parentId: string | null = null) => {
            nodes.push(node);

            if (parentId) {
                edges.push({
                    id: `edge-${parentId}-${node.id}`,
                    source: parentId,
                    target: node.id,
                });
            }

            const children = (node.data as any)?.children || [];
            children.forEach((childNode: Node) => traverseTree(childNode, node.id));
        };

        traverseTree(rootNode);
        return { nodes, edges };
    };

    const handleSelectProduct = useCallback(async (productId: string | null) => {
        if (!productId) return;

        const processes = await getProcessesByProductId(productId);
        const selectedProduct = influenceProducts.find(product => product.id === productId);

        if (selectedProduct) {
            const base64Image = await fetchProductImageBase64(productId);
            const newRootNode = buildProductNode(selectedProduct, processes, desiredAmount, base64Image, buildProcessNodeCallback);

            console.log("New root node data:", newRootNode);

            const { nodes, edges } = convertTreeToNodesAndEdges(newRootNode);

            setNodes(nodes);
            setEdges(edges);
            setTreeData(newRootNode);
        }
    }, [influenceProducts, desiredAmount, getProcessesByProductId]);

    const handleAmountChange = useCallback((newDesiredAmount: number) => {
        setDesiredAmount(newDesiredAmount);
        if (treeData) {
            const updatedTreeData = { ...treeData }; // Clone treeData to avoid mutating state directly
            // Update logic for recalculating values based on new amount
            const { nodes, edges } = convertTreeToNodesAndEdges(updatedTreeData);
            setNodes(nodes);
            setEdges(edges);
        }
    }, [treeData]);

    const buildProcessNodeCallback = useCallback(async (selectedProcessId: string, parentNode: Node) => {
        if (!selectedProcessId || (parentNode.data as any).nodeType !== 'product') return;

        const newProcessNode = await buildProcessNode(selectedProcessId, (parentNode.data as any).amount, (parentNode.data as any).productData.id);

        const updatedTreeData = { ...treeData };
        const updateTree = (node: Node) => {
            if (node.id === parentNode.id) {
                (node.data as any).children.push(newProcessNode);
            } else {
                const children = (node.data as any)?.children || [];
                children.forEach((childNode: Node) => updateTree(childNode));
            }
        };

        updateTree(updatedTreeData);
        setTreeData(updatedTreeData);

        const { nodes, edges } = convertTreeToNodesAndEdges(updatedTreeData);
        setNodes(nodes);
        setEdges(edges);
    }, [treeData]);

    if (loading) return <div>Loading products...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="w-full h-full relative">
            <div className="absolute bottom-4 right-4 bg-background p-4 shadow-lg rounded-lg z-10 max-h-[90vh] overflow-y-auto w-[35ch]">
                <h2 className="text-xl font-semibold mb-4">Controls</h2>
                <ProductSelector
                    products={influenceProducts}
                    selectedProductId={selectedProductId}
                    onSelect={handleSelectProduct}
                    className="p-2 border rounded border-gray-300 mb-4 w-full"
                />
                <AmountInput
                    desiredAmount={desiredAmount}
                    onChange={handleAmountChange}
                    label="Desired Amount"
                    className="p-2 border rounded border-gray-300 mb-4 w-full"
                />
                <ProductionInputs treeData={treeData?.data} />
            </div>
            <div className="tree-renderer" style={{ width: '100%', height: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    style={{ background: '#282c34' }}
                />
            </div>
        </div>
    );
};

export default TreeRenderer;

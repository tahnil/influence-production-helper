// components/TreeRenderer.tsx
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
// — Manages the state for the selected product and the tree data.
// — Renders the product selector and the D3 visualization container.
// — Utilizes custom hooks to fetch data and build the tree nodes.
// 2. Custom Hooks
// — useInfluenceProducts: Fetches the list of products.
// — useProductNodeBuilder: Builds product nodes including their details and associated processes.
// — useProcessNodeBuilder: Builds process nodes including the required input products.
// 3. D3 Utilities
// — initializeD3Tree: Initializes the D3 tree with the root node and renders nodes and links.
// — updateD3Tree: Updates the existing D3 tree with new nodes and links.
// — injectForeignObjects: Adds interactive elements (foreign objects) to D3 nodes, such as process selection dropdowns.
// 
// ########################
// Detailed Explanation of Each Component and Function
// ########################
// 
// — State Management: Uses useState to manage the selected product ID, tree data, and the current transform state.
// — Refs: Uses useRef to manage references to the D3 container, root node, and update function.
// — Product Selection: handleSelectProduct updates the selected product ID and fetches associated processes.
// — Tree Rendering: The useEffect hook listens for changes in the rootNode and initializes the D3 tree.
// — Injecting Foreign Objects: Another useEffect hook injects foreign objects (process selection dropdowns) into the D3 nodes.
//
// ########################
// The TreeRenderer component and its associated hooks and utilities manage a dynamic D3 tree visualization. 
// It allows users to select a product, initializes the tree with the selected product as the root node, 
// and dynamically updates the tree based on user interactions (such as selecting processes). The 
// architecture is modular, with custom hooks handling data fetching and node building, and D3 utilities 
// managing the rendering and updating of the tree visualization.
// ########################

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ProductSelector from './ProductSelector';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import { initializeD3Tree, updateD3Tree, injectForeignObjects } from '@/utils/d3Tree';
import { D3TreeNode, ProcessNode, ProductNode } from '@/types/d3Types';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import { buildProductNode } from '@/utils/TreeVisualizer/buildProductNode';

const TreeRenderer: React.FC = () => {
    // State to keep track of the selected product ID and tree data
    const [selectedProductId, setSelectedProduct] = useState<string | null>(null);
    const [rootNode, setRootNode] = useState<D3TreeNode | null>(null);
    const [treeData, setTreeData] = useState<D3TreeNode | null>(null);
    const [transform, setTransform] = useState<d3.ZoomTransform | null>(null);

    // State to keep track of desired end product amount
    const [desiredAmount, setDesiredAmount] = useState<number>(1);

    // Refs for D3 container, root node, and update function
    const d3RenderContainer = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<d3.HierarchyPointNode<D3TreeNode> | null>(null);
    const updateRef = useRef<(source: d3.HierarchyPointNode<D3TreeNode> | null) => void>(() => { });

    // Fetching influence products using a custom hook
    const { influenceProducts, loading, error } = useInfluenceProducts();
    const { processesByProductId, getProcessesByProductId } = useProcessesByProductId();
    const { buildProcessNode } = useProcessNodeBuilder();

    // Callback function to handle product selection
    const handleSelectProduct = useCallback(async (productId: string | null) => {
        setSelectedProduct(productId);
        if (productId) {
            // Fetch processes for the selected product
            const processes = await getProcessesByProductId(productId);

            // Find the selected product
            const selectedProduct = influenceProducts.find(product => product.id === productId);

            if (selectedProduct) {
                // Build the root node directly when the product is selected
                const newRootNode = buildProductNode(selectedProduct, processes, desiredAmount);
                setRootNode(newRootNode);

                // Initialize the D3 tree with the new root node
                if (d3RenderContainer.current) {
                    initializeD3Tree(d3RenderContainer.current, newRootNode, rootRef, updateRef, setTransform, transform ?? undefined);
                }

                // Set the tree data for further updates
                setTreeData(newRootNode);
            }
        }
    }, [influenceProducts, desiredAmount, getProcessesByProductId, transform]);

    // Handle changes in the desired amount
    const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDesiredAmount = Number(event.target.value);
        setDesiredAmount(newDesiredAmount);

        if (rootNode) {
            const updatedRootNode = JSON.parse(JSON.stringify(rootNode)) as ProductNode; // Deep clone to ensure immutability
            recalculateTreeValues(updatedRootNode, newDesiredAmount);

            // Update the root node in state to trigger re-rendering
            setRootNode(updatedRootNode);
        }
    };

    // Update treeData when the rootNode is updated
    useEffect(() => {
        if (rootNode) {
            // Set the updated root node as tree data to trigger re-rendering in the D3 tree
            setTreeData(rootNode);

            // Also trigger an update in the D3 tree
            if (d3RenderContainer.current) {
                updateD3Tree(d3RenderContainer.current, rootNode, rootRef, updateRef, setTransform, transform ?? undefined);
            }
        }
    }, [rootNode]);

    // UseEffect hook to re-render the D3 tree whenever treeData changes
    useEffect(() => {
        if (treeData && d3RenderContainer.current) {
            updateD3Tree(d3RenderContainer.current, treeData, rootRef, updateRef, setTransform, transform ?? undefined);
            injectForeignObjects(d3RenderContainer.current, rootRef, buildProcessNodeCallback);
        }
    }, [treeData]);

    const buildProcessNodeCallback = useCallback(async (selectedProcessId: string | null, parentNode: D3TreeNode, parentId: string | null): Promise<void> => {
        try {
            if (!selectedProcessId || parentNode.nodeType !== 'product') return;

            const parentProductNode = parentNode as ProductNode;
            const newProcessNode = await buildProcessNode(selectedProcessId, parentProductNode.amount, parentProductNode.productData.id);

            if (!newProcessNode) {
                throw new Error('Failed to build process node');
            }

            // Update the tree with the new process node
            const updateTreeData = (node: D3TreeNode): D3TreeNode => {
                if (node.id === parentNode.id) {
                    if (node.nodeType === 'product') {
                        const productNode = node as ProductNode;
                        const existingProcessIndex = productNode.children.findIndex(child => child.nodeType === 'process');
                        if (existingProcessIndex !== -1) {
                            // Replace the existing process node
                            const updatedChildren = [...productNode.children];
                            updatedChildren[existingProcessIndex] = newProcessNode as ProcessNode;
                            return {
                                ...productNode,
                                children: updatedChildren,
                            };
                        } else {
                            // Add the new process node
                            return {
                                ...productNode,
                                children: [...productNode.children, newProcessNode as ProcessNode],
                            };
                        }
                    }
                } else if (node.children) {
                    if (node.nodeType === 'product') {
                        const productNode = node as ProductNode;
                        return {
                            ...productNode,
                            children: productNode.children.map(updateTreeData) as ProcessNode[],
                        };
                    } else if (node.nodeType === 'process') {
                        const processNode = node as ProcessNode;
                        return {
                            ...processNode,
                            children: processNode.children.map(updateTreeData) as ProductNode[],
                        };
                    }
                }
                return node;
            };

            setTreeData(prevTreeData => {
                // console.log('[TreeRenderer] Previous tree data:', prevTreeData);
                const updatedTreeData = prevTreeData ? updateTreeData(prevTreeData) : null;
                // console.log('[TreeRenderer] Updated tree data:', updatedTreeData);
                return updatedTreeData;
            });
        } catch (err) {
            console.error('[TreeRenderer] Failed to build process node:', err);
        }
    }, [buildProcessNode]);

    const recalculateTreeValues = (rootNode: ProductNode, desiredAmount: number) => {
        const updateNodeValues = (node: ProductNode | ProcessNode, parentNode?: ProductNode) => {
            if (node.nodeType === 'product') {
                const productNode = node as ProductNode;
                if (!parentNode) {
                    productNode.amount = desiredAmount;
                } else {
                    if (parentNode.totalWeight > 0) {
                        productNode.amount = (parentNode.amount / parentNode.totalWeight) * productNode.totalWeight;
                    }
                }
                // Recalculate totalWeight, totalVolume, etc.
                productNode.totalWeight = productNode.amount * parseFloat(productNode.productData.massKilogramsPerUnit || '0');
                productNode.totalVolume = productNode.amount * parseFloat(productNode.productData.volumeLitersPerUnit || '0');
            } else if (node.nodeType === 'process') {
                const processNode = node as ProcessNode;
                if (parentNode) {
                    const output = processNode.processData.outputs.find(output => output.productId === parentNode.productData.id);
                    if (output) {
                        const unitsPerSR = parseFloat(output.unitsPerSR || '0');
                        processNode.totalRuns = Math.ceil(parentNode.amount / unitsPerSR);
                        processNode.totalDuration = processNode.totalRuns * parseFloat(processNode.processData.bAdalianHoursPerAction || '0');
                    }
                }
            }

            if (node.children) {
                node.children.forEach(child => updateNodeValues(child, node.nodeType === 'product' ? node as ProductNode : parentNode));
            }
        };

        updateNodeValues(rootNode);
    };

    if (loading) return <div>Loading products...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="tree-renderer" style={{ width: '100vw', height: '100vh', overflow: 'auto' }}>
            <ProductSelector
                products={influenceProducts}
                selectedProductId={selectedProductId}
                onSelect={handleSelectProduct}
            />
            <input
                type="number"
                value={desiredAmount}
                onChange={handleAmountChange}
                placeholder="Desired Amount"
                style={{ margin: '10px' }}
            />
            {(!loading && !error) && (
                <div className="d3-render-area" ref={d3RenderContainer} style={{ width: '100%', height: '100%' }} />
            )}
        </div>
    );
};

export default TreeRenderer;

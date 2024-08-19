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

import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as d3 from 'd3';
import { HierarchyNode } from 'd3-hierarchy';
import { D3TreeNode, ProcessNode, ProductNode } from '@/types/d3Types';
import AmountInput from '@/components/TreeVisualizer/AmountInput';
import ProductionInputs from '@/components/TreeVisualizer/ProductionInputs';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import { initializeD3Tree, updateD3Tree, injectPlaceholders } from '@/utils/d3Tree';
import { buildProductNode } from '@/utils/TreeVisualizer/buildProductNode';
import { fetchProductImageBase64 } from '@/utils/TreeVisualizer/fetchProductImageBase64';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import ProductNodeComponent from './ProductNodeComponent';
import ProcessNodeComponent from './ProcessNodeComponent';

const TreeRenderer: React.FC = () => {
    // State to keep track of the selected product ID and tree data
    const [selectedProductId, setSelectedProduct] = useState<string | null>(null);
    const [rootNode, setRootNode] = useState<D3TreeNode | null>(null);
    const [treeData, setTreeData] = useState<D3TreeNode | null>(null);
    const [transform, setTransform] = useState<d3.ZoomTransform | null>(null);

    // State to keep track of desired end product amount
    const [desiredAmount, setDesiredAmount] = useState<number>(1);

    // State for loading and error management during process node building
    const [processNodeLoading, setProcessNodeLoading] = useState(false);
    const [processNodeError, setProcessNodeError] = useState<string | null>(null);

    // Refs for D3 container, root node, and update function
    const d3RenderContainer = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<d3.HierarchyPointNode<D3TreeNode> | null>(null);
    const updateRef = useRef<(source: d3.HierarchyPointNode<D3TreeNode> | null) => void>(() => { });

    // Fetching influence products using a custom hook
    const { influenceProducts, loading, error } = useInfluenceProducts();
    const { processesByProductId, getProcessesByProductId } = useProcessesByProductId();
    const { buildProcessNode } = useProcessNodeBuilder();

    const updateComponentPositions = useCallback(() => {
        if (!d3RenderContainer.current || !transform || !treeData) return;
    
        const svgElement = d3RenderContainer.current.querySelector('svg');
        const containerRect = svgElement?.getBoundingClientRect();
    
        const rootHierarchy = d3.hierarchy(treeData);
    
        rootHierarchy.descendants().forEach((node: HierarchyNode<D3TreeNode>) => {
            const target = svgElement?.querySelector(`[data-id='${node.data.id}']`);
            const component = document.getElementById(`component-${node.data.id}`);
    
            if (target && component && containerRect) {
                const targetRect = target.getBoundingClientRect();
    
                const transformedX = transform.applyX(targetRect.left - containerRect.left);
                const transformedY = transform.applyY(targetRect.top - containerRect.top);
    
                // Position the React component at the transformed coordinates
                component.style.transform = `translate(${transformedX}px, ${transformedY}px)`;
            }
        });
    }, [treeData, transform]);
    
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
                const base64Image = await fetchProductImageBase64(productId);
                const newRootNode = buildProductNode(selectedProduct, processes, desiredAmount, base64Image);
                setRootNode(newRootNode);

                // Initialize the D3 tree with the new root node
                if (d3RenderContainer.current) {
                    initializeD3Tree(
                        d3RenderContainer.current,
                        newRootNode,
                        rootRef,
                        updateRef,
                        setTransform,
                        updateComponentPositions,
                        transform ?? undefined
                    );
                }

                // Set the tree data for further updates
                setTreeData(newRootNode);
            }
        }
    }, [influenceProducts, desiredAmount, getProcessesByProductId, transform, updateComponentPositions]);

    // Handle changes in the desired amount
    const handleAmountChange = (newDesiredAmount: number) => {
        setDesiredAmount(newDesiredAmount);

        if (treeData && rootNode) {
            const updatedTreeData = JSON.parse(JSON.stringify(treeData)); // Deep clone to ensure immutability
            recalculateTreeValues(updatedTreeData as ProductNode, newDesiredAmount);

            // Update the tree data in state
            setTreeData(updatedTreeData);
        }
    };

    // Call `updateComponentPositions` on zoom
    useEffect(() => {
        updateComponentPositions();
    }, [transform, treeData, updateComponentPositions]);

    // Update treeData when the rootNode is updated
    useEffect(() => {
        if (rootNode) {
            // Set the updated root node as tree data to trigger re-rendering in the D3 tree
            setTreeData(rootNode);

            // Also trigger an update in the D3 tree
            if (d3RenderContainer.current) {
                updateD3Tree(
                    d3RenderContainer.current,
                    rootNode,
                    rootRef,
                    updateRef,
                    setTransform,
                    transform ?? undefined
                );
            }
        }
    }, [rootNode]);

    // UseEffect hook to re-render the D3 tree whenever treeData changes
    useEffect(() => {
        if (treeData && d3RenderContainer.current) {
            updateD3Tree(
                d3RenderContainer.current,
                treeData,
                rootRef,
                updateRef,
                setTransform,
                transform ?? undefined
            );
            injectPlaceholders(d3RenderContainer.current, rootRef);
            updateComponentPositions();
        }
    }, [treeData]);

    const buildProcessNodeCallback = useCallback(async (selectedProcessId: string | null, parentNode: D3TreeNode, parentId: string | null): Promise<void> => {
        try {
            if (!selectedProcessId || parentNode.nodeType !== 'product') return;

            setProcessNodeLoading(true);
            setProcessNodeError(null);

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

            setProcessNodeLoading(false);
        } catch (err) {
            console.error('[TreeRenderer] Failed to build process node:', err);
            setProcessNodeError('Failed to build process node');
            setProcessNodeLoading(false);
        }
    }, [buildProcessNode]);

    const recalculateTreeValues = (rootNode: ProductNode, desiredAmount: number) => {
        const updateNodeValues = (node: ProductNode | ProcessNode, parentNode?: ProductNode | ProcessNode) => {
            console.log("Processing node:", node.name, "with parent:", parentNode ? parentNode.name : "None");
            if (node.nodeType === 'product') {
                const productNode = node as ProductNode;

                if (!parentNode) {
                    // This is the root node, set its amount based on the desired amount
                    productNode.amount = desiredAmount;
                    console.log('Setting desired amount in root node to ', desiredAmount);
                } else if (parentNode.nodeType === 'process') {
                    // Parent node is a process node; calculate the product amount based on the process
                    const processNode = parentNode as ProcessNode;
                    console.log('This is the parent process node: ', processNode);
                    console.log('And this is the productId we`re looking for: ', productNode.productData.id);
                    const input = processNode.processData.inputs.find(input => input.productId === productNode.productData.id);
                    console.log('This is the currently processed input of parent process node: ', input);
                    if (input) {
                        const unitsPerSR = parseFloat(input.unitsPerSR || '0');
                        console.log('This is the parent process node`s unitsPerSR: ', unitsPerSR);
                        productNode.amount = processNode.totalRuns * unitsPerSR;
                        console.log('Setting product node`s amount to: ', productNode.amount);
                    }
                }

                // Recalculate totalWeight and totalVolume
                productNode.totalWeight = productNode.amount * parseFloat(productNode.productData.massKilogramsPerUnit || '0');
                productNode.totalVolume = productNode.amount * parseFloat(productNode.productData.volumeLitersPerUnit || '0');

                // Continue with child nodes, passing the current product node as the parent
                if (productNode.children) {
                    productNode.children.forEach(child => updateNodeValues(child, productNode));
                }
            } else if (node.nodeType === 'process') {
                const processNode = node as ProcessNode;

                if (parentNode && parentNode.nodeType === 'product') {
                    // Parent node is a product node; calculate the total runs and duration for the process node
                    const parentProductNode = parentNode as ProductNode;
                    const output = processNode.processData.outputs.find(output => output.productId === parentProductNode.productData.id);
                    if (output) {
                        const unitsPerSR = parseFloat(output.unitsPerSR || '0');
                        processNode.totalRuns = parentProductNode.amount / unitsPerSR;
                        processNode.totalDuration = processNode.totalRuns * parseFloat(processNode.processData.bAdalianHoursPerAction || '0');
                    }

                    // Now, correctly process the children of the process node, which are ProductNodes
                    if (processNode.children) {
                        processNode.children.forEach(child => updateNodeValues(child, processNode));
                    }
                }
            }
        };

        // Start the update from the root node
        updateNodeValues(rootNode);
    };

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
                {/* Production Inputs */}
                <ProductionInputs treeData={treeData} />
            </div>

            <div ref={d3RenderContainer} className="h-full w-full bg-lunarGreen-950 relative">
                <svg className="w-full h-full"></svg>

                {/* Render Product and Process Nodes */}
                {treeData && d3.hierarchy(treeData).descendants().map((node: HierarchyNode<D3TreeNode>) => {
                    const isProductNode = node.data.nodeType === 'product';
                    const Component = isProductNode ? ProductNodeComponent : ProcessNodeComponent;

                    return (
                        <div
                            key={node.data.id}
                            id={`component-${node.data.id}`}
                            style={{ position: 'absolute', transform: 'translate(0px, 0px)', zIndex: 1000 }}
                        >
                            {isProductNode ? (
                                <ProductNodeComponent
                                    nodeData={node.data as ProductNode}
                                    onSelectProcess={(processId) => {
                                        const productNode = node.data as ProductNode;
                                        buildProcessNodeCallback(processId, productNode, productNode.id).catch(err => {
                                            console.error('Error processing node:', err);
                                        });
                                    }}
                                />
                            ) : (
                                <ProcessNodeComponent
                                    nodeData={node.data as ProcessNode}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TreeRenderer;

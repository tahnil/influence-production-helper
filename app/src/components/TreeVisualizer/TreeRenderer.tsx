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
// — useRootNodeBuilder: Builds the root node of the tree based on the selected product.
// — useProductNodeBuilder: Builds product nodes including their details and associated processes.
// — useProcessNodeBuilder: Builds process nodes including the required input products.
// 3. D3 Utilities
// — renderD3Tree: Renders the initial D3 tree.
// — injectForeignObjects: Adds interactive elements (foreign objects) to D3 nodes, such as process selection dropdowns.
// — clearD3Tree: Clears the existing D3 tree.
// 
// ########################
// Detailed Explanation of Each Component and Function
// ########################
// 
// — State Management: Uses useState to manage the selected product ID and tree data.
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
import useRootNodeBuilder from './useRootNodeBuilder';
import useProductNodeBuilder from './useProductNodeBuilder';
import useProcessNodeBuilder from './useProcessNodeBuilder';
import { initializeD3Tree, updateD3Tree, injectForeignObjects } from '@/utils/d3Tree';
import { D3TreeNode } from '@/types/d3Types';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';

const TreeRenderer: React.FC = () => {
    // State to keep track of the selected product ID and tree data
    const [selectedProductId, setSelectedProduct] = useState<string | null>(null);
    const [treeData, setTreeData] = useState<D3TreeNode | null>(null);
    const [transform, setTransform] = useState<d3.ZoomTransform | null>(null);

    // Refs for D3 container, root node, and update function
    const d3RenderContainer = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<d3.HierarchyPointNode<D3TreeNode> | null>(null);
    const updateRef = useRef<(source: d3.HierarchyPointNode<D3TreeNode> | null) => void>(() => {});

    // Fetching influence products using a custom hook
    const { influenceProducts, loading, error } = useInfluenceProducts();
    const { processes, getProcesses } = useProcessesByProductId();
    const { buildProcessNode } = useProcessNodeBuilder();

    // Callback function to handle product selection
    const handleSelectProduct = useCallback((productId: string | null) => {
        // console.log('[TreeRenderer] Product selected:', productId);
        setSelectedProduct(productId);
        if (productId) {
            getProcesses(productId);
        }
    }, [getProcesses]);

    // Custom hook to build the product node based on selected product ID
    // console.log('[TreeRenderer] Right before useRootNodeBuilder.');
    const { rootNode } = useRootNodeBuilder({ selectedProductId, influenceProducts, processes });
    // console.log('[TreeRenderer] Right after useRootNodeBuilder, Root Node:', rootNode);

    // Effect to render D3 tree when productNode is ready
    useEffect(() => {
        if (rootNode && d3RenderContainer.current) {
            initializeD3Tree(d3RenderContainer.current, rootNode, rootRef, updateRef, setTransform, transform);
            setTreeData(rootNode);
        }
    }, [rootNode]);

    // UseEffect hook to re-render the D3 tree whenever treeData changes
    useEffect(() => {
        if (treeData && d3RenderContainer.current) {
            updateD3Tree(d3RenderContainer.current, treeData, rootRef, updateRef, setTransform, transform);
            injectForeignObjects(d3RenderContainer.current, rootRef, buildProcessNodeCallback);
        }
    }, [treeData]);

    const { productNode } = useProductNodeBuilder({ selectedProductId });

    useEffect(() => {
        if (productNode && d3RenderContainer.current) {
            console.log('[TreeRenderer] something happened');
            injectForeignObjects(d3RenderContainer.current, rootRef, buildProcessNodeCallback);
        }
    }, [productNode]);

    const buildProcessNodeCallback = useCallback(async (selectedProcessId: string | null, parentNode: D3TreeNode) => {
        try {
            const newProcessNode = await buildProcessNode(selectedProcessId);
            // console.log('[TreeRenderer] New Process Node:', newProcessNode);
            if (!newProcessNode) {
                throw new Error('Failed to build process node');
            }

            // Find the parent node in the current tree data
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
                console.log('[TreeRenderer] Updated tree data:', updatedTreeData);
                return updatedTreeData;
            });
        } catch (err) {
            console.error('[TreeRenderer] Failed to build process node:', err);
        }
    }, [buildProcessNode]);

    if (loading) return <div>Loading products...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="tree-renderer" style={{ width: '100vw', height: '100vh', overflow: 'auto' }}>
            <ProductSelector
                products={influenceProducts}
                selectedProductId={selectedProductId}
                onSelect={handleSelectProduct}
            />
            {(!loading && !error) && (
                <div className="d3-render-area" ref={d3RenderContainer} style={{ width: '100%', height: '100%' }} />
            )}
        </div>
    );
};

export default TreeRenderer;
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
import { renderD3Tree, injectForeignObjects, clearD3Tree } from '@/utils/d3Tree';
import { D3TreeNode } from '@/types/d3Types';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';

const TreeRenderer: React.FC = () => {
    // State to keep track of the selected product ID and tree data
    const [selectedProductId, setSelectedProduct] = useState<string | null>(null);
    const [treeData, setTreeData] = useState<D3TreeNode | null>(null);

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
            console.log('[TreeRenderer] Initializing D3 Tree with Root Node:', rootNode);
            clearD3Tree(d3RenderContainer.current); // Clear existing tree
            renderD3Tree(d3RenderContainer.current, rootNode, rootRef, updateRef);
            setTreeData(rootNode); // Initialize treeData with the root node
        }
    }, [rootNode]);

    const { productNode, productLoading, productError, processesLoading, processesError } = useProductNodeBuilder({ selectedProductId });

    // Effect to inject foreign objects after D3 tree is rendered
    useEffect(() => {
        if (productNode && d3RenderContainer.current) {
            // console.log('[TreeRenderer] Injecting Foreign Objects:', productNode);
            // console.log('[TreeRenderer] setTreeData:', setTreeData);
            injectForeignObjects(d3RenderContainer.current, rootRef, setTreeData, buildProcessNode);
        }
    }, [productNode, buildProcessNode]);

    // console.log('[TreeRenderer] Render:', { loading, productLoading, processesLoading, error, productError, processesError });
    // console.log('[TreeRenderer] Selected Product ID:', selectedProductId);
    // console.log('[TreeRenderer] Influence Products:', influenceProducts);

    if (loading) return <div>Loading products...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="tree-renderer">
            <ProductSelector
                products={influenceProducts}
                selectedProductId={selectedProductId}
                onSelect={handleSelectProduct}
            />
            {(!loading && !error) && (
            <div className="d3-render-area">
                <div ref={d3RenderContainer} />
            </div>
            )}
        </div>
    );
};

export default TreeRenderer;

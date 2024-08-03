// components/TreeRenderer.tsx

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

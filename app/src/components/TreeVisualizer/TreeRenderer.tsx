import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NodeContextProvider } from '@/contexts/NodeContext';
import { InfluenceProduct } from '@/types/influenceTypes';
import { ExtendedD3HierarchyNode, ProductNode } from '@/types/d3Types';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector'
import handleProcessSelection from '@/utils/handleProcessSelection';
import addNodeToTree from '@/utils/addNodeToTree';
import handleNodeClick from '@/utils/d3HandleNodeClick';
import { prepareTreeData } from '@/utils/prepareTreeData';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { createD3Tree } from '@/utils/d3CreateTree';
import { updateD3Tree } from '@/utils/d3UpdateTree';

const TreeRenderer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
    const updateRef = useRef<(source: ExtendedD3HierarchyNode | null) => void>(() => {});
    const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(null);
    const [treeData, setTreeData] = useState<ProductNode | null>(null);
    const { influenceProducts, loading, error } = useInfluenceProducts();
    const { processes, loading: processesLoading, error: processesError } = useProcessesByProductId(selectedProduct ? selectedProduct.id : '');

    // Fetch processes when a product is selected
    useEffect(() => {
        if (selectedProduct) {
            console.log(`Fetching processes for product ${selectedProduct.name}`);
            const newNode: ProductNode = {
                uniqueNodeId: generateUniqueId(),
                id: selectedProduct.id,
                name: selectedProduct.name,
                type: 'product',
                influenceProduct: selectedProduct,
                amount: 0, // Logic to set the desired amount by the user
                totalWeight: 0, // Calculate based on the amount and product data
                totalVolume: 0, // Calculate based on the amount and product data
                children: [],
                processes: []
            };
            setTreeData(newNode);
        }
    }, [selectedProduct]);

    // Create D3 tree when treeData changes
    useEffect(() => {
        if (containerRef.current && treeData) {
            const root = prepareTreeData(treeData);
            createD3Tree(containerRef, root, rootRef, update);
        }
    }, [treeData, processes]);

    const update = useCallback((source: ExtendedD3HierarchyNode | null): void => {
        if (source) {
            updateD3Tree(
                source,
                containerRef,
                rootRef,
                { top: 20, right: 90, bottom: 30, left: 90 },
                update,
                handleNodeClick(updateRef),
                processes
            );
        }
    }, [processes]);

    // Set the update function reference
    useEffect(() => {
        updateRef.current = update;
    }, [update]);

    const contextValue = {
        handleProcessSelection: async (processId: string, parentId: string, source: ExtendedD3HierarchyNode) => {
            const newNode = await handleProcessSelection(processId, parentId, processes);
            if (newNode && treeData) {
                const updatedTreeData = addNodeToTree(treeData, newNode, parentId);
                if (updatedTreeData.type === 'product') {
                    setTreeData(updatedTreeData);
                    if (updateRef.current && source) {
                        updateRef.current(source);
                    }
                } else {
                    console.error("Unexpected node type at the root of the tree");
                }
            }
        }
    };

    // Render loading and error states
    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    // Render the product selector and D3 tree container
    return (
        <NodeContextProvider value={contextValue}>
            <ProductSelector products={influenceProducts} onSelect={setSelectedProduct} />
            <div ref={containerRef}></div>
        </NodeContextProvider>
    );
};

export default TreeRenderer;

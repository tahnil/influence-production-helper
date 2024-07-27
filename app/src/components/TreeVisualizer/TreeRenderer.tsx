import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNodeContext, NodeContextProvider } from '@/contexts/NodeContext';
import { InfluenceProduct } from '@/types/influenceTypes';
import { ExtendedD3HierarchyNode, ProductNode } from '@/types/d3Types';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
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
    const [treeData, setTreeData] = useState<ProductNode | null>(null);
    const { influenceProducts, loading, error } = useInfluenceProducts();
  const { processes, setSelectedProduct, processesLoading, processesError, selectedProduct } = useNodeContext();

    // Fetch processes and set treeData when a product is selected
    useEffect(() => {
        console.log("[TreeRenderer] useEffect triggered by state change of 'selectedProduct' or 'processes'.");
        console.log("[TreeRenderer] selectedProduct:", selectedProduct);
        console.log("[TreeRenderer] processes:", processes);
        const fetchAndSetTreeData = async () => {
            if (selectedProduct) {
                console.log("[TreeRenderer] function 'fetchAndSetTreeData' triggered.");
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
                    processes: processes
                };
                setTreeData(newNode);
            }
        };

        fetchAndSetTreeData();
    }, [selectedProduct, processes]);

    // Create D3 tree when treeData changes
    useEffect(() => {
        if (containerRef.current && treeData) {
            console.log("[TreeRenderer] Creating D3 tree with treeData:", treeData);
            const root = prepareTreeData(treeData);
            createD3Tree(containerRef, root, rootRef, update);
        }
    }, [treeData]);

    const update = useCallback((source: ExtendedD3HierarchyNode | null): void => {
        if (source) {
            updateD3Tree(
                source,
                containerRef,
                rootRef,
                { top: 20, right: 90, bottom: 30, left: 90 },
                update,
                handleNodeClick(updateRef)
            );
        }
    }, []);

    // Set the update function reference
    useEffect(() => {
        updateRef.current = update;
    }, [update]);

    const contextValue = {
        handleProcessSelection: async (processId: string, parentId: string, source: ExtendedD3HierarchyNode) => {
            const newNode = await handleProcessSelection(processId, parentId, { [selectedProduct?.id || '']: processes });
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
    if (loading || processesLoading) {
        return <div>Loading...</div>;
    }

    if (error || processesError) {
        return <div>Error: {error || processesError}</div>;
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

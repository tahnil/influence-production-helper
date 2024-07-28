// components/TreeVisualizer/TreeRenderer.tsx

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNodeContext } from '@/contexts/NodeContext';
import { ProductNode, ExtendedD3HierarchyNode, D3TreeNode } from '@/types/d3Types';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { globalState } from '@/globalState';
import { unifiedD3Tree } from '@/utils/d3Tree';
import handleProcessSelection from '@/utils/handleProcessSelection';
import { HandleProcessSelectionContext } from '@/contexts/NodeContext';
import ErrorBoundary from '@/components/ErrorBoundary';

const TreeRenderer: React.FC = () => {
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
    const updateRef = useRef<(source: ExtendedD3HierarchyNode | null) => void>(() => { });
    const [treeData, setTreeData] = useState<ProductNode | null>(null);
    const { influenceProducts, loading, error } = useInfluenceProducts();
    const { setSelectedProduct, selectedProduct, processes } = useNodeContext();

    // Function to handle process selection and update the tree structure
    const handleProcessSelectionCallback = useCallback(async (processId: string, node: ProductNode) => {
        const newProcessNode = await handleProcessSelection(processId, node, { [selectedProduct?.id || '']: processes });
        if (newProcessNode) {
            node.children = [newProcessNode];
        setTreeData({ ...treeData }); // Trigger a re-render
        }
    }, [processes, selectedProduct, treeData]);

    // Fetch processes and set treeData when a product is selected
    useEffect(() => {
        console.log("[TreeRenderer] useEffect triggered by state change of 'selectedProduct' or 'processes'.");
        console.log("[TreeRenderer] selectedProduct:", selectedProduct);
        console.log("[TreeRenderer] processes:", processes);

        // Define the async function within the useEffect to ensure it is invoked
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
                };
                console.log("[TreeRenderer] newNode:", newNode);
                setTreeData(newNode);
                globalState.updateProcesses(processes);  // Ensure that the processes are updated in global state
            }
        };

        // Invoke the function
        fetchAndSetTreeData();
    }, [selectedProduct, processes]);

    useEffect(() => {
        const containerRef = document.getElementById('d3-container');
        if (containerRef && treeData) {
            console.log("[TreeRenderer] Creating or updating D3 tree with treeData:", treeData);
            unifiedD3Tree(containerRef, rootRef, treeData, updateRef, setTreeData);
        }
    }, [treeData]);

    const update = useCallback((source: ExtendedD3HierarchyNode | null): void => {
        const containerRef = document.getElementById('d3-container');
        if (containerRef && source) {
            unifiedD3Tree(containerRef, rootRef, source.data as ProductNode, updateRef, setTreeData);
        }
    }, []);

    // Set the update function reference
    useEffect(() => {
        updateRef.current = update;
    }, [update]);

    const contextValue = useMemo(() => ({
        selectedProduct,
        setSelectedProduct,
        processes,
        processesLoading: false,
        processesError: null,
        handleProcessSelection: handleProcessSelectionCallback
    }), [selectedProduct, processes, handleProcessSelectionCallback]);

    // Render the product selector and D3 tree container
    return (
        <ErrorBoundary>
        <HandleProcessSelectionContext.Provider value={contextValue}>
            <ProductSelector products={influenceProducts} onSelect={setSelectedProduct} />
        </HandleProcessSelectionContext.Provider>
        </ErrorBoundary>
    );
};

export default TreeRenderer;

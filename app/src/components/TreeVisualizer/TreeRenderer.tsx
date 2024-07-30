// components/TreeVisualizer/TreeRenderer.tsx

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ProductNode, ExtendedD3HierarchyNode, D3TreeNode } from '@/types/d3Types';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { globalState } from '@/globalState';
import { unifiedD3Tree } from '@/utils/d3Tree';
import handleProcessSelection from '@/utils/handleProcessSelection';
import ErrorBoundary from '@/components/TreeVisualizer/ErrorBoundary';
import { useProcessData, useProcessId, useProductData } from '@/contexts/DataStore';
import { HandleProcessSelectionContext } from '@/contexts/NodeContext';

const TreeRenderer: React.FC = () => {
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
    const updateRef = useRef<(source: ExtendedD3HierarchyNode | null) => void>(() => { });
    const [treeData, setTreeData] = useState<ProductNode | null>(null);
    const { influenceProducts, loading, error } = useInfluenceProducts();
    const selectedProcessId = useProcessId();
    const { selectedProduct, setSelectedProduct } = useProductData();
    const { processes, setProcesses } = useProcessData();

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
        if (selectedProcessId && treeData) {
            const updateTreeData = async () => {
                const newProcessNode = await handleProcessSelection(treeData, { [selectedProduct?.id || '']: processes });
                if (newProcessNode) {
                    const newTreeData = { ...treeData, children: [newProcessNode] };
                    setTreeData(newTreeData);
                }
            };

            updateTreeData();
        }
    }, [selectedProcessId, treeData, selectedProduct, processes]);

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
    }), [selectedProduct, processes]);

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

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNodeContext } from '@/contexts/NodeContext';
import { ExtendedD3HierarchyNode, ProductNode } from '@/types/d3Types';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import handleProcessSelection from '@/utils/handleProcessSelection';
import addNodeToTree from '@/utils/addNodeToTree';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { globalState } from '@/globalState';
import { unifiedD3Tree } from '@/utils/d3Tree';

const TreeRenderer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
    const updateRef = useRef<(source: ExtendedD3HierarchyNode | null) => void>(() => { });
    const [treeData, setTreeData] = useState<ProductNode | null>(null);
    const { influenceProducts, loading, error } = useInfluenceProducts();
    const { setSelectedProduct, selectedProduct, processes } = useNodeContext();

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
    }, [selectedProduct]);

    // Create D3 tree when treeData changes
    useEffect(() => {
        if (containerRef.current && treeData) {
            console.log("[TreeRenderer] Creating D3 tree with treeData:", treeData);
            unifiedD3Tree(containerRef, rootRef, treeData, updateRef);
        }
    }, [treeData]);

    const contextValue = useMemo(() => ({
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
  }), [selectedProduct, processes, treeData]);

    // Render the product selector and D3 tree container
    return (
        <>
            <ProductSelector products={influenceProducts} onSelect={setSelectedProduct} />
            <div ref={containerRef}></div>
        </>
    );
};

export default TreeRenderer;

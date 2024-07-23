// components/TreeVisualizer/TreeVisualizer.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { InfluenceProduct, InfluenceProcess } from '@/types/influenceTypes';
import { ExtendedD3HierarchyNode, D3TreeNode, ProductNode, ProcessNode } from '@/types/d3Types';
import { createD3Tree, updateD3Tree, collapse } from '@/utils/d3TreeUtils';
import ProductSelector from './ProductSelector';
import { ProcessInput } from '@/types/influenceTypes';

const TreeVisualizer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const updateRef = useRef<(source: ExtendedD3HierarchyNode | null) => void>(() => { }); // Initialize with a placeholder function
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
    const iRef = useRef(0);

    const [treeData, setTreeData] = useState<ProductNode | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(null);
    const [productList, setProductList] = useState<InfluenceProduct[]>([]);
    const [processList, setProcessList] = useState<{ [key: string]: InfluenceProcess[] }>({});

    useEffect(() => {
        // Fetch the list of products on initial load
        fetch('/api/products')
            .then(response => response.json())
            .then(data => setProductList(data))
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            handleProductSelection(selectedProduct);
        }
    }, [selectedProduct]);

    const handleProductSelection = async (product: InfluenceProduct) => {
        console.log(`Selected product: ${product.name}`);
        const response = await fetch(`/api/processes?outputProductId=${product.id}`);
        const processes = await response.json();
        console.log(`Fetched processes for ${product.name}:`, processes);
        setProcessList(prev => ({ ...prev, [product.id]: processes }));

        const newNode: ProductNode = {
            name: product.name,
            type: 'product',
            influenceProduct: product,
            amount: 0, // we still need logic to poll the desired amount by the user
            totalWeight: 0, // calculate function missing based on the amount and product data
            totalVolume: 0, // calculate function missing based on the amount and product data
            children: []
        };

        setTreeData(newNode);
    };

    const handleProcessSelection = async (processId: string, parentId: string) => {
        console.log(`Selected process ID: ${processId} for parent product ID: ${parentId}`);

        const response = await fetch(`/api/inputs?processId=${processId}`);
        const inputs: ProcessInput[] = await response.json(); // Use the ProcessInput type here

        const selectedProcess = processList[parentId]?.find(p => p.id === processId);

        // Check if selectedProcess is defined
        if (!selectedProcess) {
            console.error('Selected process is undefined.');
            return; // Optionally, handle this case more gracefully in your UI
        }

        const newNode: ProcessNode = {
            name: selectedProcess.name,
            type: 'process',
            influenceProcess: selectedProcess,
            totalDuration: 0, // calculate function missing based on process data
            totalRuns: 0, // calculate function missing based on process data
            children: inputs.map((input: ProcessInput) => ({
                name: input.product.name,
                type: 'product',
                influenceProduct: input.product,
                amount: parseFloat(input.unitsPerSR),
                totalWeight: 0,
                totalVolume: 0,
                children: []
            }))
        };

        const addNodeToTree = (node: D3TreeNode, newNode: ProcessNode | ProductNode): D3TreeNode => {
            if (node.type === 'product' && newNode.type === 'process') {
                // Assure TypeScript that children are ProcessNode[] if they exist
                const updatedChildren: ProcessNode[] = node.children ? [...node.children, newNode as ProcessNode] : [newNode as ProcessNode];
                return { ...node, children: updatedChildren };
            } else if (node.type === 'process' && newNode.type === 'product') {
                // Assure TypeScript that children are ProductNode[] if they exist
                const updatedChildren: ProductNode[] = node.children ? [...node.children, newNode as ProductNode] : [newNode as ProductNode];
                return { ...node, children: updatedChildren };
            } else if ((node.type === 'product' || node.type === 'process') && node.children) {
                // Handle recursive updates correctly
                const updatedChildren = node.children.map(child => addNodeToTree(child, newNode));
                if (node.type === 'product') {
                    return { ...node, children: updatedChildren as ProcessNode[] };
                } else if (node.type === 'process') {
                    return { ...node, children: updatedChildren as ProductNode[] };
                }
            }
            return node; // Return unchanged if SideProductNode or if conditions do not match
        };

        // Update the treeData with the new node
        if (treeData) {
            const updatedTreeData = addNodeToTree(treeData, newNode);
            console.log("Updated Tree Data:", updatedTreeData); // Log the updated tree data

            // Check if the updatedTreeData is still a ProductNode
            if (updatedTreeData.type === 'product') {
                setTreeData(updatedTreeData);
                if (updateRef.current && rootRef.current) {
                    updateRef.current(rootRef.current);
                }
            } else {
                console.error("Unexpected node type at the root of the tree");
                // Handle this error appropriately, perhaps by not updating the state or resetting some parts
            }
        }
    };

    useEffect(() => {
        console.log('Updated processList:', processList);
    }, [processList]);

    const click = useCallback((event: React.MouseEvent, d: ExtendedD3HierarchyNode): void => {
        if (d.children) {
            d._children = d.children;
            d.children = undefined;
        } else {
            d.children = d._children;
            d._children = undefined;
        }
        updateRef.current?.(d);
    }, []);

    const update = useCallback((source: ExtendedD3HierarchyNode | null): void => {
        if (source) {
            updateD3Tree(source, containerRef, rootRef, 
                { top: 20, right: 90, bottom: 30, left: 90 },
                updateRef, update, click, 
                handleProcessSelection, processList);
        }
    }, [click, handleProcessSelection, processList]);    

    updateRef.current = update;

    useEffect(() => {
        if (treeData) {
            createD3Tree(containerRef, treeData, rootRef, iRef, update, click, handleProcessSelection, processList);
        }
    }, [treeData, update, click, handleProcessSelection, processList]);

    return (
        <div>
            <ProductSelector products={productList} onSelect={setSelectedProduct} />
            <div id="tree-container" ref={containerRef}></div>
        </div>
    );
};

export default TreeVisualizer;

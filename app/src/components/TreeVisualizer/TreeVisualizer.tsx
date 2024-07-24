// components/TreeVisualizer/TreeVisualizer.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { InfluenceProduct, InfluenceProcess } from '@/types/influenceTypes';
import { ExtendedD3HierarchyNode, D3TreeNode, ProductNode, ProcessNode } from '@/types/d3Types';
import { createD3Tree, updateD3Tree } from '@/utils/d3TreeUtils';
import ProductSelector from './ProductSelector';
import { ProcessInput } from '@/types/influenceTypes';
import { generateUniqueId } from '@/utils/generateUniqueId';

const TreeVisualizer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const updateRef = useRef<(source: ExtendedD3HierarchyNode | null) => void>(() => { }); // Initialize with a placeholder function
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
    const iRef = useRef(0);

    const [treeData, setTreeData] = useState<ProductNode | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(null);
    const [productList, setProductList] = useState<InfluenceProduct[]>([]);
    const [processList, setProcessList] = useState<{ [key: string]: InfluenceProcess[] }>({});

    // Fetch the list of products on initial load
    useEffect(() => {
        fetch('/api/products')
            .then(response => response.json())
            .then(data => setProductList(data))
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    // handleProductSelection
    useEffect(() => {
        if (selectedProduct) {
            handleProductSelection(selectedProduct);
        }
    }, [selectedProduct]);

    // fetch all processes that yield selected product
    const fetchProcessesForProduct = async (productId: string) => {
        try {
            // console.log(`Fetching processes for product ID: ${productId}`);
            const response = await fetch(`/api/processes?outputProductId=${productId}`);
            if (!response.ok) throw new Error('Failed to fetch processes');
            const processes = await response.json();
            setProcessList(prev => ({ ...prev, [productId]: processes }));
            // console.log(`Processes for product ID ${productId}:`, processes);
            return processes;
        } catch (error) {
            console.error(`Error fetching processes for product ${productId}:`, error);
        }
    };

    // handle the initial selection of a product, before the tree is rendered
    const handleProductSelection = async (product: InfluenceProduct) => {
        // console.log(`Selected product: ${product.name} with id: ${product.id}`);
        const processes = await fetchProcessesForProduct(product.id);
        // console.log(`Fetched processes for ${product.name}:`, processes);

        const newNode: ProductNode = {
            uniqueNodeId: generateUniqueId(),
            id: product.id,
            name: product.name,
            type: 'product',
            influenceProduct: product,
            amount: 0, // we still need logic to poll the desired amount by the user
            totalWeight: 0, // calculate function missing based on the amount and product data
            totalVolume: 0, // calculate function missing based on the amount and product data
            children: [],
            processes: processes
        };

        setTreeData(newNode);
    };

    // handle the selection of a process from a Product node
    const handleProcessSelection = async (processId: string, parentId: string, source: ExtendedD3HierarchyNode) => {
        // console.log(`Selected process ID: ${processId} for parent product ID: ${parentId}`);
        console.log(`[function 'handleProcessSelection' (TreeVisualizer.tsx)]\n#########\nSource node:`, source.data.id, `partent ID:`, parentId, `process ID:`, processId);

        const response = await fetch(`/api/inputs?processId=${processId}`);
        const inputs: ProcessInput[] = await response.json(); // Use the ProcessInput type here
        // console.log(`Fetched inputs for process ${processId}:`, inputs);

        const processesPromises = inputs.map(input => 
            fetchProcessesForProduct(input.product.id)  // Ensure processes are fetched and updated
        );

        const productsWithProcesses = await Promise.all(processesPromises);

        const inputNodes = inputs.map((input, index) => ({
            id: input.product.id,
            name: input.product.name,
            type: 'product',
            influenceProduct: input.product,
            amount: parseFloat(input.unitsPerSR),
            totalWeight: 0, // calculate function missing based on process data
            totalVolume: 0, // calculate function missing based on process data
            children: [],
            processes: productsWithProcesses[index] // Store processes for each new product
        }))

        const selectedProcess = processList[parentId]?.find(p => p.id === processId);
        // console.log(`Selected parent id:`, processList[parentId]);

        // Check if selectedProcess is defined
        if (!selectedProcess) {
            console.error('Selected process is undefined.');
            return; // Optionally, handle this case more gracefully in your UI
        }

        const newNode: ProcessNode = {
            uniqueNodeId: generateUniqueId(),
            id: selectedProcess.id,
            name: selectedProcess.name,
            type: 'process',
            influenceProcess: selectedProcess,
            totalDuration: 0, // calculate function missing based on process data
            totalRuns: 0, // calculate function missing based on process data
            children: inputNodes
        };

        const addNodeToTree = (node: D3TreeNode, newNode: ProcessNode | ProductNode, parentId: string): D3TreeNode => {
            if (node.type === 'product' && node.id === parentId) {
                if (newNode.type === 'process') {
                    // Initialize children if undefined
                    if (!node.children) {
                        node.children = [];
                    }
                    // Find index of any existing process node
                    const existingProcessIndex = node.children.findIndex(child => child.type === 'process');

                    if (existingProcessIndex !== -1) {
                        // Check if the same process is selected again
                        if (node.children[existingProcessIndex].id === newNode.id) {
                            console.log(`Process ${node.children[existingProcessIndex].id} / ${newNode.id} already selected, no action taken`);
                            return node; // No update if the same process is selected
                        } else {
                            // Replace the existing process node with the new one
                            console.log(`Replacing process ${node.children[existingProcessIndex].id} with new process ${newNode.id}`);
                            node.children[existingProcessIndex] = newNode as ProcessNode;
                            return { ...node }; // Using spread to trigger React re-render
                        }
                    } else {
                        // No existing process node, add the new one
                        console.log(`Adding new process ${newNode.id}`);
                        node.children.push(newNode as ProcessNode);
                        return { ...node }; // Using spread to trigger React re-render
                    }
                }
            } else if (node.children) {
                // Recursively update children nodes if no direct match
                node.children = node.children.map(child => addNodeToTree(child, newNode, parentId));
            }
            return node; // Return unchanged if conditions do not match
        };

        // Update the treeData with the new node
        if (treeData) {
            const updatedTreeData = addNodeToTree(treeData, newNode, parentId);
            console.log("Updated Tree Data:", updatedTreeData); // Log the updated tree data

            // Check if the updatedTreeData is still a ProductNode
            if (updatedTreeData.type === 'product') {
                setTreeData(updatedTreeData);
                if (updateRef.current && source) {
                    updateRef.current(source);
                }
            } else {
                console.error("Unexpected node type at the root of the tree");
                // Handle this error appropriately, perhaps by not updating the state or resetting some parts
            }
        }
    };

    // Handle processList changes
    useEffect(() => {
        // console.log('Updated processList:', processList);
    }, [processList]);

    // handle collapsing and expanding of nodes
    const click = useCallback((event: React.MouseEvent, d: ExtendedD3HierarchyNode): void => {
        if (d.children) {
            d._children = d.children;
            d.children = undefined;
        } else {
            d.children = d._children;
            d._children = undefined;
        }
        updateRef.current(d);
    }, []);

    // update function
    const update = useCallback((source: ExtendedD3HierarchyNode | null): void => {
        console.log('[function `update` via useCallback (TreeVisualizer.tsx)]\n#########\nUpdate function called...');
        if (source) {
            updateD3Tree(
                source, 
                containerRef, 
                rootRef,
                { top: 20, right: 90, bottom: 30, left: 90 },
                update, 
                click,
                handleProcessSelection, 
                processList
            );
        }
    }, [click, handleProcessSelection, processList]);

    useEffect(() => {
        updateRef.current = update;
    }, [update]);

    useEffect(() => {
        if (treeData) {
            const updateCallback = (source: ExtendedD3HierarchyNode) => {
                updateRef.current?.(source);
            };
            createD3Tree(containerRef, treeData, rootRef, updateCallback, click, handleProcessSelection, processList);
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

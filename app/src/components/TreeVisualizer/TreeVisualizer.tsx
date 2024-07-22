import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExtendedD3HierarchyNode, ProductNode, ProcessNode } from '@/types/d3Types';
import { createD3Tree, updateD3Tree } from '@/utils/d3TreeUtils';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector'; // New component to create
import ProcessSelector from '@/components/TreeVisualizer/ProcessSelector'; // New component to create
import { InfluenceProduct, InfluenceProcess } from '@/types/influenceTypes';

const TreeVisualizer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const updateRef = useRef<(source: ExtendedD3HierarchyNode) => void>(() => {}); // Initialize with a placeholder function
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
    const iRef = useRef(0);
    
    const [treeData, setTreeData] = useState<ProductNode | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(null);
    const [selectedProcess, setSelectedProcess] = useState<InfluenceProcess | null>(null);
    const [productList, setProductList] = useState<InfluenceProduct[]>([]);
    const [processList, setProcessList] = useState<InfluenceProcess[]>([]);

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

    useEffect(() => {
        if (selectedProcess) {
            handleProcessSelection(selectedProcess);
        }
    }, [selectedProcess]);

    const handleProductSelection = async (product: InfluenceProduct) => {
        const response = await fetch(`/api/processes?outputProductId=${product.id}`);
        const processes = await response.json();
        setProcessList(processes);

        const newNode: ProductNode = {
            name: product.name,
            type: 'product',
            influenceProduct: product,
            amount: 0,
            totalWeight: 0,
            totalVolume: 0,
            children: []
        };
        
        setTreeData(newNode);
    };

    const handleProcessSelection = async (process: InfluenceProcess) => {
        const response = await fetch(`/api/inputs?processId=${process.id}`);
        const inputs = await response.json();

        const newNode: ProcessNode = {
            name: process.name,
            type: 'process',
            influenceProcess: process,
            totalDuration: 0,
            totalRuns: 0,
            children: inputs.map((input: any) => ({
                name: input.product.name,
                type: 'product',
                influenceProduct: input.product,
                amount: parseFloat(input.unitsPerSR),
                totalWeight: 0,
                totalVolume: 0,
                children: []
            }))
        };

        if (treeData && treeData.type === 'product') {
            const updatedTreeData: ProductNode = {
                ...treeData,
                children: [newNode]
            };
            setTreeData(updatedTreeData);
        }
    };

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

    const update = useCallback((source: ExtendedD3HierarchyNode): void => {
        updateD3Tree(source, containerRef, rootRef, { top: 20, right: 90, bottom: 30, left: 90 }, updateRef, click);
    }, [click]);

    updateRef.current = update;

    useEffect(() => {
        if (treeData) {
            createD3Tree(containerRef, treeData, rootRef, iRef, update, click);
        }
    }, [treeData, update, click]);

    return (
        <div>
            <ProductSelector products={productList} onSelect={setSelectedProduct} />
            {selectedProduct && <ProcessSelector processes={processList} onSelect={setSelectedProcess} />}
            <div id="tree-container" ref={containerRef}></div>
        </div>
    );
};

export default TreeVisualizer;

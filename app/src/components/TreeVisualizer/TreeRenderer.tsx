// components/TreeVisualizer/TreeRenderer.tsx
// 
import React, { useState, useCallback } from 'react';
import { D3TreeNode, ProcessNode, ProductNode } from '@/types/d3Types';
import AmountInput from '@/components/TreeVisualizer/AmountInput';
import ProductionInputs from '@/components/TreeVisualizer/ProductionInputs';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import { Tree, hierarchy } from '@visx/hierarchy';
import { Group } from '@visx/group';
import { LinkHorizontal } from '@visx/shape';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import { fetchProductImageBase64 } from '@/utils/TreeVisualizer/fetchProductImageBase64';
import { buildProductNode } from '@/utils/TreeVisualizer/buildProductNode';
import useProcessNodeBuilder from '@/utils/TreeVisualizer/useProcessNodeBuilder';
import ProductNodeComponent from './ProductNodeComponent';
import ProcessNodeComponent from './ProcessNodeComponent';

const TreeRenderer: React.FC = () => {
    const [selectedProductId, setSelectedProduct] = useState<string | null>(null);
    const [rootNode, setRootNode] = useState<D3TreeNode | null>(null);
    const [treeData, setTreeData] = useState<D3TreeNode | null>(null);
    const [desiredAmount, setDesiredAmount] = useState<number>(1);

    const { influenceProducts, loading, error } = useInfluenceProducts();
    const { processesByProductId, getProcessesByProductId } = useProcessesByProductId();
    const { buildProcessNode } = useProcessNodeBuilder();

    const handleSelectProduct = useCallback(async (productId: string | null) => {
        setSelectedProduct(productId);
        if (productId) {
            const processes = await getProcessesByProductId(productId);
            const selectedProduct = influenceProducts.find(product => product.id === productId);

            if (selectedProduct) {
                const base64Image = await fetchProductImageBase64(productId);
                const newRootNode = buildProductNode(selectedProduct, processes, desiredAmount, base64Image);
                setRootNode(newRootNode);
                setTreeData(newRootNode);
            }
        }
    }, [influenceProducts, desiredAmount, getProcessesByProductId]);

    const handleAmountChange = (newDesiredAmount: number) => {
        setDesiredAmount(newDesiredAmount);
        if (treeData && rootNode) {
            const updatedTreeData = JSON.parse(JSON.stringify(treeData)); // Deep clone to ensure immutability
            recalculateTreeValues(updatedTreeData as ProductNode, newDesiredAmount);
            setTreeData(updatedTreeData);
        }
    };

    const buildProcessNodeCallback = useCallback(async (selectedProcessId: string | null, parentNode: D3TreeNode, parentId: string | null) => {
        if (!selectedProcessId || parentNode.nodeType !== 'product') return;
        try {
            const parentProductNode = parentNode as ProductNode;
            const newProcessNode = await buildProcessNode(selectedProcessId, parentProductNode.amount, parentProductNode.productData.id);

            if (!newProcessNode) throw new Error('Failed to build process node');

            // Update the tree with the new process node
            const updateTreeData = (node: D3TreeNode): D3TreeNode => {
                if (node.id === parentNode.id) {
                    const productNode = node as ProductNode;
                    const existingProcessIndex = productNode.children.findIndex(child => child.nodeType === 'process');
                    if (existingProcessIndex !== -1) {
                        // Replace the existing process node
                        const updatedChildren = [...productNode.children];
                        updatedChildren[existingProcessIndex] = newProcessNode;
                        return { ...productNode, children: updatedChildren };
                    } else {
                        return { ...productNode, children: [...productNode.children, newProcessNode] };
                    }
                } else if (node.children) {
                    return { ...node, children: node.children.map(updateTreeData) };
                }
                return node;
            };

            setTreeData(prevTreeData => {
                const updatedTreeData = prevTreeData ? updateTreeData(prevTreeData) : null;
                return updatedTreeData;
            });
        } catch (err) {
            console.error('[TreeRenderer] Failed to build process node:', err);
        }
    }, [buildProcessNode]);

    const recalculateTreeValues = (rootNode: ProductNode, desiredAmount: number) => {
        const updateNodeValues = (node: ProductNode | ProcessNode, parentNode?: ProductNode | ProcessNode) => {
            if (node.nodeType === 'product') {
                const productNode = node as ProductNode;

                if (!parentNode) {
                    productNode.amount = desiredAmount;
                } else if (parentNode.nodeType === 'process') {
                    const processNode = parentNode as ProcessNode;
                    const input = processNode.processData.inputs.find(input => input.productId === productNode.productData.id);
                    if (input) {
                        const unitsPerSR = parseFloat(input.unitsPerSR || '0');
                        productNode.amount = processNode.totalRuns * unitsPerSR;
                    }
                }

                productNode.totalWeight = productNode.amount * parseFloat(productNode.productData.massKilogramsPerUnit || '0');
                productNode.totalVolume = productNode.amount * parseFloat(productNode.productData.volumeLitersPerUnit || '0');

                if (productNode.children) {
                    productNode.children.forEach(child => updateNodeValues(child, productNode));
                }
            } else if (node.nodeType === 'process') {
                const processNode = node as ProcessNode;
                if (parentNode && parentNode.nodeType === 'product') {
                    const parentProductNode = parentNode as ProductNode;
                    const output = processNode.processData.outputs.find(output => output.productId === parentProductNode.productData.id);
                    if (output) {
                        const unitsPerSR = parseFloat(output.unitsPerSR || '0');
                        processNode.totalRuns = parentProductNode.amount / unitsPerSR;
                        processNode.totalDuration = processNode.totalRuns * parseFloat(processNode.processData.bAdalianHoursPerAction || '0');
                    }

                    if (processNode.children) {
                        processNode.children.forEach(child => updateNodeValues(child, processNode));
                    }
                }
            }
        };

        updateNodeValues(rootNode);
    };

    if (loading) return <div>Loading products...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="w-full h-full relative">
            <div className="absolute bottom-4 right-4 bg-background p-4 shadow-lg rounded-lg z-10 max-h-[90vh] overflow-y-auto w-[35ch]">
                <h2 className="text-xl font-semibold mb-4">Controls</h2>
                <ProductSelector
                    products={influenceProducts}
                    selectedProductId={selectedProductId}
                    onSelect={handleSelectProduct}
                    className="p-2 border rounded border-gray-300 mb-4 w-full"
                />
                <AmountInput
                    desiredAmount={desiredAmount}
                    onChange={handleAmountChange}
                    label="Desired Amount"
                    className="p-2 border rounded border-gray-300 mb-4 w-full"
                />
                <ProductionInputs treeData={treeData} />
            </div>

            <div className="h-full w-full bg-lunarGreen-950 relative">
                {treeData && (
                    <svg width="100%" height="100%">
                        <Tree
                            root={hierarchy(treeData)}
                            size={[1000, 600]}
                            separation={(a, b) => (a.parent === b.parent ? 1 : 1.5) / a.depth}
                        >
                            {(tree) => (
                                <Group>
                                    {tree.links().map((link, i) => (
                                        <LinkHorizontal
                                            key={`link-${i}`}
                                            data={link}
                                            stroke="gray"
                                            strokeWidth="1"
                                            fill="none"
                                        />
                                    ))}

                                    {tree.descendants().map((node, i) => {
                                        const isProductNode = node.data.nodeType === 'product';
                                        const Component = isProductNode ? ProductNodeComponent : ProcessNodeComponent;

                                        return (
                                            <Group key={`node-${i}`} top={node.y} left={node.x}>
                                                <Component
                                                    nodeData={node.data as ProductNode | ProcessNode}
                                                    onSelectProcess={isProductNode ? buildProcessNodeCallback : undefined}
                                                />
                                            </Group>
                                        );
                                    })}
                                </Group>
                            )}
                        </Tree>
                    </svg>
                )}
            </div>
        </div>
    );
};

export default TreeRenderer;

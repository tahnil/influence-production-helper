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
            setTreeData(updatedTreeData);
        }
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
                                                <rect
                                                    width={100}
                                                    height={40}
                                                    y={-20}
                                                    x={-50}
                                                    fill="#272b4d"
                                                    stroke="#03c0dc"
                                                    strokeWidth={1}
                                                    rx={10}
                                                />
                                                <text
                                                    dy=".33em"
                                                    fontSize={12}
                                                    fontFamily="Arial"
                                                    textAnchor="middle"
                                                    fill="white"
                                                >
                                                    {node.data.name}
                                                </text>
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

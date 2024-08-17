import React, { useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { D3TreeNode, ProductNode, ProcessNode } from '@/types/d3Types';

interface ProductionInputsProps {
    treeData: D3TreeNode | null;
}

const ProductionInputs: React.FC<ProductionInputsProps> = ({ treeData }) => {
    const [aggregatedInputs, setAggregatedInputs] = useState<{ [productId: string]: { name: string; amount: number } }>({});

    useEffect(() => {
        if (treeData) {
            const inputsMap: { [productId: string]: { name: string; amount: number } } = {};

            const aggregateInputs = (node: D3TreeNode) => {
                if (node.nodeType === 'product') {
                    const productNode = node as ProductNode;

                    // Aggregate this product node's amount if it is a leaf node or followed by a resource extraction process
                    const isLeafNode = !productNode.children || productNode.children.length === 0;
                    const hasOnlyResourceExtractionChild =
                        productNode.children &&
                        productNode.children.length === 1 &&
                        productNode.children[0].nodeType === 'process' &&
                        (productNode.children[0] as ProcessNode).children.length === 0;

                    if (isLeafNode || hasOnlyResourceExtractionChild) {
                        const existingProduct = inputsMap[productNode.productData.id];
                        if (existingProduct) {
                            existingProduct.amount += productNode.amount;
                        } else {
                            inputsMap[productNode.productData.id] = {
                                name: productNode.name,
                                amount: productNode.amount,
                            };
                        }
                    }

                    // Continue aggregation for child nodes
                    if (productNode.children) {
                        productNode.children.forEach(child => aggregateInputs(child));
                    }
                } else if (node.nodeType === 'process') {
                    const processNode = node as ProcessNode;

                    // If the process node has children, continue aggregation
                    if (processNode.children) {
                        processNode.children.forEach(child => aggregateInputs(child));
                    }
                }
            };

            aggregateInputs(treeData);

            setAggregatedInputs(inputsMap);
        }
    }, [treeData]);

    return (
        <div className="production-inputs">
            <h2 className="text-xl font-semibold mb-4">Required Inputs</h2>
            <ul>
                {Object.entries(aggregatedInputs).map(([productId, { name, amount }]) => (
                    <li key={productId}>
                        {name}:&nbsp;
                        <NumericFormat
                            value={amount}
                            displayType={'text'}
                            thousandSeparator={true}
                            decimalScale={2}
                            fixedDecimalScale={false}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProductionInputs;

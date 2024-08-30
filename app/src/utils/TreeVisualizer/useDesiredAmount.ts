// utils/TreeVisualizer/useDesiredAmount.ts

import { ProductNode, ProcessNode } from '@/types/reactFlowTypes';
import { Node } from '@xyflow/react';

export default function useDesiredAmount(nodes: Node[], desiredAmount: number): Node[] {
    // Utility function to update the values of the nodes
    const updateNodeValues = (node: Node, parentNode?: Node): Node => {
        if (node.type === 'productNode') {
            const productNode = node as ProductNode;

            if (!parentNode) {
                // This is the root node, set its amount based on the desired amount
                productNode.data.amount = desiredAmount;
            } else if (parentNode.type === 'processNode') {
                const processNode = parentNode as ProcessNode;
                const input = processNode.data.inputProducts.find(
                    input => input.product.id === productNode.data.productDetails.id
                );
                if (input) {
                    const unitsPerSR = parseFloat(input.unitsPerSR || '0');
                    productNode.data.amount = processNode.data.totalRuns * unitsPerSR;
                }
            }

            // Recalculate totalWeight and totalVolume
            productNode.data.totalWeight =
                productNode.data.amount * parseFloat(productNode.data.productDetails.massKilogramsPerUnit || '0');
            productNode.data.totalVolume =
                productNode.data.amount * parseFloat(productNode.data.productDetails.volumeLitersPerUnit || '0');
        } else if (node.type === 'processNode') {
            const processNode = node as ProcessNode;

            if (parentNode && parentNode.type === 'productNode') {
                const parentProductNode = parentNode as ProductNode;
                const output = processNode.data.processDetails.outputs.find(
                    output => output.productId === parentProductNode.data.productDetails.id
                );
                if (output) {
                    const unitsPerSR = parseFloat(output.unitsPerSR || '0');
                    processNode.data.totalRuns = parentProductNode.data.amount / unitsPerSR;
                    processNode.data.totalDuration =
                        processNode.data.totalRuns * parseFloat(processNode.data.processDetails.bAdalianHoursPerAction || '0');
                }
            }
        }

        return node;
    };

    // Iterate over the nodes and update their values
    const updatedNodes = nodes.map(node => {
        const parentNode = nodes.find(n => n.id === node.parentId);
        return updateNodeValues(node, parentNode);
    });

    return updatedNodes;
}

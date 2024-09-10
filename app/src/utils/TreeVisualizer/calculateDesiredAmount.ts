// utils/TreeVisualizer/calculateDesiredAmount.ts

import { Node } from '@xyflow/react';
import { ProductNode, ProcessNode } from '@/types/reactFlowTypes';

export default function calculateDesiredAmount(nodes: Node[], desiredAmount: number, rootNodeId: string): Node[] {
    console.log('calculateDesiredAmount called with desiredAmount: ', desiredAmount, ' and rootNodeId: ', rootNodeId);
    const updateProcessNode = (processNode: ProcessNode, parentNode: ProductNode): ProcessNode => {
        const output = processNode.data.processDetails.outputs.find(
            output => output.productId === parentNode.data.productDetails.id
        );

        if (output) {
            const outputUnitsPerSR = parseFloat(output.unitsPerSR || '0');
            processNode.data.totalRuns = parentNode.data.amount / outputUnitsPerSR;
            processNode.data.totalDuration =
                processNode.data.totalRuns * parseFloat(processNode.data.processDetails.bAdalianHoursPerAction || '0');
        }
        return processNode;
    };

    const updateProductNode = (productNode: ProductNode, parentNode: ProcessNode): ProductNode => {
        const input = parentNode.data.inputProducts.find(
            input => input.product.id === productNode.data.productDetails.id
        );

        if (input) {
            const unitsPerSR = parseFloat(input.unitsPerSR || '0');
            productNode.data.amount = parentNode.data.totalRuns * unitsPerSR;
            productNode.data.totalWeight =
                productNode.data.amount * parseFloat(productNode.data.productDetails.massKilogramsPerUnit || '0');
            productNode.data.totalVolume =
                productNode.data.amount * parseFloat(productNode.data.productDetails.volumeLitersPerUnit || '0');
        }
        return productNode;
    };

    const nodeMap = new Map(nodes.map(node => [node.id, { ...node }]));
    const updateNodeRecursively = (nodeId: string, parentNode?: Node): void => {
        const node = nodeMap.get(nodeId);
        if (!node) return;

        if (node.type === 'productNode') {
            const productNode = node as ProductNode;
            if (!parentNode) {
                // Root node scenario
                productNode.data.amount = desiredAmount;
                productNode.data.totalWeight =
                    desiredAmount * parseFloat(productNode.data.productDetails.massKilogramsPerUnit || '0');
                productNode.data.totalVolume =
                    desiredAmount * parseFloat(productNode.data.productDetails.volumeLitersPerUnit || '0');
            } else if (parentNode.type === 'processNode') {
                updateProductNode(productNode, parentNode as ProcessNode);
            }
        } else if (node.type === 'processNode') {
            if (parentNode && parentNode.type === 'productNode') {
                updateProcessNode(node as ProcessNode, parentNode as ProductNode);
            }
        }

        // Process child nodes
        nodes.forEach(childNode => {
            if (childNode.parentId === nodeId) {
                updateNodeRecursively(childNode.id, node);
            }
        });
    };

    // Start the recursive update from the root node
    updateNodeRecursively(rootNodeId);

    // Convert the updated node map back to an array, preserving the original order
    return nodes.map(node => nodeMap.get(node.id) || node);
}
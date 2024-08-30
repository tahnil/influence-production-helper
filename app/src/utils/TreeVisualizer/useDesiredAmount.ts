import { Node } from '@xyflow/react';
import { ProductNode, ProcessNode } from '@/types/reactFlowTypes';

export default function useDesiredAmount(nodes: Node[], desiredAmount: number): Node[] {
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

    const updateNodeRecursively = (node: Node, allNodes: Node[], parentNode?: Node): Node => {
        // Retain the existing position of the node
        let updatedNode = { ...node, position: node.position };

        if (node.type === 'productNode') {
            if (!parentNode) {
                updatedNode.data.amount = desiredAmount;
            } else if (parentNode.type === 'processNode') {
                updatedNode = updateProductNode(updatedNode as ProductNode, parentNode as ProcessNode);
            }
        } else if (node.type === 'processNode') {
            if (parentNode && parentNode.type === 'productNode') {
                updatedNode = updateProcessNode(updatedNode as ProcessNode, parentNode as ProductNode);
            }
        }

        const childNodes = allNodes.filter(n => n.parentId === node.id);
        childNodes.forEach(childNode => {
            updateNodeRecursively(childNode, allNodes, updatedNode);
        });

        return updatedNode;
    };

    const rootNode = nodes.find(n => n.id === 'root');
    if (!rootNode) return nodes;

    const updatedNodes = nodes.map(node => {
        if (node.id === rootNode.id) {
            return updateNodeRecursively(node, nodes);
        }
        return node;
    });

    return updatedNodes;
}

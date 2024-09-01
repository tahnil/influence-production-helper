// utils/TreeVisualizer/serializeSubFlow.ts

import { ProductNode as ProductNodeType } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNode as ProcessNodeType } from '@/components/TreeVisualizer/ProcessNode';
import { ProductScheme, ProductSchemeProcess, ProductSchemeProduct } from '@/types/schemeTypes';
import { generateUniqueId } from '../generateUniqueId';
import { Node } from '@xyflow/react';

function serializeSubFlow(
    focalProductId: string,
    nodes: Node[]
): ProductScheme {
    const productMap = new Map<string, ProductSchemeProduct>();
    const processMap = new Map<string, ProductSchemeProcess>();
    const visited = new Set<string>(); // Keep track of visited nodes

    const getNodeById = (id: string): Node | undefined => nodes.find(node => node.id === id);

    const traverseNode = (nodeId: string): ProductSchemeProduct | undefined => {
        if (visited.has(nodeId)) return undefined; // Avoid revisiting the same node
        visited.add(nodeId); // Mark the node as visited

        const node = getNodeById(nodeId);
        if (!node) return undefined;

        if (node.type === 'productNode') {
            const productNode = node as ProductNodeType;

            // Check if this product has already been processed
            if (productMap.has(productNode.id)) {
                return productMap.get(productNode.id);
            }

            const product: ProductSchemeProduct = {
                id: productNode.id,
                nodeData: productNode.data,
                producedBy: undefined,
                utilizedBy: undefined
            };

            // Find the process that produces this product
            const ancestorProcessNode = nodes.find(
                node => node.type === 'processNode' && node.parentId === productNode.id
            ) as ProcessNodeType;

            if (ancestorProcessNode) {
                const ancestorProcess = traverseProcessNode(ancestorProcessNode.id);
                product.producedBy = ancestorProcess;
            }

            productMap.set(productNode.id, product);
            return product;
        }
        return undefined;
    };

    const traverseProcessNode = (nodeId: string): ProductSchemeProcess | undefined => {
        if (visited.has(nodeId)) return undefined; // Avoid revisiting the same node
        visited.add(nodeId); // Mark the node as visited

        const node = getNodeById(nodeId);
        if (!node) return undefined;

        if (node.type === 'processNode') {
            const processNode = node as ProcessNodeType;

            // Check if this process has already been processed
            if (processMap.has(processNode.id)) {
                return processMap.get(processNode.id);
            }

            const process: ProductSchemeProcess = {
                id: processNode.id,
                nodeData: processNode.data,
                primaryOutputId: processNode.parentId, // The parentId in the node is the primary output
                inputs: [],
                outputs: [],
            };

            // Traverse and add input products for this process
            processNode.data.inputProducts.forEach(inputProduct => {
                const inputProductNode = traverseNode(inputProduct.product.id);
                if (inputProductNode) {
                    process.inputs?.push(inputProductNode);
                }
            });

            // Add the primary output product
            if (processNode.parentId) {
                const outputProductNode = traverseNode(processNode.parentId);
                if (outputProductNode) {
                    process.outputs?.push(outputProductNode);
                }
            }

            processMap.set(processNode.id, process);
            return process;
        }
        return undefined;
    };

    // Start the traversal from the focal product
    const focalProduct = traverseNode(focalProductId);

    if (!focalProduct) {
        throw new Error(`Focal product with ID ${focalProductId} not found.`);
    }

    return {
        id: generateUniqueId(), // Generate a unique ID for the scheme
        focalProductId: focalProductId,
        focalProduct: focalProduct,
        description: "Serialized Product Scheme" // Customize description as needed
    };
}

export default serializeSubFlow;

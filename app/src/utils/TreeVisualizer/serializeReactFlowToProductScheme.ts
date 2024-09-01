// utils/TreeVisualizer/serializeReactFlowToProductScheme.ts

import { ProductNode as ProductNodeType } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNode as ProcessNodeType } from '@/components/TreeVisualizer/ProcessNode';
import { ProductScheme, ProductSchemeProcess, ProductSchemeProduct } from '@/types/schemeTypes';
import { generateUniqueId } from '../generateUniqueId';
import { Node } from '@xyflow/react';

function serializeReactFlowToProductScheme(
    focalProductId: string,
    nodes: Node[]
): ProductScheme {
    const productMap = new Map<string, ProductSchemeProduct>();
    const processMap = new Map<string, ProductSchemeProcess>();
    const parentMap = new Map<string, string>(); // Maps node IDs to their parent IDs

    const getNodeById = (id: string): Node | undefined => nodes.find(node => node.id === id);

    const traverseNode = (nodeId: string) => {
        const node = getNodeById(nodeId);
        if (!node) return;

        if (node.type === 'productNode') {
            const productNode = node as ProductNodeType;
            const product: ProductSchemeProduct = {
                id: productNode.id,
                nodeData: productNode.data,
                producedBy: undefined,
                utilizedBy: undefined
            };

            // Recursively traverse parent process if it exists
            if (node.parentId) {
                const parentProcessNode = getNodeById(node.parentId);
                if (parentProcessNode && parentProcessNode.type === 'processNode') {
                    traverseNode(node.parentId);
                    product.producedBy = processMap.get(node.parentId);
                }
            }

            productMap.set(productNode.id, product);
        } else if (node.type === 'processNode') {
            const processNode = node as ProcessNodeType;
            const process: ProductSchemeProcess = {
                id: processNode.id,
                nodeData: processNode.data,
                primaryOutputId: processNode.parentId, // Use parentId as the primary output ID
                inputs: [],
                outputs: [],
            };

            // Recursively traverse input products
            if (processNode.data.inputProducts) {
                processNode.data.inputProducts.forEach(inputProduct => {
                    traverseNode(inputProduct.product.id);
                    process.inputs?.push(productMap.get(inputProduct.product.id)!);
                });
            }

            // Recursively traverse output products
            if (processNode.parentId) {
                traverseNode(processNode.parentId);
                process.outputs?.push(productMap.get(processNode.parentId)!);
            }

            processMap.set(processNode.id, process);
        }
    };

    // Start the traversal from the focal product
    traverseNode(focalProductId);

    // Step 3: Identify the focal product and construct the ProductScheme
    const focalProduct = productMap.get(focalProductId);
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

export default serializeReactFlowToProductScheme;

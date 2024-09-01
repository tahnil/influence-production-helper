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

    // Step 1: Traverse and serialize nodes
    nodes.forEach(node => {
        if (node.type === 'productNode') {
            const productNode = node as ProductNodeType;
            const product: ProductSchemeProduct = {
                id: productNode.id,
                nodeData: productNode.data,
                producedBy: undefined,
                utilizedBy: undefined
            };
            productMap.set(productNode.id, product);
        } else if (node.type === 'processNode') {
            const processNode = node as ProcessNodeType;
            const process: ProductSchemeProcess = {
                id: processNode.id,
                nodeData: processNode.data,
                primaryOutputId: processNode.parentId, // Use parentId as the primary output ID
                inputs: [],
                outputs: [],
                // isResourceExtraction: processNode.data.processDetails.isResourceExtraction
            };
            processMap.set(processNode.id, process);
        }

        // Track the parent-child relationship
        if (node.parentId) {
            parentMap.set(node.id, node.parentId);
        }
    });

    // Step 2: Establish hierarchical relationships
    parentMap.forEach((parentId, nodeId) => {
        if (productMap.has(parentId)) {
            const parentProduct = productMap.get(parentId)!;
            if (processMap.has(nodeId)) {
                const childProcess = processMap.get(nodeId)!;
                parentProduct.utilizedBy = childProcess;
                childProcess.inputs?.push(parentProduct);
            }
        } else if (processMap.has(parentId)) {
            const parentProcess = processMap.get(parentId)!;
            if (productMap.has(nodeId)) {
                const childProduct = productMap.get(nodeId)!;
                parentProcess.outputs?.push(childProduct);
                childProduct.producedBy = parentProcess;
            }
        }
    });

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

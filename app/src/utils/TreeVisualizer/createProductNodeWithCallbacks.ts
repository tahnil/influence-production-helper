// utils/TreeVisualizer/createProductNodeWithCallbacks.ts

import { Node } from '@xyflow/react';
import { ProductNodeData } from '@/types/reactFlowTypes';
import { PouchDBNodeDocument } from '@/types/pouchSchemes';

type CallbackFunction = (processId: string, nodeId: string) => void;

export const createProductNodeWithCallbacks = (
    doc: PouchDBNodeDocument,  // Adjusted to take the PouchDBNodeDocument type
    handleSelectProcess: CallbackFunction,
    handleSerialize: (focalProductId: string) => void
): Node<ProductNodeData> => {
    return {
        id: doc.id,
        type: doc.type,
        data: {
            ...doc.data,
            handleSelectProcess,
            handleSerialize,
            logicalParentId: doc.data.logicalParentId, // Ensure required property is provided
            amount: doc.data.amount || 0, // Ensure required property is provided
            totalWeight: doc.data.totalWeight || 0, // Ensure required property is provided
            totalVolume: doc.data.totalVolume || 0, // Ensure required property is provided
            image: doc.data.image || '', // Ensure required property is provided
            productDetails: doc.data.productDetails || {}, // Provide default or derived value
            processesByProductId: doc.data.processesByProductId || {}, // Provide default or derived value
            selectedProcessId: doc.data.selectedProcessId || null, // Provide default or derived value
            // Add more callbacks or custom properties as needed
        },
        position: doc.position || { x: 0, y: 0 }, // Use stored position or a default
    };
};

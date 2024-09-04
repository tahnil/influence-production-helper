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
            // Add more callbacks or custom properties as needed
        },
        position: doc.position || { x: 0, y: 0 }, // Use stored position or a default
        parentId: doc.parentId,
    };
};

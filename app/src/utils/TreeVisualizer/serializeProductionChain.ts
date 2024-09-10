// utils/TreeVisualizer/serializeProductionChain.ts

import { v4 as uuidv4 } from 'uuid';
import { InfluenceNode, ProductNode } from '@/types/reactFlowTypes';
import { getAllAncestors } from '@/utils/TreeVisualizer/nodeHelpers';

type SerializableNode = Omit<InfluenceNode, 'position' | 'width' | 'height' | 'data'> & {
    data: Omit<InfluenceNode['data'], 'handleSelectProcess' | 'handleSerialize'> & { isRoot?: boolean };
};

export const serializeProductionChain = async (
    focalNodeId: string, 
    nodes: InfluenceNode[], 
    db: PouchDB.Database
): Promise<void> => {
    if (!db) {
        console.error('PouchDB instance is not available');
        return;
    }

    const focalNode = nodes.find(node => node.id === focalNodeId);
    if (!focalNode || focalNode.type !== 'productNode') {
        console.error('Focal node not found or is not a ProductNode');
        return;
    }

    const ancestorNodes = getAllAncestors(nodes, focalNodeId);
    const serializedNodes: SerializableNode[] = [
        {
            ...focalNode,
            data: { 
                ...focalNode.data, 
                isRoot: true,
                handleSelectProcess: undefined,
                handleSerialize: undefined,
            },
        },
        ...ancestorNodes.map(node => ({
            ...node,
            data: { 
                ...node.data, 
                handleSelectProcess: undefined,
                handleSerialize: undefined,
            },
        })),
    ];

    const serializedChain = {
        _id: uuidv4(),
        focalProductId: (focalNode as ProductNode).data.productDetails.id,
        createdAt: new Date().toISOString(),
        nodeCount: serializedNodes.length,
        rootProductId: (focalNode as ProductNode).data.productDetails.id,
        nodes: serializedNodes,
    };

    // console.log('Attempting to save serialized chain:', JSON.stringify(serializedChain));

    try {
        const response = await db.put(serializedChain);
        // console.log('Successfully saved configuration:', response);

        const attachment = new Blob([JSON.stringify(serializedNodes)], { type: 'application/json' });
        await db.putAttachment(serializedChain._id, 'nodes', response.rev, attachment, 'application/json');
        // console.log('Successfully saved attachment');

        // Log all documents after saving
        const allDocs = await db.allDocs();
        // console.log('All document IDs in PouchDB after saving:', allDocs.rows.map(row => row.id));
    } catch (error) {
        console.error('Error saving configuration:', error);
    }
};
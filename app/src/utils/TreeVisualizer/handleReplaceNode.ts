// utils/TreeVisualizer/handleReplaceNode.ts

import { Node, Edge } from '@xyflow/react';
import PouchDB from 'pouchdb';
import { getDescendantIds } from './getDescendantIds';
import { createProductNodeWithCallbacks } from './createProductNodeWithCallbacks';
import { ProductNodeData } from '@/types/reactFlowTypes';
import { PouchDBNodeDocument } from '@/types/pouchSchemes';

export const handleReplaceNode = async (
    currentNodeId: string,
    productId: string,
    db: PouchDB.Database | null,
    nodes: Node<ProductNodeData>[],
    edges: Edge[],
    setNodes: React.Dispatch<React.SetStateAction<Node<ProductNodeData>[]>>,
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
    handleSelectProcess: (processId: string, nodeId: string) => void,
    handleSerialize: (focalProductId: string) => void
) => {
    if (!db) {
        console.error('PouchDB is not initialized');
        return;
    }

    try {
        // Step 1: Fetch the root node of the chain from PouchDB
        const result = await db.find({
            selector: {
                'data.productDetails.id': productId,
                'data.isRoot': true,
            },
        });

        const rootNode = result.docs[0] as PouchDBNodeDocument | undefined;
        if (!rootNode) {
            console.error('No saved root node found in PouchDB for productId:', productId);
            return;
        }

        // Step 2: Fetch the entire chain from PouchDB using the root node's id
        const chainResult = await db.find({
            selector: {
                $or: [
                    { id: rootNode.id },
                    { parentId: rootNode.id },
                ],
            },
        });

        const savedNodes = chainResult.docs as PouchDBNodeDocument[];

        // Step 3: Remove the current node and its descendants from the nodes array
        let updatedNodes = [...nodes];
        let updatedEdges = [...edges];

        const nodeToReplace = updatedNodes.find((node) => node.id === currentNodeId);
        if (!nodeToReplace) {
            console.error('No node found with ID:', currentNodeId);
            return;
        }

        const descendantIds = getDescendantIds(nodeToReplace.id, updatedNodes);
        updatedNodes = updatedNodes.filter(
            (node) => ![nodeToReplace.id, ...descendantIds].includes(node.id)
        );
        updatedEdges = updatedEdges.filter(
            (edge) => ![nodeToReplace.id, ...descendantIds].includes(edge.source)
        );

        // Step 4: Convert saved PouchDB documents to Node format and inject callbacks
        const convertedNodes: Node<ProductNodeData>[] = savedNodes.map((doc) =>
            createProductNodeWithCallbacks(doc, handleSelectProcess, handleSerialize)
        );

        updatedNodes = [...updatedNodes, ...convertedNodes];

        // Step 5: Update edges to connect the new nodes correctly
        const newEdges = convertedNodes.flatMap((node) => {
            return node.parentId
                ? [
                      {
                          id: `edge-${node.parentId}-${node.id}`,
                          source: node.parentId,
                          target: node.id,
                          type: 'smoothstep',
                      },
                  ]
                : [];
        });

        updatedEdges = [...updatedEdges, ...newEdges];

        // Step 6: Update state with the new nodes and edges
        setNodes(updatedNodes);
        setEdges(updatedEdges);

        console.log('Replaced node and updated nodes:', updatedNodes);
    } catch (error) {
        console.error('Error replacing node from PouchDB:', error);
    }
};

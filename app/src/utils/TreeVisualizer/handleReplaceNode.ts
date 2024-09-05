

import { Node, Edge } from '@xyflow/react';
import PouchDB from 'pouchdb';
import { getDescendantIds } from './getDescendantIds';
import { createProductNodeWithCallbacks } from './createProductNodeWithCallbacks';
import { ProductNodeData } from '@/types/reactFlowTypes';
import { PouchDBNodeDocument } from '@/types/pouchSchemes';

export const handleReplaceNode = async (
    currentNodeId: string,
    configId: string,
    db: PouchDB.Database,
    nodes: Node<ProductNodeData>[],
    edges: Edge[],
    setNodes: React.Dispatch<React.SetStateAction<Node<ProductNodeData>[]>>,
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
    handleSelectProcess: (processId: string, nodeId: string) => void,
    handleSerialize: (focalProductId: string) => void
) => {
    try {
        // Fetch the selected configuration from PouchDB
        const config = await db.get(configId);
        const attachment = await db.getAttachment(configId, 'nodes');
        if (!(attachment instanceof Blob)) {
            throw new Error('Attachment is not a Blob');
        }
        const savedNodes: PouchDBNodeDocument[] = JSON.parse(await attachment.text());

        // Find the current node and its ancestors
        const currentNode = nodes.find(node => node.id === currentNodeId);
        if (!currentNode) {
            throw new Error('Current node not found');
        }
        const ancestorIds = getAncestorIds(currentNodeId, nodes);
        const nodesToRemove = [currentNodeId, ...ancestorIds];

        // Remove the current node, its ancestors, and their edges
        let updatedNodes = nodes.filter(node => !nodesToRemove.includes(node.id));
        let updatedEdges = edges.filter(edge => !nodesToRemove.includes(edge.source) && !nodesToRemove.includes(edge.target));

        // Convert saved nodes to React Flow nodes
        const newNodes: Node<ProductNodeData>[] = savedNodes.map(savedNode =>
            createProductNodeWithCallbacks(savedNode, handleSelectProcess, handleSerialize)
        );

        // Find the root node of the saved configuration
        const rootSavedNode = newNodes.find(node => node.data.isRoot);
        if (!rootSavedNode) {
            throw new Error('Root node not found in saved configuration');
        }

        // Connect the root saved node to the parent of the replaced node
        const parentEdge = edges.find(edge => edge.target === currentNodeId);
        if (parentEdge) {
            updatedEdges.push({
                ...parentEdge,
                target: rootSavedNode.id,
            });
        }

        // Add new nodes and create edges between them
        updatedNodes = [...updatedNodes, ...newNodes];
        const newEdges = createEdgesBetweenNodes(newNodes);
        updatedEdges = [...updatedEdges, ...newEdges];

        // Update the state
        setNodes(updatedNodes);
        setEdges(updatedEdges);

        console.log('Replaced node and updated nodes:', updatedNodes);
    } catch (error) {
        console.error('Error replacing node from PouchDB:', error);
    }
};

const getAncestorIds = (nodeId: string, nodes: Node<ProductNodeData>[]): string[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.data.ancestorIds) {
        return [];
    }
    return [
        ...node.data.ancestorIds,
        ...node.data.ancestorIds.flatMap(id => getAncestorIds(id, nodes))];
};

const createEdgesBetweenNodes = (nodes: Node<ProductNodeData>[]): Edge[] => {
    return nodes.flatMap(node => {
        if (node.data && Array.isArray(node.data.ancestorIds)) {
            return node.data.ancestorIds.map(ancestorId => ({
                id: `edge-${ancestorId}-${node.id}`,
                source: ancestorId,
                target: node.id,
                type: 'smoothstep' as const,
            }));
        }
        return [];
    });
};
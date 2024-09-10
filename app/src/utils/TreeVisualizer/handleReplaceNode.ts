

import { Node, Edge, Position } from '@xyflow/react';
import PouchDB from 'pouchdb';
import { getDescendantIds } from './getDescendantIds';
import { createProductNodeWithCallbacks } from './createProductNodeWithCallbacks';
import { InfluenceNode, ProductNodeData } from '@/types/reactFlowTypes';
import { PouchDBNodeDocument } from '@/types/pouchSchemes';
import React from 'react';
import calculateDesiredAmount from './calculateDesiredAmount';
import { sortNodesByHierarchy } from './nodeHelpers';

export const handleReplaceNode = async (
    currentNodeId: string,
    configId: string,
    db: PouchDB.Database,
    nodes: Node[],
    edges: Edge[],
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
    nodesRef: React.MutableRefObject<Node[]>,
    handleSelectProcess: (processId: string, nodeId: string) => void,
    handleSerialize: (focalProductId: string) => void,
    desiredAmount: number
) => {
    try {
        console.log(`Attempting to replace node. Current Node ID: ${currentNodeId}, Config ID: ${configId}`);
        const currentNodes = nodesRef.current as InfluenceNode[];
        console.log('Current nodes:', currentNodes.map(n => ({ id: n.id, type: n.type })));

        // Find the current node and store its parentId
        const currentNode = currentNodes.find(node => node.id === currentNodeId);
        if (!currentNode) {
            throw new Error(`Current node not found. ID: ${currentNodeId}`);
        }
        const parentId = currentNode.parentId;

        // Fetch the selected configuration from PouchDB
        const config = await db.get(configId);
        console.log('Retrieved config:', config);

        // Fetch the attachment
        const attachment = await db.getAttachment(configId, 'nodes');
        if (!(attachment instanceof Blob)) {
            throw new Error('Attachment is not a Blob');
        }

        const savedNodes: PouchDBNodeDocument[] = JSON.parse(await attachment.text());
        console.log('Parsed saved nodes:', savedNodes);

        const ancestorIds = getAncestorIds(currentNodeId, currentNodes);
        const nodesToRemove = [currentNodeId, ...ancestorIds];

        console.log('Nodes to remove:', nodesToRemove);

        // Remove the current node, its ancestors, and their edges
        let updatedNodes: InfluenceNode[] = currentNodes.filter(node => !nodesToRemove.includes(node.id));
        let updatedEdges = edges.filter(edge => !nodesToRemove.includes(edge.source) && !nodesToRemove.includes(edge.target));

        // Convert saved nodes to React Flow nodes
        const newNodes: InfluenceNode[] = savedNodes.map(savedNode =>
            createProductNodeWithCallbacks(savedNode, handleSelectProcess, handleSerialize)
        );

        // Find the root node of the saved configuration
        const rootSavedNode = newNodes.find(node => node.data.isRoot);
        if (!rootSavedNode) {
            throw new Error('Root node not found in saved configuration');
        }

        // Set the parentId for the root saved node
        rootSavedNode.parentId = parentId;

        // Set the descendantIds for the root saved node
        if (parentId) {
            rootSavedNode.data.descendantIds = [parentId];
        }

        // Update the parent node's ancestorIds
        if (parentId) {
            const parentNode = updatedNodes.find(node => node.id === parentId);
            if (parentNode) {
                parentNode.data.ancestorIds = parentNode.data.ancestorIds || [];
                const index = parentNode.data.ancestorIds.indexOf(currentNodeId);
                if (index !== -1) {
                    parentNode.data.ancestorIds[index] = rootSavedNode.id;
                } else {
                    parentNode.data.ancestorIds.push(rootSavedNode.id);
                }
            }
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

        // Sort the nodes to ensure parent nodes come before children
        const sortedNodes = sortNodesByHierarchy([...updatedNodes, ...newNodes]);

        // Find the root node of the entire tree
        const treeRootNode = updatedNodes.find(node => !node.parentId) as InfluenceNode;
        if (!treeRootNode) {
            throw new Error('Tree root node not found');
        }

        // Recalculate amounts for all nodes using the provided desiredAmount
        const recalculatedNodes = calculateDesiredAmount(
            sortedNodes,
            desiredAmount,
            treeRootNode.id
        );

        // Update the state
        setNodes(recalculatedNodes);
        setEdges(updatedEdges);

        console.log('Successfully replaced node and updated nodes:', recalculatedNodes);
    } catch (error) {
        console.error('Error replacing node from PouchDB:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
};

const getAncestorIds = (nodeId: string, nodes: InfluenceNode[]): string[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.data.ancestorIds) {
        return [];
    }
    return [
        ...node.data.ancestorIds,
        ...node.data.ancestorIds.flatMap(id => getAncestorIds(id, nodes))];
};

const createEdgesBetweenNodes = (nodes: InfluenceNode[]): Edge[] => {
    return nodes.flatMap(node => {
        if (node.data.ancestorIds) {
            return node.data.ancestorIds.map(ancestorId => ({
                id: `edge-${node.id}-${ancestorId}`,
                source: node.id,  // The descendant (current node) is the source
                target: ancestorId,  // The ancestor is the target
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
                type: 'smoothstep',
            }));
        }
        return [];
    });
};
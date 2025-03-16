// utils/TreeVisualizer/handleReplaceNode.ts

import React from 'react';
import { 
    findNodeById, 
    getAllInflows, 
    sortNodesByHierarchy,  
    updateInfluenceNode
} from '@/utils/TreeVisualizer/nodeHelpers';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { createProductNodeWithCallbacks } from '@/utils/TreeVisualizer/createProductNodeWithCallbacks';
import calculateDesiredAmount from '@/utils/TreeVisualizer/calculateDesiredAmount';
import { InfluenceNode, ProductNodeData } from '@/types/reactFlowTypes';
import { PouchDBNodeDocument } from '@/types/pouchSchemes';
import { Node, Edge, Position } from '@xyflow/react';
import { FlowAction } from '@/contexts/FlowContext';

const regenerateNodeIds = (nodes: PouchDBNodeDocument[]): PouchDBNodeDocument[] => {
    const idMap = new Map<string, string>();
    
    // First pass: generate new IDs
    nodes.forEach(node => {
      const newId = generateUniqueId();
      idMap.set(node.id, newId);
    });
  
    // Second pass: update all references
    return nodes.map(node => {
      const newNode = { ...node, id: idMap.get(node.id) || node.id };
      
      if (newNode.parentId && idMap.has(newNode.parentId)) {
        newNode.parentId = idMap.get(newNode.parentId);
      }
  
      if (newNode.data.inflowIds) {
        newNode.data.inflowIds = newNode.data.inflowIds.map((id: string) => idMap.get(id) || id);
      }
  
      if (newNode.data.outflowIds) {
        newNode.data.outflowIds = newNode.data.outflowIds.map((id: string) => idMap.get(id) || id);
      }
  
      return newNode;
    });
  };

  export const handleReplaceNode = async (
    currentNodeId: string,
    configId: string,
    db: PouchDB.Database,
    nodes: Node[],
    edges: Edge[],
    dispatch: React.Dispatch<FlowAction>,
    nodesRef: React.MutableRefObject<Node[]>,
    handleSelectProcess: (processId: string, nodeId: string) => void,
    handleSerialize: (focalProductId: string) => void,
    desiredAmount: number
) => {
    try {
        console.log(`Starting handleReplaceNode for currentNodeId: ${currentNodeId}, configId: ${configId}`);
        const currentNodes = nodesRef.current as InfluenceNode[];
        console.log('Current nodes:', currentNodes.map(n => ({ id: n.id, type: n.type, productId: (n.data as ProductNodeData).productDetails?.id })));

        // Find the current node and store its parentId
        const currentNode = findNodeById(currentNodes, currentNodeId) as InfluenceNode;
        if (!currentNode) {
            throw new Error(`Current node not found. ID: ${currentNodeId}`);
        }
        const parentId = currentNode.parentId;
        console.log(`Current node: ${currentNodeId}, Parent node: ${parentId}`);

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

        const inflowNodes = getAllInflows(currentNodes, currentNodeId);
        const nodesToRemove = [currentNodeId, ...inflowNodes.map(n => n.id)];

        console.log('Nodes to remove:', nodesToRemove);

        // Remove the current node, its inflows, and their edges
        let updatedNodes: InfluenceNode[] = currentNodes.filter(node => !nodesToRemove.includes(node.id));
        let updatedEdges = edges.filter(edge => !nodesToRemove.includes(edge.source) && !nodesToRemove.includes(edge.target));

        const regeneratedNodes = regenerateNodeIds(savedNodes);
        console.log('Regenerated nodes:', regeneratedNodes);

        // Convert saved nodes to React Flow nodes
        const newNodes: InfluenceNode[] = regeneratedNodes.map(savedNode => {
            const node = createProductNodeWithCallbacks(savedNode, handleSelectProcess, handleSerialize);
            console.log(`Created new node: ${node.id}, type: ${node.type}, productId: ${node.type === 'productNode' ? node.data.productDetails?.id : 'N/A'}`);
            return node;
        });

        // Find the root node of the saved configuration
        const rootSavedNode = newNodes.find(node => node.data.isRoot);
        if (!rootSavedNode) {
            throw new Error('Root node not found in saved configuration');
        }
        console.log(`Root saved node: ${rootSavedNode.id}, productId: ${(rootSavedNode.data as ProductNodeData).productDetails?.id}`);

        // Set the parentId for the root saved node
        rootSavedNode.parentId = parentId;
        console.log(`Set parentId of root saved node to: ${parentId}`);

        // Set the outflowIds for the root saved node
        if (parentId) {
            rootSavedNode.data.outflowIds = [parentId];
            console.log(`Set outflowIds of root saved node to: [${parentId}]`);
        }

        // Update the parent node's inflowIds
        if (parentId) {
            const parentNode = findNodeById(updatedNodes, parentId) as InfluenceNode;
            if (parentNode) {
                console.log(`Before update - Parent node ${parentId} inflowIds:`, parentNode.data.inflowIds);
                parentNode.data.inflowIds = parentNode.data.inflowIds || [];
                const index = parentNode.data.inflowIds.indexOf(currentNodeId);
                if (index !== -1) {
                    parentNode.data.inflowIds[index] = rootSavedNode.id;
                } else {
                    parentNode.data.inflowIds.push(rootSavedNode.id);
                }
                console.log(`After update - Parent node ${parentId} inflowIds:`, parentNode.data.inflowIds);
                updatedNodes = updateInfluenceNode(updatedNodes, parentNode);
            }
        }

        // Connect the root saved node to the parent of the replaced node
        const parentEdge = edges.find(edge => edge.target === currentNodeId);
        if (parentEdge) {
            const newEdge = {
                ...parentEdge,
                target: rootSavedNode.id,
            };
            updatedEdges.push(newEdge);
            console.log(`Created new edge: ${newEdge.source} -> ${newEdge.target}`);
        }

        // Add new nodes and create edges between them
        updatedNodes = [...updatedNodes, ...newNodes];
        const newEdges = createEdgesBetweenNodes(newNodes);
        updatedEdges = [...updatedEdges, ...newEdges];

        console.log('New edges created:', newEdges);

        // Sort the nodes to ensure parent nodes come before children
        const sortedNodes = sortNodesByHierarchy([...updatedNodes, ...newNodes]);

        // Find the root node of the entire tree
        const treeRootNode = updatedNodes.find(node => !node.parentId) as InfluenceNode;
        if (!treeRootNode) {
            throw new Error('Tree root node not found');
        }
        console.log(`Tree root node: ${treeRootNode.id}, productId: ${(treeRootNode.data as ProductNodeData).productDetails?.id}`);

        // Recalculate amounts for all nodes using the provided desiredAmount
        const recalculatedNodes = calculateDesiredAmount(
            sortedNodes,
            desiredAmount,
            treeRootNode.id
        );

        console.log('Recalculated nodes:', recalculatedNodes.map(n => ({ id: n.id, amount: n.data.amount })));

        // Update the state
        dispatch({
            type: 'BATCH_UPDATE',
            payload: {
                nodes: recalculatedNodes,
                edges: updatedEdges,
                rootNodeId: treeRootNode.id
            }
        });

        console.log('Final updated nodes:', recalculatedNodes.map(n => ({ 
            id: n.id, 
            type: n.type, 
            productId: (n.data as ProductNodeData).productDetails?.id,
            parentId: n.parentId,
            inflowIds: n.data.inflowIds,
            outflowIds: n.data.outflowIds
        })));
        console.log('Final updated edges:', updatedEdges);

    } catch (error) {
        console.error('Error replacing node from PouchDB:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
};

const getInflowIds = (nodeId: string, nodes: InfluenceNode[]): string[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.data.inflowIds) {
        return [];
    }
    return [
        ...node.data.inflowIds,
        ...node.data.inflowIds.flatMap(id => getInflowIds(id, nodes))];
};

const createEdgesBetweenNodes = (nodes: InfluenceNode[]): Edge[] => {
    return nodes.flatMap(node => {
        if (node.data.inflowIds) {
            return node.data.inflowIds.map(inflowId => ({
                id: `edge-${node.id}-${inflowId}`,
                source: node.id,  // The outflow (current node) is the source
                target: inflowId,  // The inflow is the target
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
                type: 'smoothstep',
            }));
        }
        return [];
    });
};
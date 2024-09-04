// utils/TreeVisualizer/serializeProductionChain.ts

import { Node } from '@xyflow/react';
import { ProductNode, ProcessNode } from '@/types/reactFlowTypes';
import { v4 as uuidv4 } from 'uuid';

interface SerializedNode {
  id: string;
  data: any;
  type?: string;
  parentId?: string;
}

export const serializeProductionChain = (focalProductId: string, nodes: Node[]) => {
    console.log('Serializing production chain for focal product ID:', focalProductId,'\nnodes:\n', nodes);
  const serializedNodes: SerializedNode[] = [];
  const visitedNodes = new Set<string>();

  function traverseAncestors(nodeId: string, isRoot: boolean = false) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || visitedNodes.has(nodeId)) {
      return;
    }
    visitedNodes.add(nodeId);

    const serializedNode: SerializedNode = {
      id: node.id,
      data: { ...node.data, isRoot },
      type: node.type,
      parentId: node.data.parentId as string | undefined,
    };
    serializedNodes.push(serializedNode);

    // Traverse all ancestors for both product and process nodes
    const ancestorIds = Array.isArray(node.data.ancestorIds) ? node.data.ancestorIds : [];
    ancestorIds.forEach((ancestorId: string) => {
      traverseAncestors(ancestorId);
    });
  }

  // Ensure the focal node exists before starting traversal
  const focalNode = nodes.find(n => n.id === focalProductId);
  if (!focalNode) {
    console.error('Focal node not found');
    return null;
  }

  // Start traversal from the focal node
  traverseAncestors(focalProductId, true);

  const serializedChain = {
    _id: uuidv4(),
    focalProductId,
    createdAt: new Date().toISOString(),
    nodeCount: serializedNodes.length,
  };

  const attachment = new Blob([JSON.stringify(serializedNodes)], {type: 'application/json'});

  return {
    doc: serializedChain,
    attachment: attachment
  };
};
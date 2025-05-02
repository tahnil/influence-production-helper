// services/EdgeCreationService.ts
import { InfluenceNode } from '@/types/reactFlowTypes';
import { Edge } from '@xyflow/react';

export const EdgeCreationService = {
  /**
   * Creates edges between nodes based on their relationships and the nodeIdMap
   * @param nodes The newly created nodes
   * @param nodeIdMap Map of placeholder IDs to actual node IDs
   * @param mainOutflowCompoundId Optional ID of the main outflow compound node
   * @returns Array of edges connecting the nodes
   */
  createEdges(
    nodes: InfluenceNode[], 
    nodeIdMap: Record<string, string>,
    mainOutflowCompoundId?: string
  ): Edge[] {
    const edges: Edge[] = [];
    const processNodeId = nodeIdMap['PROCESS_NODE_ID'];
    
    // Early return if no process node exists
    if (!processNodeId) return edges;
    
    const processNode = nodes.find(n => n.id === processNodeId);
    if (!processNode) return edges;
  
    // Get logical parent ID from the process node
    const logicalParentId = processNode.data.logicalParentId as string;
      
    // 1. Edge from compound node to process node (main flow)
    if (logicalParentId && mainOutflowCompoundId) {
      edges.push({
        id: `edge-${mainOutflowCompoundId}-${processNodeId}`,
        source: mainOutflowCompoundId,
        target: processNodeId,
        type: 'custom',
      });
    } 
    // Use this connection logic only when not using mainOutflowCompoundId 
    else if (logicalParentId && !mainOutflowCompoundId) {
      edges.push({
        id: `edge-${logicalParentId}-${processNodeId}`,
        source: logicalParentId,
        target: processNodeId,
        type: 'custom',
      });
    }
  
    // 2. Connect process node to all input outflows compound nodes (INPUT_COMPOUND_X)
    Object.entries(nodeIdMap).forEach(([key, id]) => {
      if (key.startsWith('INPUT_COMPOUND_')) {
        edges.push({
          id: `edge-${processNodeId}-${id}`,
          source: processNodeId,
          target: id,
          type: 'custom',
        });
      }
    });
      
    return edges;
  }
};

export default EdgeCreationService;
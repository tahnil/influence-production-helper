import { InfluenceNode } from "@/types/reactFlowTypes";
import { Edge } from "@xyflow/react";

/**
 * Creates edges between nodes based on their relationships and the nodeIdMap
 * @param nodes - The newly created nodes
 * @param nodeIdMap - Map of placeholder IDs to actual node IDs
 * @param mainOutflowCompoundId - Optional ID of the main outflow compound node
 * @returns Array of edges connecting the nodes
 */
export function createEdges(
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
    
    // Determine which outflow compound node to use
    // If mainOutflowCompoundId is provided, use it (this handles the first function's case)
    // Otherwise use the one from nodeIdMap (handles the second function's case)
    const outflowsCompoundId = mainOutflowCompoundId || nodeIdMap['OUTFLOWS_COMPOUND_NODE_ID'];
  
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
    // This addresses the original logicalParentId->processNode edge in second function
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
  
    // 3. Edges from process to input products (from second function)
    // This finds product nodes that have this process as their logical parent
    const inputProductNodes = nodes.filter(n =>
      n.type === 'productNode' &&
      n.data.logicalParentId === processNodeId
    );
  
    inputProductNodes.forEach(productNode => {
      edges.push({
        id: `edge-${processNodeId}-${productNode.id}`,
        source: processNodeId,
        target: productNode.id,
        type: 'custom',
      });
    });
  
    // 4. Optional edge from process to outflows compound (currently commented out in original)
    // Uncomment if needed
    /*
    if (outflowsCompoundId) {
      edges.push({
        id: `edge-${processNodeId}-${outflowsCompoundId}`,
        source: processNodeId,
        target: outflowsCompoundId,
        type: 'custom',
      });
    }
    */
  
    return edges;
  }
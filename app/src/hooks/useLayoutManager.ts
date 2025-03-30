// hooks/useLayoutManager.ts

import { useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useFlow } from '@/contexts/FlowContext';
import { DagreConfig } from '@/hooks/useDagreConfig';
import { deduplicateEdges } from '@/utils/TreeVisualizer/edgeUtils';

export const useLayoutManager = (
  nodes: Node[],
  edges: Edge[],
  dagreConfig: DagreConfig,
  nodesReady: boolean
) => {
  const { dispatch, needsLayout } = useFlow();
  
  const applyLayout = useCallback(() => {
    if (!nodesReady) return;
    
    const nodesWithFallbackDimensions = nodes.map(node => {
      if (!node.measured?.width || !node.measured?.height) {
        return {
          ...node,
          measured: {
            width: node.type === 'processNode' ? 250 : 300,
            height: node.type === 'processNode' ? 120 : 150,
            ...node.measured
          }
        };
      }
      return node;
    });

    dispatch({
      type: 'APPLY_LAYOUT',
      payload: {
        nodes: nodesWithFallbackDimensions,
        edges: deduplicateEdges(edges),
        dagreConfig,
        preserveEdgeReferences: true
      }
    });
  }, [nodes, edges, dagreConfig, nodesReady, dispatch]);

  // Apply layout when needed
  useEffect(() => {
    if (needsLayout && nodesReady) {
      applyLayout();
    }
  }, [needsLayout, nodesReady, applyLayout]);

  return { applyLayout };
};
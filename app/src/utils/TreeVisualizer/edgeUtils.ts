// utils/TreeVisualizer/edgeUtils.ts

import { Edge } from '@xyflow/react';

export const deduplicateEdges = (edges: Edge[]): Edge[] => {
  // Create a map using edge id as key to ensure uniqueness
  const uniqueEdges = new Map<string, Edge>();

  // Only keep the last occurrence of each edge id
  edges.forEach(edge => {
    uniqueEdges.set(edge.id, edge);
  });

  return Array.from(uniqueEdges.values());
};
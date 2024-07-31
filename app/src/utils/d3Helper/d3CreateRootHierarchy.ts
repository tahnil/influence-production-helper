// utils/d3Helper/d3CreateRootHierarchy.ts

import * as d3 from 'd3';
import { D3TreeNode, ExtendedD3HierarchyNode } from '@/types/d3Types';

export function createRootHierarchy(data: D3TreeNode, height: number): ExtendedD3HierarchyNode {
    const root = d3.hierarchy<D3TreeNode>(data) as ExtendedD3HierarchyNode;
    root.x0 = height / 2;
    root.y0 = 0;
    return root;
}
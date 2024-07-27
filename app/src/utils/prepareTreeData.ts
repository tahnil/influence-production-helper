// utils/prepareTreeData.ts
import { D3TreeNode, ExtendedD3HierarchyNode } from '@/types/d3Types';
import * as d3 from 'd3';

export const prepareTreeData = (treeData: D3TreeNode): ExtendedD3HierarchyNode => {
    const root: ExtendedD3HierarchyNode = d3.hierarchy<D3TreeNode>(treeData, d => {
        if ((d.type === 'product' || d.type === 'process') && Array.isArray(d.children)) {
            return d.children;
        }
        return null;
    }) as ExtendedD3HierarchyNode;

    return root;
};

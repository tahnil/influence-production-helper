// utils/d3Tree.ts

import * as d3 from 'd3';
import { ExtendedD3HierarchyNode, D3TreeNode, ProductNode } from '@/types/d3Types';
import { initializeSVG } from '@/utils/d3Helper/d3InitializeSVG';
import { createRootHierarchy } from '@/utils/d3Helper/d3CreateRootHierarchy';
import { updateNodes } from '@/utils/d3Helper/d3UpdateNodes';
import { updateLinks } from '@/utils/d3Helper/d3UpdateLinks';

export const unifiedD3Tree = (
    containerRef: HTMLElement,
    rootRef: React.RefObject<ExtendedD3HierarchyNode | null>,
    data: ProductNode,
    updateRef: React.MutableRefObject<(source: ExtendedD3HierarchyNode | null) => void>,
    setTreeData: React.Dispatch<React.SetStateAction<D3TreeNode | null>>,
    margin: { top: number, right: number, bottom: number, left: number } = { top: 20, right: 90, bottom: 30, left: 90 },
    width: number = 960,
    height: number = 500
) => {    
    console.log("[unifiedD3Tree] Initializing D3 Tree with data:", data);

    if (!rootRef.current) {
        const svg = initializeSVG(containerRef, width, height, margin);
        rootRef.current = createRootHierarchy(data, height);
        console.log("[unifiedD3Tree] Initialized SVG and group elements.");
    } else {
        rootRef.current = createRootHierarchy(data, height);
    }

    const root = rootRef.current;
    const treemap = d3.tree<D3TreeNode>().size([height, width]);
    const nodes = treemap(root).descendants() as ExtendedD3HierarchyNode[];
    const links = treemap(root).links();

    console.log("[unifiedD3Tree] Generated tree nodes and links:", nodes, links);
    const svg = d3.select(containerRef).select('svg g');

    const update = (source: ExtendedD3HierarchyNode | null) => {
        console.log("[unifiedD3Tree] Updating tree with source:", source);
        updateNodes(svg, nodes, source, setTreeData);
        updateLinks(svg, links, source);

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        console.log("[unifiedD3Tree] Tree update completed.");
    };

    update(root);
    updateRef.current = update;
    console.log("[unifiedD3Tree] Tree initialization and update setup completed.");
};

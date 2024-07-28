// utils/d3Tree.ts

import * as d3 from 'd3';
import { ExtendedD3HierarchyNode, D3TreeNode, ProductNode } from '@/types/d3Types';
import { createAndAppendNodes, curvedLine } from '@/utils/d3Utils';

export const unifiedD3Tree = (
    containerRef: HTMLElement,
    rootRef: React.RefObject<ExtendedD3HierarchyNode | null>,
    data: ProductNode,
    updateRef: React.MutableRefObject<(source: ExtendedD3HierarchyNode | null) => void>,
    setTreeData: React.Dispatch<React.SetStateAction<D3TreeNode | null>>,
    margin = { top: 20, right: 90, bottom: 30, left: 90 },
    width = 960,
    height = 500
) => {    
        console.log("[unifiedD3Tree] Initializing D3 Tree with data:", data);
        if (!rootRef.current) {
        // Initialize SVG and group elements only once
        const svg = d3.select(containerRef)
            .append('svg')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .call(d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
                svg.attr("transform", event.transform);
            }))
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        console.log("[unifiedD3Tree] Initialized SVG and group elements.");
        rootRef.current = d3.hierarchy<D3TreeNode>(data) as ExtendedD3HierarchyNode;
        rootRef.current.x0 = height / 2;
        rootRef.current.y0 = 0;
        svg.append('g').attr('class', 'nodes');
        svg.append('g').attr('class', 'links');
    } else {
        rootRef.current = d3.hierarchy<D3TreeNode>(data) as ExtendedD3HierarchyNode;
    }

    const root = rootRef.current;
    const treemap = d3.tree<D3TreeNode>().size([height, width]);
    const nodes = treemap(root).descendants() as ExtendedD3HierarchyNode[];
    const links = treemap(root).links();

    console.log("[unifiedD3Tree] Generated tree nodes and links:", nodes, links);
    const svg = d3.select(containerRef).select('svg g');

    const update = (source: ExtendedD3HierarchyNode | null) => {
        // Update nodes
        console.log("[unifiedD3Tree] Updating tree with source:", source);
        const node = svg.select('g.nodes').selectAll<SVGGElement, ExtendedD3HierarchyNode>('g.node')
            .data(nodes, d => d.data.uniqueNodeId);

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${source?.y0},${source?.x0})`)
            .on('click', d => {
                console.log("[unifiedD3Tree] Node clicked:", d);
                setTreeData(d.data as ProductNode);
            });

        console.log("[unifiedD3Tree] Entering nodes:", nodeEnter.nodes());
        createAndAppendNodes(nodeEnter);

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(750)
            .attr('transform', d => `translate(${d.y},${d.x})`);

        const nodeExit = node.exit().transition()
            .duration(750)
            .attr('transform', d => `translate(${source?.y0},${source?.x0})`)
            .remove();

        // Update links
        const link = svg.select('g.links').selectAll<SVGPathElement, d3.HierarchyLink<D3TreeNode>>('path.link')
            .data(links, d => d.target.data.uniqueNodeId);

        const linkEnter = link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr('d', d => {
                const o = { x: source?.x0, y: source?.y0 };
                return curvedLine(o, o);
            });

        const linkUpdate = linkEnter.merge(link);

        linkUpdate.transition()
            .duration(750)
            .attr('d', d => curvedLine(d.source, d.target));

        link.exit().transition()
            .duration(750)
            .attr('d', d => {
                const o = { x: source?.x, y: source?.y };
                return curvedLine(o, o);
            })
            .remove();

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

// utils/d3Tree.ts

import * as d3 from 'd3';
import { ExtendedD3HierarchyNode, D3TreeNode, ProductNode } from '@/types/d3Types';
import handleNodeClick from '@/utils/d3HandleNodeClick';
import { createAndAppendNodes, curvedLine } from '@/utils/d3Utils';

export const unifiedD3Tree = (
    containerRef: React.RefObject<HTMLDivElement>,
    rootRef: React.RefObject<ExtendedD3HierarchyNode | null>,
    data: ProductNode,
    updateRef: React.MutableRefObject<(source: ExtendedD3HierarchyNode | null) => void>,
    setSelectedNode: React.Dispatch<React.SetStateAction<D3TreeNode | null>>,
    margin = { top: 20, right: 90, bottom: 30, left: 90 },
    width = 960,
    height = 500
) => {
    console.log("[unifiedD3Tree] Initializing D3 Tree with data:", data);

    // Clear existing content
    d3.select(containerRef.current).selectAll("*").remove();
    console.log("[unifiedD3Tree] Cleared existing content.");

    // Initialize SVG and group elements
    const svg = d3.select(containerRef.current)
        .append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .call(d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
            svg.attr("transform", event.transform);
        }))
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    console.log("[unifiedD3Tree] Initialized SVG and group elements.");

    // Create the root hierarchy node
    const root = d3.hierarchy<D3TreeNode>(data) as ExtendedD3HierarchyNode;
    root.x0 = height / 2;
    root.y0 = 0;

    console.log("[unifiedD3Tree] Created root hierarchy node:", root);

    const treemap = d3.tree<D3TreeNode>().size([height, width]);
    const nodes = treemap(root).descendants() as ExtendedD3HierarchyNode[];
    const links = treemap(root).links();

    console.log("[unifiedD3Tree] Generated tree nodes and links:", nodes, links);

    const update = (source: ExtendedD3HierarchyNode | null) => {
        console.log("[unifiedD3Tree] Updating tree with source:", source);

        const node = svg.selectAll<SVGGElement, ExtendedD3HierarchyNode>('g.node')
            .data(nodes, d => d.data.uniqueNodeId);

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${source?.y0},${source?.x0})`)
            .on('click', d => {
                console.log("[unifiedD3Tree] Node clicked:", d);
                setSelectedNode(d.data);
            });

        console.log("[unifiedD3Tree] Entering nodes:", nodeEnter.nodes());
        createAndAppendNodes(nodeEnter);

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(750)
            .attr('transform', d => `translate(${d.y},${d.x})`);

        const nodeExit = node.exit().transition()
            .duration(750)
            .attr('transform', d => `translate(${source?.y},${source?.x})`)
            .remove()
            .on('end', () => {
                console.log("[unifiedD3Tree] Exiting nodes:", nodeExit.nodes());
            });

        const link = svg.selectAll<SVGPathElement, d3.HierarchyLink<D3TreeNode>>('path.link')
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
            .remove()
            .on('end', () => {
                console.log("[unifiedD3Tree] Exiting links:", link.exit().nodes());
            });

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        console.log("[unifiedD3Tree] Tree update completed.");
    };

    if (!rootRef.current) {
        rootRef.current = root;
        console.log("[unifiedD3Tree] Set rootRef.current to root:", root);
    }
    update(root);
    updateRef.current = update;
    console.log("[unifiedD3Tree] Tree initialization and update setup completed.");
};

// utils/d3UpdateTree.ts
import * as d3 from 'd3';
import { HierarchyPointLink } from 'd3';
import { D3TreeNode, ExtendedD3HierarchyNode } from '@/types/d3Types';
import { createAndAppendNodes, curvedLine } from './d3Utils';
import { InfluenceProcess } from '@/types/influenceTypes';

export const updateD3Tree = (
    source: ExtendedD3HierarchyNode,
    containerRef: React.RefObject<HTMLDivElement>,
    rootRef: React.MutableRefObject<ExtendedD3HierarchyNode | null>,
    margin: { top: number; right: number; bottom: number; left: number; },
    update: (source: ExtendedD3HierarchyNode) => void,
    click: (event: React.MouseEvent, d: ExtendedD3HierarchyNode) => void,
) => {
    console.log(`[d3UpdateTree.tsx] updateD3Tree() called...`);
    const container = d3.select(containerRef.current);
    const svg = container.select('svg');
    const g = svg.select('g');

    const width = window.innerWidth - margin.left - margin.right;
    const height = window.innerHeight - margin.top - margin.bottom;

    const treemap = d3.tree<D3TreeNode>().size([height, width]);
    const root = rootRef.current;
    if (!root) return;

    const treeData = treemap(root);

    const nodes = treeData.descendants() as ExtendedD3HierarchyNode[];
    const node = g.selectAll<SVGGElement, ExtendedD3HierarchyNode>('g.node')
        .data(nodes, d => d.data.uniqueNodeId);

    const links = treeData.links() as Array<HierarchyPointLink<D3TreeNode>>;
    const link = g.selectAll<SVGPathElement, HierarchyPointLink<D3TreeNode>>('path.link')
        .data(links, d => d.target.data.uniqueNodeId);

    const nodeEnter = node.enter().append('g')
        .classed('node', true)
        .attr('transform', d => `translate(${d.y},${d.x})`)
        .on('click', click);

    createAndAppendNodes(nodeEnter);

    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.transition().duration(750).attr('transform', d => `translate(${d.y},${d.x})`);

    const nodeExit = node.exit().transition().duration(750).attr('transform', d => `translate(${source.y},${source.x})`).remove();
    nodeExit.select('circle').attr('r', 0);
    nodeExit.select('text').style('fill-opacity', 0);

    const linkEnter = link.enter().insert('path', 'g')
        .classed('link', true)
        .attr('d', d => {
            const o = { x: source.x0, y: source.y0, x0: source.x0, y0: source.y0, _id: source._id, data: source.data, depth: source.depth, height: source.height, parent: source.parent } as ExtendedD3HierarchyNode;
            return curvedLine(o, o);
        })
        .style('fill', 'none')
        .style('stroke', 'steelblue')
        .style('stroke-width', '2px');

    const linkUpdate = linkEnter.merge(link);
    linkUpdate.transition().duration(750).attr('d', d => curvedLine(d.source, d.target));

    const linkExit = link.exit().transition().duration(750).attr('d', d => {
        const o = { x: source.x, y: source.y, x0: source.x0, y0: source.y0, _id: source._id, data: source.data, depth: source.depth, height: source.height, parent: source.parent } as ExtendedD3HierarchyNode;
        return curvedLine(o, o);
    }).remove();

    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
};

// utils/d3Helper/d3UpdateLinks.ts

import * as d3 from 'd3';
import { D3TreeNode, ExtendedD3HierarchyNode } from '@/types/d3Types';
import { curvedLine } from '@/utils/d3Utils';

export function updateLinks(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    links: d3.HierarchyLink<D3TreeNode>[],
    source: ExtendedD3HierarchyNode | null
): void {
    const link = svg.select('g.links').selectAll<SVGPathElement, d3.HierarchyLink<D3TreeNode>>('path.link')
        .data(links, d => d.target.data.uniqueNodeId);

    const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
            const o = { x: source?.x0, y: source?.y0 };
            return curvedLine(o, o);
        });

    linkEnter.merge(link).transition()
        .duration(750)
        .attr('d', d => curvedLine(d.source, d.target));

    link.exit().transition()
        .duration(750)
        .attr('d', d => {
            const o = { x: source?.x, y: source?.y };
            return curvedLine(o, o);
        })
        .remove();
}

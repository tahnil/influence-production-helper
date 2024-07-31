// utils/d3Helper/d3UpdateNodes.ts

import * as d3 from 'd3';
import { ExtendedD3HierarchyNode, ProductNode } from '@/types/d3Types';
import { createAndAppendNodes } from '../d3Utils';

type SetTreeDataFunction = (node: ProductNode) => void;

export function updateNodes(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    nodes: ExtendedD3HierarchyNode, 
    source: ExtendedD3HierarchyNode | null, 
    setTreeData: SetTreeDataFunction
) {
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

    node.exit().transition()
        .duration(750)
        .attr('transform', d => `translate(${source?.y0},${source?.x0})`)
        .remove();

    return node;
}
// utils/d3Utils.ts
import * as d3 from 'd3';
import { ExtendedD3HierarchyNode } from '@/types/d3Types';
import { renderReactComponent } from '@/components/TreeVisualizer/reactDOM';
import { InfluenceProcess } from '@/types/influenceTypes';

export const createAndAppendNodes = (nodeEnter: d3.Selection<SVGGElement, ExtendedD3HierarchyNode, SVGGElement, unknown>, processList: { [key: string]: InfluenceProcess[] }) => {
    nodeEnter.each(function(d) {
        console.log(`[d3Utils > createAndAppendNodes] d:`, d);
        const foreignObject = d3.select(this).append("foreignObject")
            .attr("width", 200)
            .attr("height", 150)
            .attr("x", -100)
            .attr("y", -75);

        const container = document.createElement('div');
        container.className = 'react-container';

        foreignObject.node()?.appendChild(container);
        renderReactComponent(d.data, container);
    });
};

export const curvedLine = (s: ExtendedD3HierarchyNode, d: ExtendedD3HierarchyNode): string => {
    return `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
        ${(s.y + d.y) / 2} ${d.x},
        ${d.y} ${d.x}`;
};

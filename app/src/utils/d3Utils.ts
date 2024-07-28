// utils/d3Utils.ts
import * as d3 from 'd3';
import { ExtendedD3HierarchyNode } from '@/types/d3Types';
import { renderReactComponent } from '@/components/TreeVisualizer/reactDOM';

export const createAndAppendNodes = (nodeEnter: d3.Selection<SVGGElement, ExtendedD3HierarchyNode, SVGGElement, unknown>) => {
    console.log("[createAndAppendNodes] Creating and appending nodes:", nodeEnter);
    nodeEnter.each(function(d) {
        const foreignObject = d3.select(this).append("foreignObject")
            .attr("width", 200)
            .attr("height", 150)
            .attr("x", -100)
            .attr("y", -75);

        const container = document.createElement('div');
        container.className = 'react-container';

        if (foreignObject.node()) {
        foreignObject.node()?.appendChild(container);
        console.log("[createAndAppendNodes] Created container:", container);
        console.log("[createAndAppendNodes] Rendering node `d.data`:", d.data);
        renderReactComponent(d.data, container);
        } else {
            console.error('ForeignObject node is not available.');
        }
    });
};

export const curvedLine = (s: { x: number, y: number }, d: { x: number, y: number }): string => {
    return `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
        ${(s.y + d.y) / 2} ${d.x},
        ${d.y} ${d.x}`;
};

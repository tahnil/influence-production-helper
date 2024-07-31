// utils/d3Helper/d3InitializeSVG.ts

import * as d3 from 'd3';

interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export function initializeSVG(
    containerRef: HTMLElement, 
    width: number, 
    height: number, 
    margin: Margin
) {
    const svg = d3.select(containerRef)
        .append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .call(d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
            svg.attr("transform", event.transform);
        }))
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    svg.append('g').attr('class', 'nodes');
    svg.append('g').attr('class', 'links');

    return svg;
}

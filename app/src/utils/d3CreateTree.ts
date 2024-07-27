// utils/d3CreateTree.ts
import * as d3 from 'd3';
import { ExtendedD3HierarchyNode } from '@/types/d3Types';

export const createD3Tree = (
    containerRef: React.RefObject<HTMLDivElement>,
    root: ExtendedD3HierarchyNode,
    rootRef: React.MutableRefObject<ExtendedD3HierarchyNode | null>,
    update: (source: ExtendedD3HierarchyNode) => void,
) => {
    const container = d3.select(containerRef.current);
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };

    if (!container.empty()) {
        const width = window.innerWidth - margin.left - margin.right;
        const height = window.innerHeight - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                g.attr('transform', event.transform as any);
            });

        svg.call(zoomBehavior);

        root.x0 = height / 2;
        root.y0 = 0;

        rootRef.current = root;
        update(root);
    }
};

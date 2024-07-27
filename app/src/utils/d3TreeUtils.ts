// utils/d3TreeUtils.ts
import * as d3 from 'd3';
import { HierarchyPointLink } from 'd3';
import { D3TreeNode, ExtendedD3HierarchyNode } from '../types/d3Types';
import { InfluenceProcess } from '../types/influenceTypes';
import { renderReactComponent } from '@/components/TreeVisualizer/reactDOM';

export const createAndAppendNodes = (nodeEnter: d3.Selection<SVGGElement, ExtendedD3HierarchyNode, SVGGElement, unknown>, processList: { [key: string]: InfluenceProcess[] }) => {
    nodeEnter.each(function(d) {
        const foreignObject = d3.select(this).append("foreignObject")
            .attr("width", 200)
            .attr("height", 150)
            .attr("x", -100)
            .attr("y", -75);

        const container = document.createElement('div');
        container.className = 'react-container';

        foreignObject.node()?.appendChild(container);
        renderReactComponent(d.data, container, processList);
    });
}

export const createD3Tree = (
    containerRef: React.RefObject<HTMLDivElement>,
    treeData: D3TreeNode,
    rootRef: React.MutableRefObject<ExtendedD3HierarchyNode | null>,
    update: (source: ExtendedD3HierarchyNode) => void,
    click: (event: React.MouseEvent, d: ExtendedD3HierarchyNode) => void,
    processList: { [key: string]: InfluenceProcess[] }
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

        let root: ExtendedD3HierarchyNode = d3.hierarchy<D3TreeNode>(treeData, d => {
            if ((d.type === 'product' || d.type === 'process') && Array.isArray(d.children)) {
                return d.children;
            }
            return null;
        }) as ExtendedD3HierarchyNode;

        root.x0 = height / 2;
        root.y0 = 0;

        rootRef.current = root;
        update(root);
    }
};

export const updateD3Tree = (
    source: ExtendedD3HierarchyNode,
    containerRef: React.RefObject<HTMLDivElement>,
    rootRef: React.MutableRefObject<ExtendedD3HierarchyNode | null>,
    margin: { top: number; right: number; bottom: number; left: number; },
    update: (source: ExtendedD3HierarchyNode) => void,
    click: (event: React.MouseEvent, d: ExtendedD3HierarchyNode) => void,
    processList: { [key: string]: InfluenceProcess[] }
) => {
    console.log('[function `updateD3Tree` (d3TreeUtils.ts)]\n#########\nContent of object `source`:', source);
    const container = d3.select(containerRef.current);
    const svg = container.select('svg');
    const g = svg.select('g');

    const width = window.innerWidth - margin.left - margin.right;
    const height = window.innerHeight - margin.top - margin.bottom;

    const treemap = d3.tree<D3TreeNode>().size([height, width]);
    const root = rootRef.current;
    if (!root) return;

    const treeData = treemap(root);

    // define nodes and links
    const nodes = treeData.descendants() as ExtendedD3HierarchyNode[];
    const node = g.selectAll<SVGGElement, ExtendedD3HierarchyNode>('g.node')
        .data(nodes, d => d.data.uniqueNodeId);  // Use uniqueNodeId for object constancy
    // console.log("Nodes:", nodes);

    const links = treeData.links() as Array<HierarchyPointLink<D3TreeNode>>;
    const link = g.selectAll<SVGPathElement, HierarchyPointLink<D3TreeNode>>('path.link')
        .data(links, d => d.target.data.uniqueNodeId);
    // console.log("Links:", links);

    // Handle entering and updating nodes
    const nodeEnter = node.enter().append('g')
        .classed('node', true)
        .attr('transform', d => `translate(${d.y},${d.x})`)
        .on('click', click);

    createAndAppendNodes(nodeEnter, processList);

    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.transition().duration(750).attr('transform', d => `translate(${d.y},${d.x})`);

    const nodeExit = node.exit().transition().duration(750).attr('transform', d => `translate(${source.y},${source.x})`).remove();
    nodeExit.select('circle').attr('r', 0);
    nodeExit.select('text').style('fill-opacity', 0);

    // Handling links
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

export const curvedLine = (s: ExtendedD3HierarchyNode, d: ExtendedD3HierarchyNode): string => {
    return `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
        ${(s.y + d.y) / 2} ${d.x},
        ${d.y} ${d.x}`;
};

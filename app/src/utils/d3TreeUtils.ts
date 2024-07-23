// utils/d3TreeUtils.ts
import * as d3 from 'd3';
import { D3TreeNode, ExtendedD3HierarchyNode } from '../types/d3Types';
import { InfluenceProcess } from '../types/influenceTypes';
import { renderNodeHtml } from '../components/TreeVisualizer/renderNodes';

export const createD3Tree = (
    containerRef: React.RefObject<HTMLDivElement>,
    treeData: D3TreeNode,
    rootRef: React.MutableRefObject<ExtendedD3HierarchyNode | null>,
    update: (source: ExtendedD3HierarchyNode) => void,
    click: (event: React.MouseEvent, d: ExtendedD3HierarchyNode) => void,
    onSelectProcess: (processId: string, parentId: string) => void,
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
    updateRef: React.MutableRefObject<(source: ExtendedD3HierarchyNode) => void>,
    update: (source: ExtendedD3HierarchyNode) => void,
    click: (event: React.MouseEvent, d: ExtendedD3HierarchyNode) => void,
    onSelectProcess: (processId: string, parentId: string) => void,
    processList: { [key: string]: InfluenceProcess[] }
) => {
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
    console.log("Nodes:", nodes);
    const links = treeData.links();

    const node = g.selectAll<SVGGElement, ExtendedD3HierarchyNode>('g.node')
    .data(nodes, d => d.data.uniqueNodeId);  // Use uniqueNodeId for object constancy

    const nodeEnter = node.enter().append('g')
        .classed('node', true)
        .attr('transform', d => `translate(${d.y},${d.x})`)  // Start at their actual position
        .on('click', (event, d) => {
            click(event, d);
            update(d);
        });

    nodeEnter.append('foreignObject')
        .attr('width', 200)
        .attr('height', 150)
        .attr('style', 'overflow: visible')
        .attr('x', -100)
        .attr('y', -50)
        .append('xhtml:div')
        .html(d => renderNodeHtml(d.data, onSelectProcess, processList))
        .each(function(d) { // Use D3's each function to access the DOM node
            const div = d3.select(this);
            div.selectAll('select') // Assuming <select> is the element to bind event to
              .on('change', function(event) { // Attach event listener
                const processId = event.target.value;
                console.log("Change event fired with value: " + processId);
                onSelectProcess(processId, d.data.influenceProduct.id);
              });
        });

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
        .duration(750)
        .attr('transform', d => `translate(${d.y},${d.x})`);

    const nodeExit = node.exit().transition()
        .duration(750)
        .attr('transform', d => `translate(${source.y},${source.x})`)
        .remove();

    nodeExit.select('circle').attr('r', 1e-6);
    nodeExit.select('text').style('fill-opacity', 1e-6);

    const link = g.selectAll<SVGPathElement, ExtendedD3HierarchyNode>('path.link')
        .data(links, d => d.target.data.uniqueNodeId);

    const linkEnter = link.enter().insert('path', 'g')
        .classed('link', true)
        .attr('d', d => curvedLine(d.source, d.target))
        .style('fill', 'none')
        .style('stroke', 'steelblue')
        .style('stroke-width', '2px');

    link.merge(linkEnter).transition().duration(750)
        .attr('d', d => curvedLine(d.source, d.target));

    link.exit().transition().duration(750).remove();

    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
    // Format numbers in the node cards after updates
    svg.selectAll('.number-format').each(function () {
        const element = d3.select(this);
        const value = element.attr('data-value');
        if (value) {
            element.text(new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(parseFloat(value)));
        }
    });
};

export const curvedLine = (source, target) => {
    return `M ${source.y} ${source.x}
            C ${(source.y + target.y) / 2} ${source.x},
              ${(source.y + target.y) / 2} ${target.x},
              ${target.y} ${target.x}`;
};

export const collapse = (d: ExtendedD3HierarchyNode): void => {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = undefined;
    }
};

// d3TreeUtils.ts
import * as d3 from 'd3';
import { D3TreeNode, ExtendedD3HierarchyNode, ProcessNode, ProductNode, SideProductNode } from '../types/d3Types';

export const createD3Tree = (
    containerRef: React.RefObject<HTMLDivElement>, 
    treeData: D3TreeNode, 
    rootRef: React.MutableRefObject<ExtendedD3HierarchyNode | null>,
    iRef: React.MutableRefObject<number>,
    update: (source: ExtendedD3HierarchyNode) => void,
    click: (event: React.MouseEvent, d: ExtendedD3HierarchyNode) => void
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

        root.each((d: ExtendedD3HierarchyNode) => {
            d._id = ++iRef.current;
        });

        root.children?.forEach(d => collapse(d));

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
    click: (event: React.MouseEvent, d: ExtendedD3HierarchyNode) => void
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
    const links = treeData.descendants().slice(1) as ExtendedD3HierarchyNode[];
    nodes.forEach(d => d.y = d.depth * 180);

    const node = g.selectAll<SVGGElement, ExtendedD3HierarchyNode>('g.node')
        .data(nodes, d => d._id);

    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.y0},${source.x0})`);

    nodeEnter.append('foreignObject')
        .attr('width', 1)
        .attr('height', 1)
        .attr('style', 'overflow: visible')
        .attr('x', -100)
        .attr('y', -50)
        .append('xhtml:div')
        .on('click', (event, d) => click(event as unknown as React.MouseEvent, d))
        .html(d => nodeHtml(d.data));

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
        .data(links, d => d._id);

    const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
            const o = { x: source.x0, y: source.y0, x0: source.x0, y0: source.y0, _id: source._id, data: source.data, depth: source.depth, height: source.height, parent: source.parent } as ExtendedD3HierarchyNode;
            return curvedLine(o, o);
        })
        .style('fill', 'none')
        .style('stroke', 'steelblue')
        .style('stroke-width', '2px');

    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
        .duration(750)
        .attr('d', d => curvedLine(d, d.parent as ExtendedD3HierarchyNode));

    const linkExit = link.exit().transition()
        .duration(750)
        .attr('d', d => {
            const o = { x: source.x, y: source.y, x0: source.x0, y0: source.y0, _id: source._id, data: source.data, depth: source.depth, height: source.height, parent: source.parent } as ExtendedD3HierarchyNode;
            return curvedLine(o, o);
        })
        .remove();

    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Format numbers in the node cards
    d3.selectAll('.number-format').each(function() {
        const element = d3.select(this);
        const value = element.attr('data-value');
        if (value) {
            element.text(new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(value)));
        }
    });
};

export const curvedLine = (s: ExtendedD3HierarchyNode, d: ExtendedD3HierarchyNode): string => {
    return `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
        ${(s.y + d.y) / 2} ${d.x},
        ${d.y} ${d.x}`;
};

export const nodeHtml = (data: D3TreeNode): string => {
    switch (data.type) {
        case 'product':
            const productNode = data as ProductNode;
            return `
                <div class="border rounded-md p-2 bg-white shadow text-sm w-44">
                    <div>PRODUCT</div>
                    <div><strong>${productNode.name}</strong></div>
                    <div>Type: ${productNode.type}</div>
                    <div>Weight: <span class="number-format" data-value="${productNode.influenceProduct.massKilogramsPerUnit}"></span> kg</div>
                    <div>Volume: <span class="number-format" data-value="${productNode.influenceProduct.volumeLitersPerUnit}"></span> L</div>
                    <div>Units: <span class="number-format" data-value="${productNode.amount}"></span></div>
                    <div>Total Weight: <span class="number-format" data-value="${productNode.totalWeight}"></span> kg</div>
                    <div>Total Volume: <span class="number-format" data-value="${productNode.totalVolume}"></span> L</div>
                </div>
            `;
        case 'process':
            const processNode = data as ProcessNode;
            return `
                <div class="border rounded-md p-2 bg-white shadow text-sm w-44">
                    <div>PROCESS</div>
                    <div><strong>${processNode.name}</strong></div>
                    <div>Building: ${processNode.influenceProcess.buildingId}</div>
                    <div>Duration: <span class="number-format" data-value="${processNode.totalDuration}"></span> hours</div>
                    <div>SRs: <span class="number-format" data-value="${processNode.totalRuns}"></span></div>
                </div>
            `;
        case 'sideProduct':
            const sideProductNode = data as SideProductNode;
            return `
                <div class="border rounded-md p-2 bg-white shadow text-sm w-44">
                    <div>SIDE PRODUCT</div>
                    <div><strong>${sideProductNode.name}</strong></div>
                    <div>Type: ${sideProductNode.type}</div>
                    <div>Weight: <span class="number-format" data-value="${sideProductNode.influenceProduct.massKilogramsPerUnit}"></span> kg</div>
                    <div>Volume: <span class="number-format" data-value="${sideProductNode.influenceProduct.volumeLitersPerUnit}"></span> L</div>
                    <div>Units: <span class="number-format" data-value="${sideProductNode.amount}"></span></div>
                    <div>Total Weight: <span class="number-format" data-value="${sideProductNode.totalWeight}"></span> kg</div>
                    <div>Total Volume: <span class="number-format" data-value="${sideProductNode.totalVolume}"></span> L</div>
                </div>
            `;
        default:
            return `<div class="card unknown-node">Unknown Node Type</div>`;
    }
};

export const collapse = (d: ExtendedD3HierarchyNode): void => {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = undefined;
    }
};

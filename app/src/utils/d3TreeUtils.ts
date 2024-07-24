// utils/d3TreeUtils.ts
import * as d3 from 'd3';
import { HierarchyPointLink } from 'd3';
import { D3TreeNode, ExtendedD3HierarchyNode } from '../types/d3Types';
import { InfluenceProcess } from '../types/influenceTypes';
import { renderNodeHtml } from '../components/TreeVisualizer/renderNodes';

export const createD3Tree = (
    containerRef: React.RefObject<HTMLDivElement>,
    treeData: D3TreeNode,
    rootRef: React.MutableRefObject<ExtendedD3HierarchyNode | null>,
    update: (source: ExtendedD3HierarchyNode) => void,
    click: (event: React.MouseEvent, d: ExtendedD3HierarchyNode) => void,
    handleProcessSelection: (processId: string, parentId: string, source: ExtendedD3HierarchyNode) => void,
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
    handleProcessSelection: (processId: string, parentId: string, source: ExtendedD3HierarchyNode) => void,
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
    
    // ####### Entering Elements #########
    const nodeEnter = node.enter().append('g')
        .classed('node', true)
        .attr('transform', d => {
            const startY = d.parent ? d.parent.y : source.y;
            const startX = d.parent ? d.parent.x : source.x;
            return `translate(${source.y},${source.x})`  // Start at their actual position
        })
        .on('click', (event, d) => {
            click(event, d);
            update(d);
        });
    
    // inject our Product and Process node cards into diagram
    nodeEnter.append('foreignObject')
        .attr('width', 200)
        .attr('height', 150)
        .attr('style', 'overflow: visible')
        .attr('x', -100)
        .attr('y', -50)
        .append('xhtml:div')
        .html(d => renderNodeHtml(d.data, handleProcessSelection, processList))
        .each(function(d) { // Use D3's each function to access the DOM node
            const div = d3.select(this);
            if (d.data.type === 'product') {
                div.selectAll('select') // Assuming <select> is the element to bind event to
                .on('change', function(event) { // Attach event listener
                  const processId = event.target.value;
                  console.log(`[nodeEnter.append('foreignObject'):\n##########\nChange event fired with value `, processId, `\n\nSource node: `, source.data.name,`\n\nHanding over Source: `, source, `\n\nAnd this is the content of 'd':`, d,`\nCalling handleProcessSelection.`);
                  handleProcessSelection(processId, d.data.influenceProduct.id, d);
                });
            }
        });

    const linkEnter = link.enter().insert('path', 'g')
        .classed('link', true)
        .attr('d', d => {
            const o = { 
                x: source.x0, 
                y: source.y0, 
                x0: source.x0, 
                y0: source.y0, 
                _id: source._id, 
                data: source.data, 
                depth: source.depth, 
                height: source.height, 
                parent: source.parent 
            } as ExtendedD3HierarchyNode;
            return curvedLine(o, o);
        })
        .style('fill', 'none')
        .style('stroke', 'steelblue')
        .style('stroke-width', '2px');
    
    // update the 'd' attribute of all link objects in the diagram
    // the 'd' attribute describes the path data for the link
    // 'source' is the source node of the link
    // 'target' is the target node of the link
    link.merge(linkEnter).transition().duration(5000)
        .attr('d', d => curvedLine(d.source, d.target));

    
    // ####### Updating Elements #########
    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
        .duration(5000)
        .attr('transform', d => `translate(${d.y},${d.x})`);

    // ####### Exiting Elements #########
    const nodeExit = node.exit().transition()
        .duration(5000)
        .attr('transform', d => {
            const endY = d.parent ? d.parent.y : source.y;
            const endX = d.parent ? d.parent.x : source.x;
            return `translate(${endY},${endX})`
        })
        .remove();

    nodeExit.select('circle').attr('r', 1e-6);
    nodeExit.select('text').style('fill-opacity', 1e-6);

    link.exit().transition()
        .duration(5000)
        .attr('d', d => {
            const o = { 
                x: source.x, 
                y: source.y, 
                x0: source.x0, 
                y0: source.y0, 
                _id: source._id, 
                data: source.data, 
                depth: source.depth, 
                height: source.height, 
                parent: source.parent 
            } as ExtendedD3HierarchyNode;
            return curvedLine(o, o);
        })
        .remove();

    // store the current position of nodes as their 
    // "previous" position once the transition completes 
    // at the end of the diagram update
    // for consistency across transitions
    // smooth animations and as reference point for debugging
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

export const curvedLine = (s: ExtendedD3HierarchyNode, d: ExtendedD3HierarchyNode): string => {
    return `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
        ${(s.y + d.y) / 2} ${d.x},
        ${d.y} ${d.x}`;
};

export const collapse = (d: ExtendedD3HierarchyNode): void => {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = undefined;
    }
};

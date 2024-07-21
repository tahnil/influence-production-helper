import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { D3TreeNode, ProductNode, ProcessNode, SideProductNode } from '../types/d3Types';
import styles from './TreeVisualizer.module.css';

interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface ExtendedD3HierarchyNode extends d3.HierarchyPointNode<D3TreeNode> {
    x0: number;
    y0: number;
    _children?: this[];
    _id: number;
}

const TreeVisualizer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const updateRef = useRef<(source: ExtendedD3HierarchyNode) => void>();
    const iRef = useRef(0);
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
    const [treeData, setTreeData] = useState<D3TreeNode | null>(null);

    const margin: Margin = { top: 20, right: 90, bottom: 30, left: 90 };

    const collapse = useCallback((d: ExtendedD3HierarchyNode): void => {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = undefined;
        }
    }, []);

    // we may need this later, once we introduce dynamic tree manipulation
    // const addNewNode = useCallback((event: React.MouseEvent, d: ExtendedD3HierarchyNode): void => {
    //     event.stopPropagation();

    //     const newNodeData: TreeNode = { name: `New Node ${d.data.children ? d.data.children.length + 1 : 1}`, type: 'product' };
    //     const newNode: ExtendedD3HierarchyNode = {
    //         data: newNodeData,
    //         height: 0,
    //         depth: d.depth + 1,
    //         parent: d,
    //         _id: ++iRef.current,
    //         x0: d.x,
    //         y0: d.y
    //     } as ExtendedD3HierarchyNode;

    //     if (d.children) {
    //         d.children.push(newNode);
    //         d.data.children?.push(newNodeData);
    //     } else if (d._children) {
    //         d._children.push(newNode);
    //         d.data.children?.push(newNodeData);
    //     } else {
    //         d.children = [newNode];
    //         d.data.children = [newNodeData];
    //     }

    //     updateRef.current?.(d);
    // }, []);

    const curvedLine = useCallback((s: ExtendedD3HierarchyNode, d: ExtendedD3HierarchyNode): string => {
        return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
            ${(s.y + d.y) / 2} ${d.x},
            ${d.y} ${d.x}`;
    }, []);

    const click = useCallback((event: React.MouseEvent, d: ExtendedD3HierarchyNode): void => {
        if (d.children) {
            d._children = d.children;
            d.children = undefined;
        } else {
            d.children = d._children;
            d._children = undefined;
        }
        updateRef.current?.(d);
    }, []);

    function updateForeignObjectSize(foreignObject: d3.Selection<SVGForeignObjectElement, ExtendedD3HierarchyNode, SVGGElement, unknown>) {
        foreignObject.each(function () {
            const bbox = (this.firstChild as HTMLElement).getBoundingClientRect();
            d3.select(this)
                .attr("width", bbox.width)
                .attr("height", bbox.height)
                .attr("x", -bbox.width / 2)
                .attr("y", -bbox.height / 2);
        });
    }
    
    const update = useCallback((source: ExtendedD3HierarchyNode): void => {
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
            .attr('width', 200)
            .attr('height', 200)
            .attr('x', -100)
            .attr('y', -50)
            .append('xhtml:div')
            .on('click', (event, d) => click(event, d))
            .html(d => {
                switch (d.data.type) {
                    case 'product':
                        const productNode = d.data as ProductNode;
                        return `
                            <div class="card product-node">
                                <div>PRODUCT</div>
                                <div><strong>${productNode.name}</strong></div>
                                <div>Type: ${productNode.type}</div>
                                <div>Weight: ${productNode.influenceProduct.massKilogramsPerUnit || 0} kg</div>
                                <div>Volume: ${productNode.influenceProduct.volumeLitersPerUnit || 0} L</div>
                                <div>Units: ${productNode.amount || 0}</div>
                                <div>Total Weight: ${(productNode.totalWeight || 0).toFixed(2)} kg</div>
                                <div>Total Volume: ${(productNode.totalVolume || 0).toFixed(2)} L</div>
                            </div>
                        `;
                    case 'process':
                        const processNode = d.data as ProcessNode;
                        return `
                            <div class="card process-node">
                                <div>PROCESS</div>
                                <div><strong>${processNode.name}</strong></div>
                                <div>Building: ${processNode.influenceProcess.buildingId}</div>
                                <div>Duration: ${(processNode.totalDuration || 0).toFixed(2)} hours</div>
                                <div>SRs: ${processNode.totalRuns || 0}</div>
                            </div>
                        `;
                    case 'sideProduct':
                        const sideProductNode = d.data as SideProductNode;
                        return `
                            <div class="card side-product-node">
                                <div>SIDE PRODUCT</div>
                                <div><strong>${sideProductNode.name}</strong></div>
                                <div>Type: ${sideProductNode.type}</div>
                                <div>Weight: ${sideProductNode.influenceProduct.massKilogramsPerUnit || 0} kg</div>
                                <div>Volume: ${sideProductNode.influenceProduct.volumeLitersPerUnit || 0} L</div>
                                <div>Units: ${sideProductNode.amount || 0}</div>
                                <div>Total Weight: ${(sideProductNode.totalWeight || 0).toFixed(2)} kg</div>
                                <div>Total Volume: ${(sideProductNode.totalVolume || 0).toFixed(2)} L</div>
                            </div>
                        `;
                    default:
                        return `<div class="card unknown-node">Unknown Node Type</div>`;
                }
            })
            .each(function (d) {
                if (this instanceof Element && this.parentNode instanceof SVGForeignObjectElement) {
                    const parent = this.parentNode as SVGForeignObjectElement;
                    const foreignObject = d3.select<SVGForeignObjectElement, ExtendedD3HierarchyNode>(parent);
                    updateForeignObjectSize(foreignObject);
                }
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

        // Update foreignObject sizes after updating nodes
        updateForeignObjectSize(nodeUpdate.selectAll<SVGForeignObjectElement, ExtendedD3HierarchyNode>('foreignObject'));
    }, [curvedLine, click, margin]);

    updateRef.current = update;

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/api/configureProductionChainDynamic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ product: 'Cement', amount: 200000 }),
            });
            const data = await response.json();
            setTreeData(data);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (treeData) {
            const container = d3.select(containerRef.current);
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

                root.children?.forEach(collapse);

                rootRef.current = root;
                update(root);
            }
        }
    }, [treeData, collapse, update, margin]);

    return (
        <div id="tree-container" ref={containerRef}></div>
    );
};

export default TreeVisualizer;

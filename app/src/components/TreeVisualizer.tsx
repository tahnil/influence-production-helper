import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';

interface TreeNode {
    name: string;
    type: 'product' | 'process';
    amount?: number;
    massKilogramsPerUnit?: number;
    volumeLitersPerUnit?: number;
    totalWeight?: number;
    totalVolume?: number;
    buildingId?: string;
    mAdalianHoursPerSR?: number;
    SR?: number;
    children?: TreeNode[];
    _children?: TreeNode[];
}

interface TreeData {
    name: string;
    type: 'product' | 'process';
    children?: TreeNode[];
}

interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface ExtendedD3HierarchyNode extends d3.HierarchyPointNode<TreeNode> {
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
    const [treeData, setTreeData] = useState<TreeData | null>(null);

    const margin: Margin = { top: 20, right: 90, bottom: 30, left: 90 };

    const collapse = useCallback((d: ExtendedD3HierarchyNode): void => {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = undefined;
        }
    }, []);

    const addNewNode = useCallback((event: React.MouseEvent, d: ExtendedD3HierarchyNode): void => {
        event.stopPropagation();

        const newNodeData: TreeNode = { name: `New Node ${d.data.children ? d.data.children.length + 1 : 1}`, type: 'product' };
        const newNode: ExtendedD3HierarchyNode = {
            data: newNodeData,
            height: 0,
            depth: d.depth + 1,
            parent: d,
            _id: ++iRef.current,
            x0: d.x,
            y0: d.y
        } as ExtendedD3HierarchyNode;

        if (d.children) {
            d.children.push(newNode);
            d.data.children?.push(newNodeData);
        } else if (d._children) {
            d._children.push(newNode);
            d.data.children?.push(newNodeData);
        } else {
            d.children = [newNode];
            d.data.children = [newNodeData];
        }

        updateRef.current?.(d);
    }, []);

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

    const update = useCallback((source: ExtendedD3HierarchyNode): void => {
        const container = d3.select(containerRef.current);
        const svg = container.select('svg');
        const g = svg.select('g');

        const width = window.innerWidth - margin.left - margin.right;
        const height = window.innerHeight - margin.top - margin.bottom;

        const treemap = d3.tree<TreeNode>().size([height, width]);
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
            .attr('height', 100)
            .attr('x', -100)
            .attr('y', -50)
            .append('xhtml:div')
            .on('click', (event, d) => click(event, d))
            .html(d => {
                if (d.data.type === 'product') {
                    return `
                        <div class="card product-node">
                            <div><strong>${d.data.name}</strong></div>
                            <div>Type: ${d.data.type}</div>
                            <div>Weight: ${d.data.massKilogramsPerUnit || 0} kg</div>
                            <div>Volume: ${d.data.volumeLitersPerUnit || 0} L</div>
                            <div>Units: ${d.data.amount || 0}</div>
                            <div>Total Weight: ${(d.data.totalWeight || 0).toFixed(2)} kg</div>
                            <div>Total Volume: ${(d.data.totalVolume || 0).toFixed(2)} L</div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="card process-node">
                            <div><strong>${d.data.name}</strong></div>
                            <div>Building: ${d.data.buildingId}</div>
                            <div>Duration: ${(d.data.mAdalianHoursPerSR || 0) * (d.data.SR || 0)} hours</div>
                            <div>SRs: ${d.data.SR || 0}</div>
                        </div>
                    `;
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
    }, [curvedLine, margin]);

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

                let root: ExtendedD3HierarchyNode = d3.hierarchy<TreeNode>(treeData, d => d.children) as ExtendedD3HierarchyNode;
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

import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';

interface TreeNode {
    name: string;
    children?: TreeNode[];
    _children?: TreeNode[];
}

interface TreeData {
    name: string;
    children: TreeNode[];
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
    const iRef = useRef(0); // useRef to keep track of i across re-renders
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null); // useRef to store the root node

    const margin: Margin = { top: 20, right: 90, bottom: 30, left: 90 };

    const collapse = useCallback((d: ExtendedD3HierarchyNode): void => {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = undefined; // Use undefined instead of null
        }
    }, []);

    const addNewNode = useCallback((event: React.MouseEvent, d: ExtendedD3HierarchyNode): void => {
        event.stopPropagation();

        const newNodeData: TreeNode = { name: `New Node ${d.data.children ? d.data.children.length + 1 : 1}` };
        const newNode: ExtendedD3HierarchyNode = {
            data: newNodeData,
            height: 0,
            depth: d.depth + 1,
            parent: d,
            _id: ++iRef.current, // Assign a unique id to the new node
            x0: d.x,
            y0: d.y
        } as ExtendedD3HierarchyNode;

        if (d.children && d.children.length > 0) {
            d.children.push(newNode);
            if (d.data.children) {
                d.data.children.push(newNodeData);
            } else {
                d.data.children = [newNodeData];
            }
        } else if (d._children) {
            d._children.push(newNode);
            if (d.data.children) {
                d.data.children.push(newNodeData);
            } else {
                d.data.children = [newNodeData];
            }
        } else {
            d.children = [newNode];
            d.data.children = [newNodeData];
        }

        console.log("Added new node:", newNode);
        updateRef.current?.(d);
    }, []);

    const straightLine = useCallback((s: ExtendedD3HierarchyNode, d: ExtendedD3HierarchyNode): string => {
        return `M ${s.y} ${s.x} L ${d.y} ${d.x}`;
    }, []);

    const click = useCallback((event: React.MouseEvent, d: ExtendedD3HierarchyNode): void => {
        if (d.children) {
            d._children = d.children;
            d.children = undefined; // Use undefined instead of null
        } else {
            d.children = d._children;
            d._children = undefined;
        }
        console.log("Node clicked:", d);
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
        if (!root) return; // Ensure root is defined

        const treeData = treemap(root);
        const nodes = treeData.descendants() as ExtendedD3HierarchyNode[];
        const links = treeData.descendants().slice(1) as ExtendedD3HierarchyNode[];
        nodes.forEach(d => d.y = d.depth * 180);

        console.log("Updating tree:");
        console.log("Nodes:", nodes);
        console.log("Links:", links);

        const node = g.selectAll<SVGGElement, ExtendedD3HierarchyNode>('g.node')
            .data(nodes, d => d._id);

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${source.y0},${source.x0})`);

        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
            .on('click', (event, d) => click(event, d));

        nodeEnter.append('text')
            .attr('dy', '.35em')
            .attr('x', d => (d.children || d._children) ? -13 : 13)
            .attr('text-anchor', d => (d.children || d._children) ? 'end' : 'start')
            .text(d => d.data.name);

        nodeEnter.append('text')
            .attr('x', 20)
            .attr('y', 3)
            .text('+')
            .style('cursor', 'pointer')
            .on('click', (event, d) => addNewNode(event, d));

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(750)
            .attr('transform', d => `translate(${d.y},${d.x})`);

        nodeUpdate.select('circle.node')
            .attr('r', 10)
            .style('fill', d => d._children ? 'lightsteelblue' : '#333')
            .attr('cursor', 'pointer');

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
                return straightLine(o, o);
            })
            .style('fill', 'none')
            .style('stroke', 'steelblue')  // Set your desired color here
            .style('stroke-width', '2px');

        const linkUpdate = linkEnter.merge(link);

        linkUpdate.transition()
            .duration(750)
            .attr('d', d => straightLine(d, d.parent as ExtendedD3HierarchyNode));

        const linkExit = link.exit().transition()
            .duration(750)
            .attr('d', d => {
                const o = { x: source.x, y: source.y, x0: source.x0, y0: source.y0, _id: source._id, data: source.data, depth: source.depth, height: source.height, parent: source.parent } as ExtendedD3HierarchyNode;
                return straightLine(o, o);
            })
            .remove();

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }, [straightLine, click, addNewNode, margin]);

    updateRef.current = update;

    useEffect(() => {
        const treeData: TreeData = {
            name: 'Top Level',
            children: [
                {
                    name: 'Level 2: A',
                    children: [
                        { name: 'Son of A' },
                        { name: 'Daughter of A' }
                    ]
                },
                { name: 'Level 2: B' }
            ]
        };

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

            rootRef.current = root; // Set the root ref
            update(root);
        }
    }, [collapse, update, margin]);

    return (
        <div id="tree-container" ref={containerRef}></div>
    );
};

export default TreeVisualizer;

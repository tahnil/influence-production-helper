// utils/d3Tree.ts

import * as d3 from 'd3';
import { D3TreeNode } from '@/types/d3Types';

// Function to render the D3 tree
export const renderD3Tree = (
    container: HTMLDivElement,
    rootData: D3TreeNode,
    rootRef: React.MutableRefObject<d3.HierarchyPointNode<D3TreeNode> | null>,
    updateRef: React.MutableRefObject<(source: d3.HierarchyPointNode<D3TreeNode> | null) => void>
) => {
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy(rootData);
    const treeLayout = d3.tree().size([height, width]);
    treeLayout(root);

    const nodes = root.descendants();
    const links = root.links();

    // Add links
    svg.selectAll('path.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    // Add nodes
    const node = svg.selectAll('g.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    node.append('circle')
        .attr('r', 10);

    node.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children ? -13 : 13)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name);

    updateRef.current = (source: d3.HierarchyPointNode<D3TreeNode> | null) => {
        if (!source) return;

        const updatedNodes = root.descendants();
        const updatedLinks = root.links();

        // Update links
        svg.selectAll('path.link')
            .data(updatedLinks)
            .join('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        // Update nodes
        const updatedNode = svg.selectAll('g.node')
            .data(updatedNodes)
            .join('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y},${d.x})`);

        updatedNode.select('circle')
            .attr('r', 10);

        updatedNode.select('text')
            .attr('dy', '.35em')
            .attr('x', d => d.children ? -13 : 13)
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.name);
    };

    rootRef.current = root;
};

// Function to inject foreign objects into the D3 nodes
export const injectForeignObjects = (
    container: HTMLDivElement,
    rootRef: React.MutableRefObject<d3.HierarchyPointNode<D3TreeNode> | null>,
    setTreeData: React.Dispatch<React.SetStateAction<D3TreeNode | null>>
) => {
    const svg = d3.select(container).select('svg g');
    const nodeSelection = svg.selectAll<SVGGElement, d3.HierarchyPointNode<D3TreeNode>>('g.node');

    nodeSelection.each(function (d) {
        const nodeElement = d3.select(this);
        nodeElement.selectAll('foreignObject').remove();

        const foreignObject = nodeElement.append('foreignObject')
            .attr('width', 100)
            .attr('height', 50)
            .append('xhtml:div')
            .html('<select><option>Process 1</option><option>Process 2</option></select>');

        foreignObject.select('select').on('change', function () {
            const selectedProcess = (this as HTMLSelectElement).value;
            const processNode: D3TreeNode = {
                id: `process-${selectedProcess}`,
                name: selectedProcess,
                nodeType: 'process',
                totalDuration: 0,
                totalRuns: 0,
                children: [],
                sideProducts: []
            };
            if (d.data.children) {
                d.data.children.push(processNode);
    } else {
                d.data.children = [processNode];
            }
            setTreeData({ ...rootRef.current!.data });
        });
    });
};

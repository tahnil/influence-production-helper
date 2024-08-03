// utils/d3Tree.ts

import * as d3 from 'd3';
import { D3TreeNode, ProcessNode, ProductNode } from '@/types/d3Types';

// Function to clear the existing D3 tree
export const clearD3Tree = (container: HTMLDivElement) => {
    d3.select(container).selectAll('*').remove();
};

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
        if (d.data.nodeType === 'product') {
            console.log('[injectForeignObjects] Injecting foreignObject for product node:', d);

        const nodeElement = d3.select(this);
        nodeElement.selectAll('foreignObject').remove();

        const foreignObject = nodeElement.append('foreignObject')
                .attr('width', 200)
            .attr('height', 50)
                .attr('x', -100) // Adjust positioning as necessary
                .attr('y', -25) // Adjust positioning as necessary
            .append('xhtml:div')
                .html(d => {
                    const productNode = d.data as ProductNode;
                    console.log('[injectForeignObjects] Rendering process options for node:', productNode);
                    return `
                <div style="background-color: white; border: 1px solid black; border-radius: 5px; padding: 5px;">
                        <label for="process-select-${productNode.id}">Select Process:</label>
                        <select id="process-select-${productNode.id}" name="process-select">
                            ${productNode.processes.map(process => `<option value="${process.id}">${process.name}</option>`).join('')}
                    </select>
                </div>
                `;
                });

        foreignObject.select('select').on('change', function () {
                const selectedProcessId = (this as HTMLSelectElement).value;
                const productNode = d.data as ProductNode;
                const selectedProcess = productNode.processes.find(p => p.id === selectedProcessId);

                if (!selectedProcess) {
                    console.error('[injectForeignObjects] Selected process not found:', selectedProcessId);
                    return;
                }

                const processNode: ProcessNode = {
                    id: `process-${selectedProcess.id}`,
                    name: selectedProcess.name,
                nodeType: 'process',
                totalDuration: 0,
                totalRuns: 0,
                    children: selectedProcess.inputs.map(input => ({
                        id: input.productId,
                        name: input.productId, // Replace with actual product name if available
                        nodeType: 'product',
                        productData: { id: input.productId, name: input.productId, category: '', massKilogramsPerUnit: '', type: '', volumeLitersPerUnit: '' }, // Replace with actual product data if available
                        amount: 0,
                        totalWeight: 0,
                        totalVolume: 0,
                children: [],
                        processes: []
                    })),
                sideProducts: []
            };

                if (productNode.children) {
                    productNode.children.push(processNode);
    } else {
                    productNode.children = [processNode];
            }

                console.log('[injectForeignObjects] Updated tree data with new process node:', rootRef.current!.data);
            setTreeData({ ...rootRef.current!.data });
        });
        } else {
            console.log('[injectForeignObjects] Skipping non-product node:', d);
        }
    });
};

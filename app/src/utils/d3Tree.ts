// utils/d3Tree.ts
// 
// — clearD3Tree: Removes all elements within the D3 container.
// — renderD3Tree: Initializes the D3 tree with the root node and renders nodes and links.
// — injectForeignObjects: Injects interactive elements (process selection dropdowns) into 
//    the D3 nodes and handles process selection changes.

import * as d3 from 'd3';
import { D3TreeNode, ProcessNode, ProductNode } from '@/types/d3Types';
import { MutableRefObject } from 'react';

// Function to clear the existing D3 tree
export const clearD3Tree = (container: HTMLDivElement) => {
    d3.select(container).selectAll('*').remove();
};

// Custom link generator function to create Bezier curves
const bezierCurveGenerator = (d: d3.HierarchyPointLink<D3TreeNode>) => {
    const path = d3.path();
    path.moveTo(d.source.y, d.source.x);
    path.bezierCurveTo(
        (d.source.y + d.target.y) / 2, d.source.x,
        (d.source.y + d.target.y) / 2, d.target.x,
        d.target.y, d.target.x
    );
    return path.toString();
};

// Function to render the D3 tree
export const renderD3Tree = (
    container: HTMLDivElement,
    rootData: D3TreeNode,
    rootRef: MutableRefObject<d3.HierarchyPointNode<D3TreeNode> | null>,
    updateRef: MutableRefObject<(source: d3.HierarchyPointNode<D3TreeNode> | null) => void>,
    previousTransform: d3.ZoomTransform | null,
    setPreviousTransform: (transform: d3.ZoomTransform) => void
) => {
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = viewportWidth - margin.left - margin.right;
    const height = viewportHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', viewportWidth)
        .attr('height', viewportHeight)
        .call(d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
            svg.attr("transform", event.transform.toString());
            setPreviousTransform(event.transform);
        }))
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy(rootData);

    // Define the size of each node
    const nodeWidth = 240;
    const nodeHeight = 140;

    // Set the node size for the tree layout
    const treeLayout = d3.tree<D3TreeNode>()
        .nodeSize([nodeHeight, nodeWidth]);

    treeLayout(root);

    const nodes = root.descendants();
    const links = root.links();

    // Add links    
    svg.selectAll('path.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', bezierCurveGenerator)
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('fill', 'none');

    // Add nodes
    const node = svg.selectAll('g.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    node.append('circle')
        .attr('r', 10);

    updateRef.current = (source: d3.HierarchyPointNode<D3TreeNode> | null) => {
        if (!source) return;

        const updatedNodes = root.descendants();
        const updatedLinks = root.links();

        // Update links
        svg.selectAll('path.link')
            .data(updatedLinks)
            .join('path')
            .attr('class', 'link')
            .attr('d', bezierCurveGenerator)
            .style('stroke', 'black')
            .style('stroke-width', '1px')
            .style('fill', 'none');

        // Update nodes
        const updatedNode = svg.selectAll('g.node')
            .data(updatedNodes)
            .join('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y},${d.x})`);

        updatedNode.select('circle')
            .attr('r', 10);
    };

    if (previousTransform) {
        svg.attr("transform", previousTransform.toString());
        d3.select(container).select('svg').call(d3.zoom<SVGSVGElement, unknown>().transform, previousTransform as any);
    }

    rootRef.current = root;
};

// Function to inject foreign objects into the D3 nodes
export const injectForeignObjects = (
    container: HTMLDivElement,
    rootRef: React.MutableRefObject<d3.HierarchyPointNode<D3TreeNode> | null>,
    buildProcessNodeCallback: (selectedProcessId: string | null, parentNode: D3TreeNode) => Promise<void>
) => {
    const svg = d3.select(container).select('svg g');
    const nodeSelection = svg.selectAll<SVGGElement, d3.HierarchyPointNode<D3TreeNode>>('g.node');

    nodeSelection.each(function (d) {
        console.log('[injectForeignObjects] Injecting foreignObject for product node:', d);

        const nodeElement = d3.select(this);
        nodeElement.selectAll('foreignObject').remove();

        // Ensure foreign object is placed correctly within the node
        const foreignObjectWidth = 220;
        const foreignObjectHeight = 120;

        const foreignObject = nodeElement.append('foreignObject')
            .attr('width', foreignObjectWidth)
            .attr('height', foreignObjectHeight)
            .attr('x', -foreignObjectWidth / 2) // Center the foreign object
            .attr('y', -foreignObjectHeight / 2) // Center the foreign object
            .style('overflow', 'visible')
            .append('xhtml:div')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('background-color', 'white')
            .style('border', '1px solid black')
            .style('border-radius', '5px')
            .style('padding', '5px')
            .style('overflow', 'visible');

        foreignObject.html(d => {
            const nodeName = `<div style="font-weight: bold; margin-bottom: 5px;">${d.data.name}</div>`;
            let additionalHtml = '';

            if (d.data.nodeType === 'product') {
                const productNode = d.data as ProductNode;
                console.log('[injectForeignObjects] Rendering process options for node:', productNode);
                additionalHtml = `
                        <label for="process-select-${productNode.id}">Select Process:</label>
                        <select style="width: 100%" id="process-select-${productNode.id}" name="process-select">
                                <option value="">-- Select a Process --</option>
                            ${productNode.processes.map(process => `<option value="${process.id}">${process.name}</option>`).join('')}
                    </select>
                `;
            } else if (d.data.nodeType === 'process') {
                const processNode = d.data as ProcessNode;
                additionalHtml = `
                    <div>Total Duration: ${processNode.totalDuration}</div>
                    <div>Total Runs: ${processNode.totalRuns}</div>
                `;
            }

            return nodeName + additionalHtml;
        });

        if (d.data.nodeType === 'product') {
            const productNode = d.data as ProductNode;
            foreignObject.select('select').on('change', async function () {
                const selectedProcessId = (this as HTMLSelectElement).value;
                try {
                    if (selectedProcessId) {
                        await buildProcessNodeCallback(selectedProcessId, d.data);
                    }
                } catch (err) {
                    console.error('[injectForeignObjects] Failed to build process node:', err);
                }
            });
        } else {
            console.log('[injectForeignObjects] Skipping non-product node:', d);
        }
    });
};
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

// Initialize the D3 tree
export const initializeD3Tree = (
    container: HTMLDivElement,
    rootData: D3TreeNode,
    rootRef: MutableRefObject<d3.HierarchyPointNode<D3TreeNode> | null>,
    updateRef: MutableRefObject<(source: d3.HierarchyPointNode<D3TreeNode> | null) => void>,
    setTransform: (transform: d3.ZoomTransform) => void,
    previousTransform?: d3.ZoomTransform
) => {
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // const width = viewportWidth - margin.left - margin.right;
    // const height = viewportHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', viewportWidth)
        .attr('height', viewportHeight);

    const g = svg.append('g')
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

    // Add links first to ensure they are rendered behind the nodes
    const linkGroup = g.append('g').attr('class', 'links');
    linkGroup.selectAll('path.link')
        .data(links, d => d.target.id as string)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', bezierCurveGenerator)
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('fill', 'none');

    // Add nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll('g.node')
        .data(nodes, d => d.id as string)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    node.append('circle')
        .attr('r', 10);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            setTransform(event.transform);
        });

    svg.call(zoom);

    if (previousTransform) {
        svg.call(zoom.transform, previousTransform);
    }

    rootRef.current = root;
};

// Update the D3 tree
export const updateD3Tree = (
    container: HTMLDivElement,
    rootData: D3TreeNode,
    rootRef: MutableRefObject<d3.HierarchyPointNode | null>,
    updateRef: MutableRefObject<(source: d3.HierarchyPointNode | null) => void>,
    setTransform: (transform: d3.ZoomTransform) => void,
    previousTransform?: d3.ZoomTransform
) => {
    const g = d3.select(container).select('svg g');
    const root = d3.hierarchy(rootData);

    const nodeWidth = 240;
    const nodeHeight = 140;

    const treeLayout = d3.tree<D3TreeNode>().nodeSize([nodeHeight, nodeWidth]);

    treeLayout(root);

    const nodes = root.descendants();
    const links = root.links();

    // Update links
    const linkGroup = g.select('g.links');
    const link = linkGroup.selectAll('path.link')
        .data(links, d => d.target.id as string);

    link.enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', bezierCurveGenerator)
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('fill', 'none')
        .merge(link)
        .transition()
        .duration(500)
        .attr('d', bezierCurveGenerator);

    link.exit().remove();

    // Update nodes
    const nodeGroup = g.select('g.nodes');
    const node = nodeGroup.selectAll('g.node')
        .data(nodes, d => d.id as string);

    const nodeEnter = node.enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    nodeEnter.append('circle')
        .attr('r', 10);

    nodeEnter.merge(node)
        .transition()
        .duration(500)
        .attr('transform', d => `translate(${d.y},${d.x})`);

    node.exit().remove();

    updateRef.current = (source: d3.HierarchyPointNode<D3TreeNode> | null) => {
        if (!source) return;

        const updatedNodes = root.descendants();
        const updatedLinks = root.links();

        // Update links
        const linkUpdate = linkGroup.selectAll('path.link')
            .data(updatedLinks, d => d.target.id as string);

        linkUpdate.enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', bezierCurveGenerator)
            .style('stroke', 'black')
            .style('stroke-width', '1px')
            .style('fill', 'none')
            .merge(linkUpdate)
            .transition()
            .duration(500)
            .attr('d', bezierCurveGenerator);

        linkUpdate.exit().remove();

        // Update nodes
        const nodeUpdate = nodeGroup.selectAll('g.node')
            .data(updatedNodes, d => d.id as string);

        const nodeEnterUpdate = nodeUpdate.enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y},${d.x})`);

        nodeEnterUpdate.append('circle')
            .attr('r', 10);

        nodeEnterUpdate.merge(nodeUpdate)
            .transition()
            .duration(500)
            .attr('transform', d => `translate(${d.y},${d.x})`);

        nodeUpdate.exit().remove();
    };

    if (previousTransform) {
        const svg = d3.select(container).select('svg');
        svg.call(d3.zoom<SVGSVGElement, unknown>().transform, previousTransform);
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
        // console.log('[injectForeignObjects] Injecting foreignObject for product node:', d);

        const nodeElement = d3.select(this);
        nodeElement.selectAll('foreignObject').remove();

        // Ensure foreign object is placed correctly within the node
        const foreignObjectWidth = 220;

        const foreignObject = nodeElement.append('foreignObject')
            .attr('width', foreignObjectWidth)
            .attr('x', -foreignObjectWidth / 10)
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
            .style('overflow', 'visible')
            .style('width', `${foreignObjectWidth}px`)
            .style('box-sizing', 'border-box'); // Ensure padding is included in the width

        foreignObject.html(d => {
            const nodeName = `<div style="font-weight: bold; margin-bottom: 5px; text-align: center">${d.data.name}</div>`;
            let additionalHtml = '';

            if (d.data.nodeType === 'product') {
                const productNode = d.data as ProductNode;
                // console.log('[injectForeignObjects] Rendering process options for node:', productNode);
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

        // After appending the content, dynamically set the height of the foreignObject
        const htmlElement = foreignObject.node() as HTMLElement;
        const foreignObjectHeight = htmlElement.getBoundingClientRect().height;

        nodeElement.select('foreignObject')
            .attr('height', foreignObjectHeight)
            .attr('y', -foreignObjectHeight / 2); // Center the foreign object vertically

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
            // console.log('[injectForeignObjects] Skipping non-product node:', d);
        }
    });
};

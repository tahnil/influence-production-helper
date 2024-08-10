// utils/d3Tree.ts
// 
// This module provides utility functions for rendering and updating a D3 tree visualization. 
// The functions include initialization of the tree, updating the tree, and injecting foreign 
// objects for interactive elements within the tree nodes.
// 
// ########################
// Key Functions
// ########################
// 
// 1. clearD3Tree
// — Removes all existing elements within the D3 container.
// 2. initializeD3Tree
// — Initializes the D3 tree with the root node, sets up the zoom behavior, and renders nodes and links.
// 3. updateD3Tree
// — Updates the existing D3 tree with new nodes and links, ensuring smooth transitions.
// 4. injectForeignObjects
// — Adds interactive elements (foreign objects) to D3 nodes, such as process selection dropdowns.
// 
// ########################
// Detailed Explanation of Each Function
// ########################
// 
// — clearD3Tree: Clears the D3 container by selecting and removing all child elements.
// — initializeD3Tree: 
//    - Sets up the SVG canvas with margins.
//    - Creates groups for links and nodes.
//    - Defines the tree layout and computes the positions of nodes and links.
//    - Appends links and nodes to the respective groups.
//    - Sets up zoom behavior and applies any previous transform.
// — updateD3Tree: 
//    - Recomputes the positions of nodes and links based on the updated tree data.
//    - Updates the links and nodes with smooth transitions.
//    - Applies the previous transform to maintain the zoom and pan state.
// — injectForeignObjects: 
//    - Iterates through the nodes and injects foreign objects for each node.
//    - Dynamically sets the height of the foreign objects based on their content.
//    - Adds event listeners to handle interactions within the foreign objects.
// ########################

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
    const rootPointNode = root as d3.HierarchyPointNode<D3TreeNode>;

    const nodes = root.descendants();
    const links = root.links();

    // Add links first to ensure they are rendered behind the nodes
    const linkGroup = g.append('g').attr('class', 'links');
    linkGroup.selectAll('path.link')
        .data(links, d => (d as d3.HierarchyPointLink<D3TreeNode>).target.id as string)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d => bezierCurveGenerator(d as d3.HierarchyPointLink<D3TreeNode>))
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('fill', 'none');

    // Add nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll('g.node')
        .data(nodes, d => (d as d3.HierarchyPointNode<D3TreeNode>).id as string)
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

    // Calculate the initial translation to center the root node
    const initialTranslateX = viewportWidth / 2 - (root.y ?? 0);
    const initialTranslateY = viewportHeight / 2 - (root.x ?? 0);
    const initialTransform = d3.zoomIdentity.translate(initialTranslateX, initialTranslateY);

    svg.call(zoom.transform, initialTransform);
    setTransform(initialTransform);

    if (previousTransform) {
        svg.call(zoom.transform, previousTransform);
    }

    rootRef.current = rootPointNode;
};

// Update the D3 tree
export const updateD3Tree = (
    container: HTMLDivElement,
    treeData: D3TreeNode,
    rootRef: MutableRefObject<d3.HierarchyPointNode<D3TreeNode> | null>,
    updateRef: MutableRefObject<(source: d3.HierarchyPointNode<D3TreeNode> | null) => void>,
    setTransform: (transform: d3.ZoomTransform) => void,
    previousTransform?: d3.ZoomTransform
) => {
    const svg = d3.select(container).select<SVGSVGElement>('svg');
    const g = svg.select('g');

    const root = d3.hierarchy(treeData);
    const nodeWidth = 240;
    const nodeHeight = 200;

    // D3 tree layout
    const treeLayout = d3.tree<D3TreeNode>().nodeSize([nodeHeight, nodeWidth]);
    treeLayout(root);
    const rootPointNode = root as d3.HierarchyPointNode<D3TreeNode>;

    const nodes = root.descendants();
    const links = root.links();

    // --- Update Links ---
    const linkGroup = g.select('g.links');
    const linkSelection = linkGroup.selectAll<SVGPathElement, d3.HierarchyPointLink<D3TreeNode>>('path.link')
        .data(links, d => d.target.id as string);

    // Enter new links
    const linkEnter = linkSelection.enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d => bezierCurveGenerator(d as d3.HierarchyPointLink<D3TreeNode>))
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('fill', 'none');

    // Update existing links
    linkEnter.merge(linkSelection)
        .transition()
        .duration(500)
        .attr('d', d => bezierCurveGenerator(d as d3.HierarchyPointLink<D3TreeNode>));

    // Exit old links
    linkSelection.exit().remove();

    // --- Update Nodes ---
    const nodeGroup = g.select('g.nodes');
    const nodeSelection = nodeGroup.selectAll<SVGGElement, d3.HierarchyNode<D3TreeNode>>('g.node')
        .data(nodes, d => d.id as string);

    // Enter new nodes
    const nodeEnter = nodeSelection.enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    nodeEnter.append('circle')
        .attr('r', 10);

    nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children ? -10 : 10)
        .style('text-anchor', d => d.children ? 'end' : 'start');

    // Update existing nodes
    nodeEnter.merge(nodeSelection)
        .transition()
        .duration(500)
        .attr('transform', d => `translate(${d.y},${d.x})`);

    // Exit old nodes
    nodeSelection.exit().remove();

    // Store root in ref for future updates
    rootRef.current = rootPointNode;

    // Set up update function in ref to allow external triggering of updates
    updateRef.current = (source: d3.HierarchyPointNode<D3TreeNode> | null) => {
        if (!source) return;

        // Re-run the same update logic as above to apply changes
        updateD3Tree(container, treeData, rootRef, updateRef, setTransform, previousTransform);
    };

    // If there's a previous transform, reapply it to maintain zoom/pan state
    if (previousTransform) {
        svg.call(d3.zoom<SVGSVGElement, unknown>().transform, previousTransform);
    }
};

// Function to inject foreign objects into the D3 nodes
export const injectForeignObjects = (
    container: HTMLDivElement,
    rootRef: React.MutableRefObject<d3.HierarchyPointNode<D3TreeNode> | null>,
    buildProcessNodeCallback: (selectedProcessId: string | null, parentNode: D3TreeNode, parentId: string | null) => Promise<void>
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
            .style('box-sizing', 'border-box');

        foreignObject.html(d => {
            const node = d as d3.HierarchyPointNode<D3TreeNode>
            const nodeName = `<div style="font-weight: bold; margin-bottom: 5px; text-align: center">${node.data.name}</div>`;
            let additionalHtml = '';

            if (node.data.nodeType === 'product') {
                const productNode = node.data as ProductNode;
                // console.log('[injectForeignObjects] Rendering process options for node:', productNode);
                additionalHtml = `
                    <div>Amount: ${productNode.amount}</div>
                    <div>Total Weight: ${productNode.totalWeight} kg</div>
                    <div>Total Volume: ${productNode.totalVolume} L</div>
                    <label for="process-select-${productNode.id}">Select Process:</label>
                    <select style="width: 100%" id="process-select-${productNode.id}" name="process-select">
                        <option value="">-- Select a Process --</option>
                        ${productNode.processes.map(process => `<option value="${process.id}">${process.name}</option>`).join('')}
                    </select>
                `;
            } else if (node.data.nodeType === 'process') {
                const processNode = node.data as ProcessNode;
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
            .attr('y', -foreignObjectHeight / 2);

        if (d.data.nodeType === 'product') {
            const productNode = d.data as ProductNode;
            foreignObject.select('select').on('change', async function () {
                const selectedProcessId = (this as HTMLSelectElement).value;
                try {
                    if (selectedProcessId) {
                        await buildProcessNodeCallback(selectedProcessId, d.data, d.data.id);
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

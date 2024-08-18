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
// 
// 2. initializeD3Tree
// — Initializes the D3 tree with the root node, sets up the zoom behavior, and renders nodes and links.
// 
// 3. updateD3Tree
// — Updates the existing D3 tree with new nodes and links, ensuring smooth transitions.
// 
// 4. injectForeignObjects
// — Adds interactive elements (foreign objects) to D3 nodes, such as process selection dropdowns and copy-to-clipboard functionality.
// 
// ########################
// Detailed Explanation of Each Function
// ########################
// 
// — clearD3Tree:
//    - Clears the D3 container by selecting and removing all child elements.
//    - This ensures that any existing tree is fully removed before rendering a new one.
// 
// — initializeD3Tree: 
//    - Sets up the SVG canvas with margins and initializes the root node of the tree.
//    - Creates groups for links and nodes within the SVG container.
//    - Defines the tree layout using `d3.tree` and computes the positions of nodes and links.
//    - Appends links and nodes to their respective groups, establishing the initial structure of the tree.
//    - Sets up zoom behavior, allowing users to pan and zoom the tree visualization.
//    - Applies any previous transform to maintain the state between updates or re-renders.
// 
// — updateD3Tree: 
//    - Recomputes the positions of nodes and links based on the updated tree data.
//    - Updates the links and nodes with smooth transitions, reflecting changes in the tree structure.
//    - Ensures that any previous transform (zoom/pan state) is reapplied to maintain user context.
// 
// — injectForeignObjects: 
//    - Iterates through the nodes and injects foreign objects for each node, allowing for additional HTML content inside SVG elements.
//    - Dynamically sets the height of the foreign objects based on their content, ensuring correct placement within the tree.
//    - Adds event listeners to handle interactions within the foreign objects, such as copying values to the clipboard or handling dropdown selections.
// ########################

import * as d3 from 'd3';
import { MutableRefObject } from 'react';
import { D3TreeNode, ProcessNode, ProductNode } from '@/types/d3Types';
import { formatNumber } from '@/utils/formatNumber';
import { formatDuration } from '@/utils/formatDuration';

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
    // Check if an SVG already exists in the container
    let svg = d3.select(container).select<SVGSVGElement>('svg');
    if (svg.empty()) {
        // If no SVG exists, create a new one
        svg = d3.select(container)
            .append('svg')
            .attr('class', 'w-full h-full');
    } else {
        // If an SVG exists, clear its contents
        svg.selectAll('*').remove();
    }

    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy(rootData);

    // Define the size of each node
    const nodeWidth = 240;
    const nodeHeight = 140;

    // Set the node size for the tree layout
    const treeLayout = d3.tree<D3TreeNode>().nodeSize([nodeHeight, nodeWidth]);
    treeLayout(root);

    const rootPointNode = root as d3.HierarchyPointNode<D3TreeNode>;
    const nodes = root.descendants();
    const links = root.links();

    // Calculate the initial translation to center the root node
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const initialTranslateX = containerWidth / 2;
    const initialTranslateY = containerHeight / 2;
    const initialTransform = d3.zoomIdentity.translate(initialTranslateX, initialTranslateY);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            setTransform(event.transform);
        });

    svg.call(zoom);

    svg.call(zoom.transform, initialTransform);
    setTransform(initialTransform);

    if (previousTransform) {
        svg.call(zoom.transform, previousTransform);
    }

    // Add links first to ensure they are rendered behind the nodes
    const linkGroup = g.append('g').attr('class', 'links stroke-mako-400 stroke-2');
    linkGroup.selectAll<SVGPathElement, d3.HierarchyPointLink<D3TreeNode>>('path.link')
        .data(links, d => {
            // Create a unique ID for each link based on source and target node IDs
            const linkId = `${d.source.data.id}-${d.target.data.id}`;
            // console.log('[d3Tree] initializing with link id: ', linkId);
            return linkId;
        })
        .enter()
        .append('path')
        .attr('class', 'link stroke-mako-400 stroke-2')
        .attr('d', d => bezierCurveGenerator(d as d3.HierarchyPointLink<D3TreeNode>))
        .style('fill', 'none');

    // Add nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll<SVGGElement, d3.HierarchyNode<D3TreeNode>>('g.node')
        .data(nodes, d => {
            // console.log('[d3Tree] initializing with node id: ',d.data.id);
            return d.data.id as string;
        })
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

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
    const nodeWidth = 320;
    const nodeHeight = 256;

    // D3 tree layout
    const treeLayout = d3.tree<D3TreeNode>().nodeSize([nodeHeight, nodeWidth]);
    treeLayout(root);
    const rootPointNode = root as d3.HierarchyPointNode<D3TreeNode>;

    const nodes = root.descendants();
    const links = root.links();

    // --- Update Links ---
    const linkGroup = g.select('g.links');
    const linkSelection = linkGroup.selectAll<SVGPathElement, d3.HierarchyPointLink<D3TreeNode>>('path.link')
        .data(links, d => {
            // Create a unique ID for each link based on source and target node IDs
            const linkId = `${d.source.data.id}-${d.target.data.id}`;
            // console.log('[d3Tree] used link id: ', linkId);
            return linkId;
        });

    // Enter new links
    const linkEnter = linkSelection.enter()
        .append('path')
        .attr('class', 'link stroke-mako-400 stroke-2')
        // Initially draw the new links as a line between the source and target positions
        .attr('d', d => {
            const initialPosition = d.source ? { x: d.source.x, y: d.source.y } : { x: root.x, y: root.y };
            const targetPosition = d.target ? { x: d.target.x, y: d.target.y } : { x: root.x, y: root.y };
            const initialLink = { source: initialPosition, target: initialPosition };
            return bezierCurveGenerator(initialLink as d3.HierarchyPointLink<D3TreeNode>);
        })
        .style('fill', 'none');

    // Apply the transition to the entering links
    linkEnter.merge(linkSelection) // Merge the enter selection with the update selection
        .transition()
        .duration(500) // Duration of the transition
        .attr('d', d => bezierCurveGenerator(d as d3.HierarchyPointLink<D3TreeNode>)); // Transition to the final link shape

    // Exit old links
    linkSelection.exit().remove();

    // --- Update Nodes ---
    const nodeGroup = g.select('g.nodes');
    const nodeSelection = nodeGroup.selectAll<SVGGElement, d3.HierarchyNode<D3TreeNode>>('g.node')
        .data(nodes, d => {
            // console.log('[d3Tree] used node id: ',d.data.id);
            return d.data.id as string;
        });

    // Enter new nodes
    const nodeEnter = nodeSelection.enter()
        .append('g')
        .attr('class', 'node')
        // Initially place the new nodes at their parent's position (or root position if no parent)
        .attr('transform', d => {
            const initialPosition = d.parent ? { x: d.parent.x, y: d.parent.y } : { x: root.x, y: root.y };
            return `translate(${initialPosition.y},${initialPosition.x})`;
        });

    // Apply the transition to the newly added nodes
    nodeEnter.merge(nodeSelection)  // Merge the enter selection with the update selection
        .transition()
        .duration(500) // Duration of the transition
        .attr('transform', d => `translate(${d.y},${d.x})`); // Transition to the final position

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

        const foreignObjectWidth = 288;

        const foreignObject = nodeElement.append('foreignObject')
            .attr('width', foreignObjectWidth)
            .attr('x', -foreignObjectWidth / 10)
            .style('overflow', 'visible')
            .append('xhtml:div')
            .style('width', `${foreignObjectWidth}px`)
            .style('box-sizing', 'border-box');

        foreignObject.html(d => {
            const node = d as d3.HierarchyPointNode<D3TreeNode>;
            let contentHtml = '';

            if (node.data.nodeType === 'product') {
                const productNode = node.data as ProductNode;
                // console.log('[injectForeignObjects] Rendering process options for node:', productNode);

                // Product Node styling
                // Use the Base64 image string
                const units = formatNumber(productNode.amount, { minimumFractionDigits: 0, maximumFractionDigits: 6, scaleForUnit: true, scaleType: 'units' });
                const weight = formatNumber(productNode.totalWeight, { scaleForUnit: true, scaleType: 'weight' });
                const volume = formatNumber(productNode.totalVolume, { scaleForUnit: true, scaleType: 'volume' });

                contentHtml = `
                <div id="productNodeCard" class="flex flex-col items-center">
                    <div class="w-72 shadow-lg rounded-lg overflow-hidden font-sans font-light">
                        <div id="titleSection" class="p-2 bg-mako-900 flex justify-center items-center gap-2.5 grid grid-cols-3">
                            <div id="productIcon" class="p-2">
                        <img src="${productNode.imageBase64}" alt="${node.data.name}">
                            </div>
                            <div id="productName" class="col-span-2">
                                <span class="text-detailText">${node.data.name}</span>
                            </div>
                        </div>
                        <div id="productStatsSection" class="bg-mako-900 py-1 px-2.5 flex flex-wrap items-start content-start gap-1">
                            <div class="p-[2px] rounded bg-mako-950">${productNode.productData.category}</div>
                            <div class="p-[2px] rounded bg-mako-950">${productNode.productData.massKilogramsPerUnit} kg</div>
                            <div class="p-[2px] rounded bg-mako-950">${productNode.productData.volumeLitersPerUnit} L</div>
                        </div>
                        <div id="outputSection" class="p-2 bg-mako-950 flex justify-center items-center gap-2.5 grid grid-cols-3">
                            <div id="units" class="flex flex-col items-center">
                                <div 
                                    class="border border-transparent border-2 border-dotted cursor-pointer" 
                                    data-value="${productNode.amount}">
                                    ${units.formattedValue}
                                </div>
                                <div>${units.unit}</div>
                            </div>
                            <div id="weight" class="flex flex-col items-center">
                                <div 
                                    class="border border-transparent border-2 border-dotted cursor-pointer" 
                                    data-value="${productNode.totalWeight}">
                                    ${weight.formattedValue}
                                </div>
                                <div>${weight.unit}</div>
                            </div>
                            <div id="volume" class="flex flex-col items-center">
                                <div>${volume.formattedValue}</div>
                                <div>${volume.unit}</div>
                            </div>
                        </div>
                    </div>
                </div>
                `;

            } else if (node.data.nodeType === 'process') {
                const processNode = node.data as ProcessNode;
                const formattedDuration = formatDuration(processNode.totalRuns, processNode.processData.mAdalianHoursPerSR);
                const runs = formatNumber(processNode.totalRuns, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 6,
                    scaleForUnit: true,
                    scaleType: 'runs'
                });

                // Check if this is a resource extraction node
                const isResourceExtraction = processNode.children.length === 0;

                if (!isResourceExtraction) {
                    contentHtml = `
                        <div id="processNodeCard" class="flex flex-col items-center">
                            <div class="w-72 shadow-lg rounded-lg overflow-hidden font-sans font-light">
                                <div id="titleSection" class="p-2 bg-falcon-800 flex justify-center items-center gap-2.5 grid grid-cols-3">
                                    <div id="buildingIcon" class="p-2">
                                        <img class="size-12 fill-falconWhite" src="${processNode.imageBase64}" alt="${node.data.name}">
                                    </div>
                                    <div id="processName" class="col-span-2">
                                        <span class="text-detailText">${node.data.name}</span>
                                    </div>
                                </div>
                                <div id="statsSection" class="p-2 bg-mako-950 flex justify-center items-center gap-2.5 grid grid-cols-2">
                                    <div id="totalDuration" class="flex flex-col items-center">
                                        <div>${formattedDuration}</div>
                                        <div>duration</div>
                                    </div>
                                    <div id="totalRuns" class="flex flex-col items-center">
                                        <div
                                            class="border border-transparent border-2 border-dotted cursor-pointer" 
                                            data-value="${processNode.totalRuns}">
                                            ${runs.formattedValue}
                                        </div>
                                        <div>${runs.unit}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    contentHtml = `
                        <div id="processNodeCard" class="flex flex-col items-center">
                            <div class="w-64 shadow-lg rounded-lg overflow-hidden font-sans font-light">
                                <div id="titleSection" class="p-2 bg-falcon-800 flex justify-center items-center gap-2.5 grid grid-cols-3">
                                    <div id="buildingIcon" class="p-2">
                                        <img class="size-12 fill-falconWhite" src="${processNode.imageBase64}" alt="${node.data.name}">
                                    </div>
                                    <div id="processName" class="col-span-2">
                                        <span class="text-detailText">${node.data.name}</span>
                                    </div>
                                </div>
                                <div id="noInputMsg" class="p-2 text-center text-sm text-gray-500 bg-mako-950">
                                    No further inputs. This process extracts resources directly.
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            return contentHtml;
        });

        foreignObject
            .each(function (d) {
                const productNode = d.data as ProductNode;

                if (!productNode) {
                    console.error('Product node is undefined', d);
                    return;
                }

                const dropdown = d3.select(this).append('div')
                    .attr('class', 'custom-dropdown')
                    .datum(productNode); // Bind the productNode to the dropdown container

                dropdown.html(`
                    <div class="dropdown-selected border cursor-pointer">-- Select a Process --</div>
                    <div class="dropdown-options hidden">
                        ${Array.isArray(productNode.processes) ?
                            productNode.processes.map(process => `
                                <div class="dropdown-option border cursor-pointer" data-value="${process.id}">
                                    ${process.name}
                                </div>`).join('')
                            : '<div class="dropdown-option">No processes available</div>'}
                    </div>
                `);
            });

        foreignObject.on('click', function (event) {
            const target = event.target as HTMLElement;

            if (target.classList.contains('dropdown-selected')) {
                const dropdown = target.closest('.custom-dropdown') as HTMLElement;
                console.log('Dropdown element:', dropdown);
                if (dropdown) {
                    const options = d3.select(dropdown).select('.dropdown-options');
                    const isVisible = options.classed('hidden');
                    options.classed('hidden', !isVisible);  // Toggle the 'hidden' class
                    event.stopPropagation(); // Prevent click from bubbling up
                }
            }

            if (target.classList.contains('dropdown-option')) {
                const selectedValue = target.getAttribute('data-value');
                const selectedText = target.textContent;

                const dropdown = target.closest('.custom-dropdown') as HTMLElement;
                console.log('Dropdown element for option:', dropdown);
                if (dropdown) {
                    const productNode = d3.select(dropdown).datum() as ProductNode;
                    console.log('Retrieved product node:', productNode);
                    if (productNode) {
                        console.log('Selected Value:', selectedValue, 'Product Node:', productNode);
                        buildProcessNodeCallback(selectedValue, productNode, productNode.id);
                    } else {
                        console.error('Product node data is undefined');
                    }
                }
            }
        });

        // Your copyToClipboard function should be defined somewhere globally accessible
        function copyToClipboard(element: HTMLElement, value: string) {
            navigator.clipboard.writeText(value).then(() => {
                element.classList.add('bg-lunarGreen-100', 'text-lunarGreen-800');
                element.classList.remove('border-falconWhite');

                setTimeout(() => {
                    element.classList.remove('bg-lunarGreen-100', 'text-lunarGreen-800');
                    element.classList.add('border-falconWhite');
                }, 100);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }

        // Add event listeners after the HTML is injected
        foreignObject.selectAll('div.border.cursor-pointer')
            .on('mouseover', function () {
                d3.select(this).classed('border-falconWhite', true);
            })
            .on('mouseout', function () {
                if (!d3.select(this).classed('bg-green-100')) {
                    d3.select(this).classed('border-falconWhite', false);
                }
            })
            .on('click', function () {
                const value = d3.select(this).attr('data-value');
                copyToClipboard(this as HTMLElement, value ?? '');
            });

        // Dynamically set the height of the foreign object to match its content
        const htmlElement = foreignObject.node() as HTMLElement;
        const foreignObjectHeight = htmlElement.getBoundingClientRect().height;

        nodeElement.select('foreignObject')
            .attr('height', foreignObjectHeight)
            .attr('y', -foreignObjectHeight / 2);

        // Attach event listeners for process selection
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
        }
    });
};

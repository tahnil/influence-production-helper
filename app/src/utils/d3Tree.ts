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
import { formatNumber } from '@/utils/formatNumber';

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
    const nodeWidth = 288;
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

        const foreignObjectWidth = 256;

        const foreignObject = nodeElement.append('foreignObject')
            .attr('width', foreignObjectWidth)
            .attr('x', -foreignObjectWidth / 10)
            .style('overflow', 'visible')
            .append('xhtml:div')
            // .attr('class', 'flex flex-col items-center justify-center bg-mako-900 border border-black rounded-xl p-2 overflow-visible')
            .style('width', `${foreignObjectWidth}px`)
            .style('box-sizing', 'border-box');

        foreignObject.html(d => {
            const node = d as d3.HierarchyPointNode<D3TreeNode>;
            let contentHtml = '';

            if (node.data.nodeType === 'product') {
                const productNode = node.data as ProductNode;
                // console.log('[injectForeignObjects] Rendering process options for node:', productNode);
                contentHtml = `
                    <div class="font-bold mb-2 text-center">${node.data.name}</div>
                    <div>Amount: ${formatNumber(productNode.amount)}</div>
                    <div>Total Weight: ${formatNumber(productNode.totalWeight)} kg</div>
                    <div>Total Volume: ${formatNumber(productNode.totalVolume)} L</div>
                    <select class="mt-1 w-full bg-mako-950" id="process-select-${productNode.id}" name="process-select">
                        <option value="">-- Select a Process --</option>
                        ${productNode.processes.map(process => `<option value="${process.id}">${process.name}</option>`).join('')}
                    </select>
                `;
            } else if (node.data.nodeType === 'process') {
                const processNode = node.data as ProcessNode;
                contentHtml = `
                    <div class="flex flex-col items-center">
                        <div class="w-64 shadow-lg rounded-lg overflow-hidden font-sans font-light">
                            <div id="titleSection" class="p-2 bg-falcon-800 flex justify-center items-center gap-2.5 grid grid-cols-3">
                                <div id="buildingIcon" class="p-2">
                                    <svg class="size-12 fill-falconWhite" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6.12048 16.891C6.24532 16.891 6.39416 16.891 6.49921 16.891C7.73561 17.0245 8.44434 16.619 9.16977 16.2359C9.84241 15.8916 10.2868 15.3234 10.7502 14.7496C11.1046 14.2306 11.328 13.574 11.4932 12.8635C11.496 12.1195 11.5757 11.1549 11.3826 10.5772C11.1426 10.002 10.9084 9.43149 10.5292 8.97901C10.2441 8.53776 9.8161 8.22265 9.42345 7.90859C9.37406 7.87079 9.27815 7.85138 9.25016 7.81307C9.18776 7.7995 9.13556 7.74289 9.0913 7.7325C9.17108 7.51596 9.35532 7.12546 9.7214 7.09249C9.97395 6.81578 10.3986 6.73107 10.6694 6.45353C11.0614 6.37383 11.1866 6.01648 11.568 5.94332C11.7595 5.68224 12.1966 5.65589 12.3593 5.38292C12.6831 5.27168 12.9584 5.1048 13.1623 4.8897C13.4677 4.83469 13.5734 4.57114 13.869 4.5239C14.1328 4.50204 14.4405 4.51181 14.7043 4.50799C14.9312 4.50799 15.1741 4.50799 15.3827 4.50799C15.5722 4.50799 15.7807 4.50796 15.9514 4.50796C16.1549 4.47214 16.2398 4.56407 16.2908 4.6632C16.3312 4.77059 16.2819 4.98997 16.3222 5.07782C16.3659 5.17642 16.4476 5.27109 16.5822 5.25799C16.7232 5.25799 16.8862 5.25799 17.0079 5.25799C17.1382 5.25799 17.2914 5.25799 17.402 5.25799C17.53 5.26656 17.6788 5.26024 17.7091 5.19014C17.7895 5.14537 17.8228 5.02248 17.8047 4.89777C17.8047 4.6845 17.8047 4.45525 17.8047 4.26064C17.8047 4.12343 17.8047 3.96317 17.8047 3.84574C17.8047 3.75801 17.8047 3.64109 17.8047 3.57447C17.9254 3.17593 17.7726 3.03429 17.5355 2.99524C17.2982 2.9562 16.9688 3.01174 16.7242 2.992C15.5935 2.992 14.4609 2.9921 13.3303 2.9921C12.5164 3.28119 11.9485 3.8395 11.1977 4.17383C10.6819 4.56163 10.0908 4.87426 9.55638 5.24323C9.08281 5.50264 8.703 5.84073 8.18415 6.07273C7.8235 6.33027 7.43252 6.55934 7.04691 6.79163C6.8198 7.19529 6.08178 7.09543 5.5351 7.15717C5.13156 7.35029 4.63568 7.4707 4.25538 7.66849C3.9159 7.86764 3.64437 8.1376 3.33911 8.37137C3.0909 8.58581 2.90922 8.87906 2.69104 9.10656C2.59222 9.38114 2.36827 9.5436 2.26377 9.79484C2.2058 10.041 2.13961 10.29 2.02776 10.4638C1.91445 10.6594 1.85685 10.9296 1.85295 11.218C1.83036 11.5268 1.83656 11.877 1.83717 12.1915C1.83796 12.4794 1.8523 12.7678 1.86875 13.0218C1.89446 13.2899 1.99811 13.4966 2.09051 13.6792C2.18112 13.8386 2.2013 14.0845 2.27988 14.2378C3.08677 15.5996 4.21016 16.6624 6.12048 16.891ZM6.98839 15.4069C6.62936 15.4369 6.25201 15.4184 5.94814 15.375C5.63442 15.3606 5.39256 15.2677 5.24249 15.1056C5.05953 15.0181 4.83496 14.9606 4.72289 14.8195C4.62959 14.6952 4.45243 14.6346 4.34199 14.5463C4.21284 14.507 4.16082 14.3755 4.10823 14.278C4.05299 14.2021 4.00408 14.0936 3.94938 14.0371C3.90244 13.9748 3.82696 13.9171 3.79242 13.8627C3.75004 13.8012 3.70955 13.7125 3.68251 13.6562C3.65999 13.5692 3.61621 13.474 3.57067 13.4307C3.53317 13.3643 3.46635 13.3093 3.47808 13.2138C3.4879 13.1216 3.44647 13.0518 3.4622 12.975C3.4601 12.8466 3.61332 12.8638 3.69253 12.8377C4.55021 12.8078 5.44535 12.8304 6.34188 12.8218C6.57412 12.8218 6.82211 12.8218 7.03609 12.8218C7.23627 12.8218 7.45405 12.8218 7.63566 12.8218C7.85187 12.8218 8.08474 12.8218 8.28256 12.8218C8.50412 12.8218 8.74202 12.8218 8.94524 12.8218C9.12398 12.8218 9.32065 12.8217 9.48057 12.8217C9.59302 12.8561 9.77967 12.8302 9.83878 12.899C9.92889 12.9825 9.85807 13.2356 9.83698 13.3223C9.75832 13.4181 9.69622 13.5489 9.64802 13.6564C9.61834 13.7854 9.53808 13.8802 9.47608 13.9571C9.39666 14.003 9.34808 14.1062 9.3017 14.1656C9.27943 14.2363 9.2153 14.2975 9.20571 14.3602C8.56049 14.8075 8.10104 15.395 6.98839 15.4069ZM9.56018 11.226C9.19962 11.2466 8.80087 11.239 8.44031 11.242C8.09117 11.242 7.73063 11.242 7.39899 11.242C7.12416 11.242 6.83545 11.242 6.57852 11.242C6.36231 11.242 6.12945 11.242 5.93162 11.242C5.76363 11.242 5.57573 11.242 5.42672 11.242C5.29106 11.242 5.1326 11.242 5.01649 11.242C4.9025 11.242 4.76331 11.242 4.66937 11.242C4.54996 11.242 4.40598 11.242 4.30647 11.242C4.18163 11.242 4.03254 11.242 3.92748 11.242C3.80973 11.2513 3.71626 11.2097 3.61176 11.2261C3.52796 11.2231 3.45847 11.1848 3.42843 11.1485C3.31338 11.083 3.41297 10.9138 3.43064 10.8208C3.75351 10.2818 3.99561 9.68352 4.5315 9.34192C4.73524 9.2217 4.84599 8.99778 5.11343 8.95979C5.3131 8.85691 5.45103 8.68032 5.71151 8.6569C5.99696 8.62466 6.28095 8.57906 6.57873 8.57714C6.85507 8.56485 7.10558 8.59241 7.31956 8.625C7.55541 8.62134 7.75032 8.67118 7.90034 8.73587C8.02686 8.81577 8.1402 8.9283 8.28031 8.97576C8.41848 9.01136 8.52556 9.09276 8.60833 9.16525C8.66572 9.25535 8.77809 9.31498 8.86258 9.3581C8.94026 9.40578 9.02655 9.4683 9.09881 9.50146C9.19036 9.60049 9.24793 9.74751 9.31728 9.85008C9.35963 9.94993 9.45284 10.0213 9.5068 10.0897C9.5392 10.243 9.77306 10.5185 9.88816 10.7621C10.0032 11.0058 10.0056 11.205 9.56018 11.226Z" />
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.41271 21.0078C7.88991 21.0077 7.37154 21.0077 6.84537 21.0077C6.6302 20.8724 6.65129 20.4771 6.67233 20.0829C6.68409 19.8624 6.69584 19.6423 6.66625 19.4681L6.66633 19.0545C6.64536 18.9158 6.72086 18.8204 6.8119 18.7752C6.86629 18.7348 6.9823 18.7391 7.09846 18.7433C7.16596 18.7458 7.23351 18.7483 7.28906 18.742H7.90433C7.99982 18.7291 8.06642 18.799 8.11423 18.855C8.16894 18.8798 8.16709 18.9979 8.16541 19.1047C8.16498 19.1319 8.16457 19.1583 8.1651 19.1823C8.13785 19.3383 8.21641 19.4159 8.30264 19.4769C8.36754 19.498 8.47033 19.4951 8.57436 19.4921C8.63756 19.4903 8.70122 19.4885 8.75713 19.492H9.94017C9.97235 19.4915 10.0052 19.4912 10.0383 19.491C10.2706 19.4893 10.5171 19.4874 10.6597 19.3835C10.729 19.2704 10.8565 19.204 10.9849 19.1371C11.0651 19.0953 11.1456 19.0533 11.2125 18.9997C11.3168 18.8777 11.475 18.7958 11.6334 18.7138C11.6937 18.6826 11.7539 18.6514 11.8112 18.618C11.868 18.504 11.9862 18.4432 12.1058 18.3818C12.2089 18.3287 12.313 18.2752 12.3796 18.1865C12.4508 18.0966 12.5624 18.0412 12.6755 17.985C12.8155 17.9154 12.9579 17.8446 13.0286 17.7059C13.1979 17.655 13.3256 17.5557 13.4546 17.4554C13.5732 17.3632 13.6929 17.2701 13.847 17.2131C13.9211 17.0737 14.0668 17.0002 14.214 16.9259C14.4222 16.8209 14.6336 16.7143 14.6507 16.417C14.6988 16.3131 14.6461 16.2635 14.5626 16.2176C14.5283 16.1986 14.4894 16.1822 14.4512 16.166C14.3968 16.143 14.3439 16.1206 14.3079 16.0926C14.2075 16.0749 14.1498 16.0043 14.0912 15.9325C14.0379 15.8674 13.9839 15.8013 13.8965 15.7728C13.8812 15.7605 13.8617 15.7481 13.8408 15.7349C13.7904 15.7031 13.7321 15.6663 13.7054 15.6118C13.3413 15.2689 13.0224 14.8403 12.741 14.3953C12.6931 14.1464 12.5984 13.9446 12.5036 13.7428C12.3594 13.4355 12.2151 13.128 12.2359 12.6543C12.2355 12.5099 12.2321 12.3602 12.2288 12.2088C12.215 11.5888 12.2007 10.9406 12.3785 10.5131C12.6168 9.87656 12.8695 9.25008 13.311 8.81899C13.7968 8.27829 14.3543 7.77724 15.0956 7.47718C15.7534 6.98666 17.3853 7.05855 18.3992 7.22095C20.2486 7.82981 21.3777 9.10417 21.8764 11.0272C21.8674 11.1577 21.8749 11.2819 21.8824 11.4079C21.8886 11.512 21.895 11.6174 21.8922 11.7289C21.8899 11.822 21.8905 11.9218 21.8911 12.0236C21.8922 12.2106 21.8934 12.4042 21.8764 12.574C21.8934 12.8511 21.8616 13.1142 21.7972 13.327C21.7708 13.4079 21.7316 13.4823 21.6916 13.5583C21.6412 13.6542 21.5894 13.7525 21.5605 13.8694C21.5483 13.909 21.5366 13.9501 21.5247 13.9918C21.4675 14.193 21.4067 14.407 21.2603 14.5248C21.1686 14.7544 21.0085 14.9382 20.8511 15.119C20.8237 15.1504 20.7964 15.1818 20.7696 15.2132C20.6845 15.2902 20.6065 15.3778 20.5276 15.4663C20.3843 15.6269 20.2383 15.7906 20.043 15.9C19.8278 16.0848 19.5609 16.2349 19.2952 16.3843C19.2224 16.4252 19.1498 16.466 19.0783 16.5075C18.8924 16.5405 18.7441 16.6121 18.5957 16.6839C18.3692 16.7934 18.1424 16.9031 17.781 16.875C17.3108 16.7948 17.0684 16.9601 16.8257 17.1256C16.7209 17.1971 16.6161 17.2686 16.4927 17.3204C16.157 17.6269 15.8285 17.9041 15.3884 18.0862C15.1471 18.3192 14.8669 18.5002 14.5876 18.6807C14.4145 18.7925 14.2418 18.9042 14.0788 19.0278C13.8827 19.1703 13.6732 19.3036 13.4625 19.4376C13.1042 19.6655 12.7424 19.8957 12.4369 20.1772C12.1926 20.2651 12.0063 20.4157 11.8188 20.5673C11.4557 20.861 11.0884 21.1581 10.2866 21.008H10.0349C9.48098 21.008 8.94455 21.0079 8.41271 21.0078ZM19.1275 11.2411C19.0245 11.2411 18.9228 11.2412 18.8239 11.242H14.3111C14.2549 11.2464 14.2042 11.2393 14.1552 11.2324C14.1016 11.2248 14.05 11.2175 13.9953 11.2261C13.9115 11.2231 13.8421 11.1848 13.812 11.1485C13.7244 11.0986 13.7612 10.9886 13.7916 10.8979C13.8011 10.8695 13.81 10.8429 13.8142 10.8207C13.881 10.7093 13.9443 10.5954 14.0074 10.4817C14.2497 10.0454 14.49 9.61289 14.9151 9.34191C14.9893 9.29809 15.0512 9.2405 15.1129 9.18316C15.2204 9.08317 15.327 8.98392 15.497 8.95977C15.5626 8.92597 15.6216 8.88421 15.6804 8.84254C15.8005 8.75739 15.9202 8.67262 16.0951 8.65689C16.1607 8.64948 16.2263 8.64136 16.2919 8.63323C16.5118 8.60599 16.733 8.57861 16.9623 8.57713C17.2387 8.56484 17.4891 8.5924 17.7032 8.62499C17.9389 8.62133 18.134 8.67117 18.284 8.73586C18.326 8.76241 18.3666 8.79256 18.4072 8.82274C18.4887 8.88336 18.5704 8.94406 18.6639 8.97575C18.802 9.01135 18.9091 9.09275 18.992 9.16524C19.0492 9.25534 19.1617 9.31497 19.2462 9.35809C19.2704 9.37299 19.2955 9.38934 19.3208 9.40578C19.3764 9.44198 19.4327 9.47865 19.4824 9.50145C19.5395 9.56334 19.5835 9.64397 19.6253 9.72078C19.6505 9.76688 19.6748 9.8116 19.7009 9.85007C19.7297 9.91818 19.7823 9.97304 19.8299 10.0228C19.8521 10.0459 19.8732 10.068 19.8904 10.0897C19.9083 10.1746 19.9881 10.297 20.0753 10.4308C20.1455 10.5384 20.2204 10.6534 20.2717 10.7621C20.3869 11.0058 20.3893 11.2049 19.9437 11.226C19.682 11.241 19.4002 11.241 19.1275 11.2411ZM17.372 15.4069C17.0129 15.4369 16.6357 15.4184 16.3318 15.375C16.0179 15.3606 15.7761 15.2677 15.6261 15.1056C15.5774 15.0823 15.5257 15.0611 15.474 15.0399C15.3315 14.9815 15.1887 14.923 15.1065 14.8195C15.0478 14.7414 14.9561 14.6884 14.8686 14.6379C14.8169 14.6081 14.7666 14.5791 14.7256 14.5463C14.6128 14.5119 14.5588 14.4073 14.5119 14.3164C14.5051 14.3032 14.4985 14.2903 14.4918 14.2779C14.469 14.2467 14.4473 14.2098 14.4259 14.1734C14.3953 14.1215 14.3651 14.0703 14.333 14.0371C14.311 14.0079 14.2828 13.9798 14.2554 13.9525C14.2243 13.9215 14.1944 13.8916 14.176 13.8627C14.1386 13.8084 14.1026 13.7328 14.0761 13.6771L14.0661 13.6562C14.0436 13.5691 13.9998 13.474 13.9543 13.4307C13.9446 13.4136 13.9329 13.3972 13.9212 13.3807C13.8875 13.3332 13.853 13.2846 13.8617 13.2137C13.8664 13.1689 13.8591 13.1294 13.8521 13.0917C13.8447 13.052 13.8377 13.0144 13.8458 12.975C13.8442 12.878 13.9313 12.8641 14.0081 12.8518C14.033 12.8478 14.0568 12.844 14.0761 12.8376C14.6136 12.8189 15.1658 12.8208 15.7238 12.8227C16.0563 12.8239 16.3908 12.825 16.7254 12.8218L19.8642 12.8217C19.9077 12.8351 19.9624 12.8393 20.0164 12.8436C20.102 12.8503 20.1861 12.8569 20.2224 12.899C20.3064 12.9769 20.2504 13.2024 20.2254 13.3027L20.2206 13.3223C20.1419 13.4181 20.0799 13.5489 20.0316 13.6564C20.0033 13.7793 19.9291 13.8711 19.8685 13.9461L19.8596 13.9571C19.8024 13.9902 19.7612 14.053 19.7253 14.1077C19.7114 14.1289 19.6982 14.149 19.6853 14.1656C19.675 14.1983 19.6557 14.2291 19.637 14.2588C19.6153 14.2933 19.5945 14.3265 19.5893 14.3601C19.455 14.4533 19.3288 14.5524 19.203 14.6512C18.7245 15.0271 18.2531 15.3974 17.372 15.4069Z" />
                                    </svg>
                                </div>
                                <div id="processName" class="col-span-2">
                                    <span class="text-detailText">${node.data.name}</span>
                                </div>
                            </div>
                            <div id="sideProductsSection" class="p-2 bg-mako-950 flex justify-center items-center gap-2.5 grid grid-cols-2">
                                <div id="units" class="flex flex-col items-center">
                                    <div>${formatNumber(processNode.totalDuration)}</div>
                                    <div>duration</div>
                                </div>
                                <div id="weight" class="flex flex-col items-center">
                                    <div>${formatNumber(processNode.totalRuns)}</div>
                                    <div>runs</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            return contentHtml;
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

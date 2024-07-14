document.addEventListener('DOMContentLoaded', () => {
    window.addBranch = addBranch;
    window.updateNodeName = updateNodeName;

    const treeData = {
        id: "root",
        name: "Root",
        children: [
            { id: "child1", name: "Child 1" },
            { id: "child2", name: "Child 2", children: [{ id: "grandchild1", name: "Grandchild 1" }, { id: "grandchild2", name: "Grandchild 2" }] }
        ]
    };

    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    const width = window.innerWidth - margin.left - margin.right;
    const height = window.innerHeight - margin.top - margin.bottom;

    let i = 0;  // Variable for generating unique IDs
    const duration = 750;

    const treeLayout = d3.tree().size([height, width]);
    // root: This variable should ideally hold the entire hierarchy of the tree and maintain the 
    // structure throughout the lifecycle of the visualization. It should be used to compute layouts 
    // and render the visual representation of the tree.
    let root = d3.hierarchy(treeData, function(d) { return d.children; });
    root.x0 = height / 2;
    root.y0 = 0;

    // Initialization: Sets up the initial correct layout before any interaction.
    treeLayout(root);

    const svg = d3.select("#tree-container")
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .call(d3.zoom().on("zoom", event => svg.attr("transform", event.transform)))
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`); // check if translate should be in quotes!

    // Passing the root object, which is the hierarchical representation of treeData, 
    // to the update function. This object, created using d3.hierarchy(treeData), 
    // organizes initial data into a structure suitable for D3 to manipulate and visualize as a tree
    console.log("Initial update of root object: ",root);
    update(root);

    function update(source) {
        // source: This parameter in the update function represents the specific node that 
        // triggered the update—usually due to an interaction such as a click. It is useful 
        // for handling transitions and animations from the point of interaction.
        console.log("Activated update function with source: ",source);
        console.log("And this is the full root object: ",root);

        // Rebuild the hierarchy using the modified tree data
        console.log("Rebuilding hierarchy using modified tree data: ",treeData);
        root = d3.hierarchy(treeData, d => d.children || d._children);

        // Update: Adjusts the layout to reflect changes due to interactions like 
        // expanding/collapsing nodes or adding new data.
        // Reapply the tree layout to reflect any data changes
        treeLayout(root);

        // The rest of the function handles the D3 enter-update-exit pattern for rendering
        const nodes = root.descendants();
        // let links = root.descendants().slice(1);
        let links = root.links();
            console.log("Nodes before update:", nodes.map(d => ({
                id: d.data.id, // Assuming IDs are stored in d.data.id based on previous discussions
                name: d.data.name,
                children: d.children ? d.children.length : 'No children',
                _children: d._children ? d._children.length : 'No _children',
                depth: d.depth,
                x: d.x,
                y: d.y
            })));
            
        // Normalize for fixed-depth
        nodes.forEach(d => d.y = d.depth * 180);

        const node = svg.selectAll(".ode")
            .data(nodes, d => {
                console.log("node: ",d);
                console.log("node d.data.id: ",d.data.id);
                const nodeId = d.data.id || (d.data.id = `node-${++i}`);
                console.log("nodeId: ",nodeId);
                return nodeId;
            });

        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => {
                if (d.x === undefined || d.y === undefined) {
                    console.log("nodeEnter 'g': d.x === undefined || d.y === undefined");
                    return "";
                }
                return `translate(${source.y0},${source.x0})`;
            });

        nodeEnter.append("circle")
            .attr("r", d => d ? 1e-6 : 0)
            .style("fill", d => d._children ? "lightsteelblue" : "#444")
            .on("click", (event, d) => {
                if (!d) return;
                // event.stopPropagation();
                if (d.children) {
                    console.log("Toggle visible children to invisible. d.children: ", d.children);
                    console.log("Toggle visible children to invisible. d.data.children: ", d.data.children);
                    d.data._children = d.children;  // Reflect change in the original data
                    d.data.children = null;          // Reflect change in the original data
                    d._children = d.children;  // Move children to _children (collapse)
                    d.children = null;
                } else {
                    console.log("Toggle invisible children to visible. d._children: ", d._children);
                    console.log("Toggle visible children to invisible. d.data._children: ", d.data._children);
                    d.data.children = d._children;  // Reflect change in the original data
                    d.data._children = null;         // Reflect change in the original data
                    d.children = d._children;  // Move _children to children (expand)
                    d._children = null;
                }
                update(d);
            });

        nodeEnter.append("text")
            .attr("dy", -20)
            .attr("x", d => d.children || d._children ? -8 : 8)
            .style("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => d.data.name);

        nodeEnter.append("foreignObject")
            .attr("width", 200)
            .attr("height", 100)
            .attr("x", -50)
            .attr("y", 30)
            .append("xhtml:div")
            .html(d => `
                <div>
                    <input type="text" value="${d.data.name}" onchange="updateNodeName(event, '${d.data.id}')" />
                    <br>
                    <input type="text" id="new-branch-${d.data.id}" placeholder="New branch name" />
                    <button onclick="addBranch('${d.data.id}')">Add Branch</button>
                </div>
            `);

         const nodeUpdate = nodeEnter.merge(node)
            .transition()
            .duration(750)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        nodeUpdate.select("circle").attr("r", 10)
            .style("fill", d => d._children ? "lightsteelblue" : "#333");

        const nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        const link = svg.selectAll(".link")
            .data(links, d => {
                const linkId = `${d.source.data.id}-${d.target.data.id}`;
                // console.log("link: ",d);
                // console.log("linkId: ",linkId);
                return linkId;
            });

        // the following function has been debugged, don't touch it
        const linkEnter = link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", d => {
                const o = { x: source.x0, y: source.y0 };
                // console.log("Coordinates for linkEnter: ",o);
                return diagonal(o, o);
            });

        const linkUpdate = linkEnter.merge(link);

        // the following function has been debugged, don't touch it
        linkUpdate.transition()
            .duration(duration)
            .attr("d", d => {
                // console.log("Updating link for node:", d);
                return diagonal(d.source, d.target);
            });

        link.exit().transition()
            .duration(duration)
            .attr("d", d => {
                const o = { x: source.x, y: source.y };
                return diagonal(o, o);
            })
            .remove();

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function diagonal(s, d) {
        if (!s || !d) 
            {
                console.log('Function diagonal: s or d is null');
                return '';
            };
        return `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
    }

    // function toggleChildren(d) {
    //     if (d.children) {
    //         console.log("Toggle visible children to invisible. d.children: ", d.children);
    //         console.log("Toggle visible children to invisible. d.data.children: ", d.data.children);
    //         d.data._children = d.children;  // Reflect change in the original data
    //         d.data.children = null;          // Reflect change in the original data
    //         d._children = d.children;
    //         d.children = null;
    //     } else {
    //         console.log("Toggle invisible children to visible. d._children: ", d._children);
    //         console.log("Toggle visible children to invisible. d.data._children: ", d.data._children);
    //         d.data.children = d._children;  // Reflect change in the original data
    //         d.data._children = null;         // Reflect change in the original data
    //         d.children = d._children;
    //         d._children = null;
    //     }
    // }

    // function toggleChildren(d) {
    //     if (d.children) {
    //         console.log("Collapsing node", d.data.name);
    //         d._children = d.children;  // Keep children data intact
    //         d.children = null;
    //     } else {
    //         console.log("Expanding node", d.data.name);
    //         d.children = d._children;  // Restore children from _children
    //         d._children = null;
    //     }
    // }    

    function findNode(data, id) {
        if (data.id === id) return data;
        if (data.children) {
            for (const child of data.children) {
                const result = findNode(child, id);
                if (result) return result;
            }
        }
        return null;
    }

    function updateTreeData(id, children, _children) {
        const node = findNode(treeData, id);
        if (node) {
            if (children !== undefined) {
                node.children = children ? children.map(c => ({ id: c.data.id, children: c.children ? [] : null })) : null;
            }
            if (_children !== undefined) {
                node._children = _children ? _children.map(c => ({ id: c.data.id, children: c.children ? [] : null })) : null;
            }
        }
    }

    function updateNodeName(event, id) {
        const newName = event.target.value;
        const node = root.descendants().find(d => d.data.id === id);
        if (node) {
            node.data.name = newName;
            updateTreeData(id, node.children, node._children);
            update(node);
        }
    }

    function addBranch(parentId) {
        const parentNode = root.descendants().find(d => d.data.id === parentId);
        const newBranchName = document.getElementById(`new-branch-${parentId}`).value;
        if (parentNode && newBranchName) {
            if (!parentNode.data.children) parentNode.data.children = [];
            parentNode.data.children.push({ id: `node-${++i}`, name: newBranchName });
            update(root);
        }
    }
});
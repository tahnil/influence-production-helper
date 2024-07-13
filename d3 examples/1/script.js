document.addEventListener('DOMContentLoaded', () => {
    const treeData = {
        name: "Root",
        children: [
            { name: "Child 1" },
            { name: "Child 2", children: [{ name: "Grandchild 1" }, { name: "Grandchild 2" }] }
        ]
    };

    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    const width = window.innerWidth - margin.left - margin.right;
    const height = window.innerHeight - margin.top - margin.bottom;

    let i = 0;  // Variable for generating unique IDs

    const treeLayout = d3.tree().size([height, width]);
    let root = d3.hierarchy(treeData);
    root.x0 = height / 2;
    root.y0 = 0;

    treeLayout(root);

    const svg = d3.select("#tree-container")
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .call(d3.zoom().on("zoom", event => svg.attr("transform", event.transform)))
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    update(root);

    function update(source) {
        const nodeStates = {};
        root.each(d => { nodeStates[d.data.name] = d._children; });

        root = d3.hierarchy(treeData);
        root.each(d => { d._children = nodeStates[d.data.name]; });

        treeLayout(root);

        const nodes = svg.selectAll(".node")
            .data(root.descendants(), d => d.id || (d.id = ++i));

        const nodeEnter = nodes.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${source.y0},${source.x0})`);

        nodeEnter.append("circle")
            .attr("r", 10)
            .style("fill", d => d._children ? "lightsteelblue" : "#444")
            .on("click", (event, d) => {
                event.stopPropagation();
                toggleChildren(d);
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
                    <input type="text" value="${d.data.name}" onchange="updateNodeName(event, '${d.data.name}')" />
                    <br>
                    <input type="text" id="new-branch-${d.data.name}" placeholder="New branch name" />
                    <button onclick="addBranch('${d.data.name}')">Add Branch</button>
                </div>
            `);

        const nodeUpdate = nodeEnter.merge(nodes);

        nodeUpdate.transition().duration(750).attr("transform", d => `translate(${d.y},${d.x})`);

        nodeUpdate.select("circle").style("fill", d => d._children ? "lightsteelblue" : "#333");

        const nodeExit = nodes.exit().transition().duration(750)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select("circle").attr("r", 1e-6);
        nodeExit.select("text").style("fill-opacity", 1e-6);

        const links = svg.selectAll(".link").data(root.links(), d => d.target.id);

        const linkEnter = links.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", d => diagonal({ x: source.x0, y: source.y0 }, { x: source.x0, y: source.y0 }));

        const linkUpdate = linkEnter.merge(links);

        linkUpdate.transition().duration(750).attr("d", d => diagonal(d.source, d.target));

        links.exit().transition().duration(750)
            .attr("d", d => diagonal({ x: source.x, y: source.y }, { x: source.x, y: source.y }))
            .remove();

        root.each(d => { d.x0 = d.x; d.y0 = d.y; });
    }

    function diagonal(s, d) {
        return `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
    }

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        updateTreeData(d.data.name, d.children, d._children);
    }

    function updateTreeData(name, children, _children) {
        const node = findNode(treeData, name);
        if (node) {
            if (children !== undefined) node.children = children ? children.map(c => ({ name: c.data.name, children: c.children ? [] : null })) : null;
            if (_children !== undefined) node._children = _children ? _children.map(c => ({ name: c.data.name, children: c.children ? [] : null })) : null;
        }
    }

    function findNode(data, name) {
        if (data.name === name) return data;
        if (data.children) {
            for (const child of data.children) {
                const result = findNode(child, name);
                if (result) return result;
            }
        }
        return null;
    }

    function updateNodeName(event, name) {
        const newName = event.target.value;
        const node = root.descendants().find(d => d.data.name === name);
        if (node) {
            node.data.name = newName;
            updateTreeData(newName, node.children, node._children);
            update(node);
        }
    }

    function addBranch(parentName) {
        const parentNode = root.descendants().find(d => d.data.name === parentName);
        const newBranchName = document.getElementById(`new-branch-${parentName}`).value;
        if (parentNode && newBranchName) {
            if (!parentNode.data.children) parentNode.data.children = [];
            parentNode.data.children.push({ name: newBranchName });
            update(root);
        }
    }

    window.addBranch = addBranch;
    window.updateNodeName = updateNodeName;
});

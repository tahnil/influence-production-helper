const treeData = {
    "name": "Top Level",
    "children": [
        {
            "name": "Level 2: A",
            "children": [
                { "name": "Son of A" },
                { "name": "Daughter of A" }
            ]
        },
        { "name": "Level 2: B" }
    ]
}

const margin = { top: 20, right: 90, bottom: 30, left: 90 };
const width = window.innerWidth - margin.left - margin.right;
const height = window.innerHeight - margin.top - margin.bottom;

const svg = d3.select("#tree-container")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .call(d3.zoom().on("zoom", event => svg.attr("transform", event.transform)))
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let i = 0;
const duration = 750;

const treemap = d3.tree().size([height, width]);

let root = d3.hierarchy(treeData, function (d) { return d.children; });
root.x0 = height / 2;
root.y0 = 0;

root.children.forEach(collapse);

update(root);

function collapse(d) {
    if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
    }
}

function update(source) {
    const treeData = treemap(root);
    const nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);
    nodes.forEach(function (d) { d.y = d.depth * 180 });

    // ChatGPT sagt, bei dynamischen Bäumen muss man die Hierarchie mit 
    // jedem Update neu aufbauen
    // root = d3.hierarchy(treeData, d => d.children || d._children);

    // ************** Nodes Section **************
    const node = svg.selectAll('g.node')
        .data(nodes, function (d) { return d.id || (d.id = ++i) });

    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })

    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style('fill', function (d) { return d._children ? "lightsteelblue" : "#fff"; })
        .on('click', click);

    nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', function (d) { return d.children || d._children ? -13 : 13; })
        .attr('text-anchor', function (d) { return d.children || d._children ? 'end' : 'start'; })
        .text(function (d) { return d.data.name; });

    nodeEnter.append('text')
        .attr("x", 20)  // Position the add button/icon right of the node
        .attr("y", 3)
        .text('+')
        .style("cursor", "pointer")
        .on('click', (event, d) => {
            console.log("Add new node, here's the object: ", d);
            // Prevent the collapse/expand event
            // event.stopPropagation();

            // Logic to add a new child
            var newNode = {
                data: { name: `New Node ${d.children ? d.children.length + 1 : 1}` },
                height: 0,
                depth: d.depth + 1,
                parent: d,
                x: d.x,
                y: d.y + 100,  // Example shift
                id: Date.now()  // Unique id for new nodes, assuming no two nodes are added within the same millisecond
            };
            if (!d.children) d.children = [];
            d.children.push(newNode);
            update(root);
        });

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style('fill', function (d) { return d._children ? "lightsteelblue" : "#333"; })
        .attr('cursor', 'pointer');

    const nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select('circle')
        .attr('r', 1e-6);

    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ************** Links Section **************
    const link = svg.selectAll('path.link')
        .data(links, function (d) { return d.id; });

    const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', function (d) {
            const o = { x: source.x0, y: source.y0 }
            return diagonal(o, o)
        });

    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
        .duration(duration)
        .attr('d', function (d) { return diagonal(d, d.parent) });

    const linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            const o = { x: source.x, y: source.y }
            return diagonal(o, o)
        })
        .remove();

    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    function diagonal(s, d) {
        path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`
        return path;
    }

    function click(event, d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
}
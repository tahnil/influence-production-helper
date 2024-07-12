// src/components/TreeView.tsx

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { ExtendedHierarchyNode, HierarchyNode, Process } from '../types/types';

interface TreeViewProps {
  treeData: HierarchyNode | null;
  productMap: Map<string, string>;
  processes: Process[];
}

const TreeView: React.FC<TreeViewProps> = ({ treeData, productMap, processes }) => {
  const treeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!treeData) return;

    const svg = d3.select(treeRef.current)
      .attr('width', 960)
      .attr('height', 500)
      .append('g')
      .attr('transform', 'translate(50,50)');

    const treemap = d3.tree<ExtendedHierarchyNode>().size([400, 400]);
    const root = d3.hierarchy(treeData) as d3.HierarchyNode<ExtendedHierarchyNode> & ExtendedHierarchyNode;

    root.x0 = 200;
    root.y0 = 0;

    if (root.children) {
      root.children.forEach(collapse);
    }

    update(root);

    function collapse(d: ExtendedHierarchyNode) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = undefined;
      }
    }

    function update(source: ExtendedHierarchyNode) {
      const treeData = treemap(root);
      const nodes = treeData.descendants();
      const links = treeData.descendants().slice(1);

      nodes.forEach(d => d.y = d.depth * 180);

      let i = 0;
      const node = svg.selectAll<SVGGElement, ExtendedHierarchyNode>('g.node')
        .data(nodes, d => {
          if (!d.data.id) {
            d.data.id = String(++i);
          }
          return d.data.id;
        });

      const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.y0},${source.x0})`)
        .on('click', click);

      nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style('fill', d => d.children ? 'lightsteelblue' : '#333');

      nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children ? -13 : 13)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name);

      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate.transition()
        .duration(750)
        .attr('transform', d => `translate(${d.y},${d.x})`);

      nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style('fill', d => d.children ? 'lightsteelblue' : '#333')
        .attr('cursor', 'pointer');

      const nodeExit = node.exit().transition()
        .duration(750)
        .attr('transform', d => `translate(${source.y},${source.x})`)
        .remove();

      nodeExit.select('circle')
        .attr('r', 1e-6);

      nodeExit.select('text')
        .style('fill-opacity', 1e-6);

      const link = svg.selectAll<SVGPathElement, ExtendedHierarchyNode>('path.link')
        .data(links, d => d.id ? d.id : String(d.data.id));

      const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
          const o = { x: source.x0 ?? 0, y: source.y0 ?? 0 };
          return diagonal(o, o);
        });

      const linkUpdate = linkEnter.merge(link);

      linkUpdate.transition()
        .duration(750)
        .attr('d', d => {
          const start = { x: d.x ?? 0, y: d.y ?? 0 };
          const end = { x: (d.parent as unknown as ExtendedHierarchyNode)?.x ?? 0, y: (d.parent as unknown as ExtendedHierarchyNode)?.y ?? 0 };
          return diagonal(start, end);
        });

      const linkExit = link.exit().transition()
        .duration(750)
        .attr('d', d => {
          const o = { x: source.x ?? 0, y: source.y ?? 0 };
          return diagonal(o, o);
        })
        .remove();

      nodes.forEach(d => {
        const node = d as unknown as ExtendedHierarchyNode;
        node.x0 = node.x;
        node.y0 = node.y;
      });

      function diagonal(s: { x: number, y: number }, d: { x: number, y: number }) {
        return `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
      }

      function click(this: SVGGElement, event: MouseEvent, d: d3.HierarchyPointNode<ExtendedHierarchyNode>) {
        const node = d as unknown as ExtendedHierarchyNode;

        if (node.selectableProcesses && node.selectableProcesses.length > 1) {
          const processNames = node.selectableProcesses.map(p => p.name).join(', ');
          const selectedProcessName = prompt(`Select process for ${node.data.name}: ${processNames}`);
          const selectedProcess = node.selectableProcesses.find(p => p.name === selectedProcessName);
          if (selectedProcess) {
            node.selectedProcessId = selectedProcess.id;
            node.children = selectedProcess.inputs.map(input => {
              const productName = productMap.get(input.productId) || 'Unknown';
              const childNodeData: HierarchyNode = {
                id: input.productId,
                name: productName,
                amount: parseFloat(input.unitsPerSR),
                children: [],
                _children: [],
                selectableProcesses: [],
                selectedProcessId: undefined,
                inputs: [],
              };
            
              const childNode = d3.hierarchy(childNodeData) as d3.HierarchyNode<HierarchyNode> & ExtendedHierarchyNode;
              childNode.data = childNodeData;
              childNode.parent = node;
            
              return childNode;
            });
                                                            
            update(node);
          }
        } else {
        if (node.children) {
          node._children = node.children;
          node.children = undefined;
        } else {
          node.children = node._children;
          node._children = undefined;
        }
          update(node);
        }
          }
        }
  }, [treeData, productMap]);

  return <svg ref={treeRef}></svg>;
};

export default TreeView;

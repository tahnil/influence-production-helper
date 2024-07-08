// src/pages/treeView.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useProducts from '../hooks/useProducts';
import { useProductionChainStore } from '../store/useProductionChainStore';
import { Button } from '@/components/ui/button';
import { ProductionChainProcess, ProductionChainProduct } from '../types/types';

interface TreeNode {
  id: string;
  name: string;
  type: 'endProduct' | 'intermediaryProduct' | 'rawMaterialProduct' | 'process';
  children?: TreeNode[];
}

const TreeView: React.FC = () => {
  const { products } = useProducts();
  const { selectedProduct, setSelectedProduct, productionChain, configureChain } = useProductionChainStore();
  const treeContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (productionChain) {
      const transformedData = transformToD3Hierarchy(productionChain.productionChain.process);
      renderTree(transformedData);
    }
  }, [productionChain]);

  const transformToD3Hierarchy = (process: ProductionChainProcess): TreeNode => {
    function mapProduct(product: ProductionChainProduct, type: 'intermediaryProduct' | 'rawMaterialProduct'): TreeNode {
      return {
        id: product.product.id,
        name: product.product.name,
        type,
        children: product.process ? processToNodes(product.process) : []
      };
    }

    function processToNodes(process: ProductionChainProcess): TreeNode[] {
      const children: TreeNode[] = [];

      if (process.inputs.length > 0) {
        children.push(...process.inputs.map(product => mapProduct(product, 'intermediaryProduct')));
      }
      if (process.requiredOutput.length > 0) {
        children.push(...process.requiredOutput.map(product => mapProduct(product, 'intermediaryProduct')));
      }
      if (process.otherOutput.length > 0) {
        children.push(...process.otherOutput.map(product => mapProduct(product, 'rawMaterialProduct')));
      }

      return [
        {
          id: process.id,
          name: process.name,
          type: 'process',
          children
        }
      ];
    }

    return {
      id: process.id,
      name: process.name,
      type: 'endProduct',
      children: processToNodes(process)
    };
  };

  const renderTree = (data: TreeNode) => {
    const margin = { top: 20, right: 90, bottom: 30, left: 90 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    d3.select(treeContainerRef.current).select("svg").remove();

    const svg = d3.select(treeContainerRef.current).append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const treemap = d3.tree<TreeNode>().size([height, width]);

    const root = d3.hierarchy<TreeNode>(data, d => d.children);
    root.x0 = height / 2;
    root.y0 = 0;

    const update = (source) => {
      const treeData = treemap(root);

      const nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

      nodes.forEach(d => d.y = d.depth * 180);

      const node = svg.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

      const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", d => "translate(" + source.y0 + "," + source.x0 + ")")
        .on('click', (event, d) => {
          d.children = d.children ? null : d._children;
          update(d);
        });

      nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", d => d._children ? "lightsteelblue" : "#fff");

      nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", d => d.children || d._children ? -13 : 13)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.name);

      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate.transition()
        .duration(750)
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

      nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style("fill", d => d._children ? "lightsteelblue" : "#fff")
        .attr('cursor', 'pointer');

      const nodeExit = node.exit().transition()
        .duration(750)
        .attr("transform", d => "translate(" + source.y + "," + source.x + ")")
        .remove();

      nodeExit.select('circle')
        .attr('r', 1e-6);

      nodeExit.select('text')
        .style('fill-opacity', 1e-6);

      const link = svg.selectAll('path.link')
        .data(links, d => d.id);

      const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', d => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal(o, o);
        });

      const linkUpdate = linkEnter.merge(link);

      linkUpdate.transition()
        .duration(750)
        .attr('d', d => diagonal(d, d.parent));

      const linkExit = link.exit().transition()
        .duration(750)
        .attr('d', d => {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      function diagonal(s, d) {
        return `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
      }
    };

    let i = 0;
    if (root.children) {
      root.children.forEach(collapse);
    }
    update(root);

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
        if (d._children) {
          d._children.forEach(collapse);
        }
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-md shadow-md">
        <h1 className="text-2xl font-bold mb-4">Production Chain Tree View</h1>
        <div className="mb-4">
          <label htmlFor="product-select" className="block text-sm font-medium text-gray-700">Select a Product</label>
          <select id="product-select" onChange={(e) => setSelectedProduct(products.find(product => product.id === e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value="">--- Select a Product ---</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
        {selectedProduct && (
          <div className="mb-8">
            <Button onClick={() => configureChain(1)}>Configure Chain</Button>
          </div>
        )}
        <div ref={treeContainerRef}></div>
      </div>
    </div>
  );
};

export default TreeView;

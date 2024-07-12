import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useProductionChainStore } from '../store/useProductionChainStore';
import { ProductionChain, Process, ProductionChainProduct } from '../types/types';

interface ExtendedHierarchyNode extends d3.HierarchyNode<HierarchyNode> {
  x0?: number;
  y0?: number;
  _children?: this[];
  id: string | undefined;
  selectableProcesses?: Process[];
  selectedProcessId?: string;
}

const TreeViewPage: React.FC = () => {
  const treeRef = useRef<SVGSVGElement | null>(null);
  const { processes } = useProductionChainStore();
  const [productionChain, setProductionChain] = useState<ProductionChain | null>(null);
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map());
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<HierarchyNode | null>(null);

  useEffect(() => {
    fetch('/api/productionChains')
      .then(response => response.json())
      .then(data => {
        console.log('Fetched production chains data:', data);
        setProductionChain(data);
        const map = new Map<string, string>(data.products.map((product: { id: string, name: string }) => [product.id, product.name]));
        setProductMap(map);
      })
      .catch(error => console.error('Error fetching production chains:', error));
  }, []);

  useEffect(() => {
    if (!selectedProduct || !processes.length || !productMap.size) {
      console.log('No selected product, processes, or product map available.');
      return;
    }

    const transformToTreeData = (productId: string): HierarchyNode => {
    const transformProduct = (product: ProductionChainProduct): HierarchyNode => {
      const process = processes.find(p => p.outputs.some(o => o.productId === product.product.id));
      const selectableProcesses = processes.filter(p => p.outputs.some(o => o.productId === product.product.id));

        const children = process ? process.inputs.map((input: { productId: string, unitsPerSR: string }) => {
        const productName = productMap.get(input.productId) || 'Unknown';
        return transformProduct({
          product: {
            id: input.productId,
            name: productName,
          },
          amount: parseFloat(input.unitsPerSR),
        } as ProductionChainProduct);
      }) : [];

      return {
        id: product.product.id,
        name: product.product.name,
        amount: product.amount,
        children,
        selectableProcesses,
        selectedProcessId: process ? process.id : undefined,
        inputs: children,
      };
    };

    const rootProduct: ProductionChainProduct = {
      product: {
        id: productId,
        name: productMap.get(productId) || 'Unknown',
      },
      amount: 1, // Set an initial amount or retrieve it if available
    };

    return transformProduct(rootProduct);
  };

    const data = transformToTreeData(selectedProduct);
    console.log('Tree data:', data);
    setTreeData(data);
  }, [selectedProduct, processes, productMap]);

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

  const handleProductChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = event.target.value;
    setSelectedProduct(productId);
  };

  return (
    <div>
      <div>
        <label htmlFor="product-select">Select Product: </label>
        <select id="product-select" onChange={handleProductChange}>
          <option value="" disabled selected>Select a product</option>
          {Array.from(productMap.entries()).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>
      <svg ref={treeRef}></svg>
    </div>
  );
};

interface HierarchyNode {
  id: string;
  name: string;
  amount: number;
  children?: HierarchyNode[];
  _children?: HierarchyNode[];
  selectableProcesses?: Process[];
  selectedProcessId?: string;
  inputs?: HierarchyNode[];
}

export default TreeViewPage;

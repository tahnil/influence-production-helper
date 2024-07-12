// src/pages/tree-view.tsx

import React, { useEffect, useState } from 'react';
import { fetchProductionChains } from './api/fetchProductionChains';
import { useProductionChainStore } from '@/store/useProductionChainStore';
import { transformToTreeData } from '../utils/transformToTreeData';
import TreeView from '../components/TreeView';
import { ProductionChain, HierarchyNode, Process } from '../types/types';

const TreeViewPage: React.FC = () => {
  const { processes } = useProductionChainStore();
  const [productionChain, setProductionChain] = useState<ProductionChain | null>(null);
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map());
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<HierarchyNode | null>(null);

  useEffect(() => {
    fetchProductionChains()
      .then(data => {
        console.log('Fetched production chains data:', data);
        setProductionChain(data);
        const map = new Map<string, string>(data.products.map((product: { id: string, name: string }) => [product.id, product.name]));
        setProductMap(map);
      })
      .catch(error => console.error('Error fetching production chains:', error));
  }, []);

  useEffect(() => {
    if (selectedProduct && processes.length && productMap.size) {
      const data = transformToTreeData(selectedProduct, processes, productMap);
      console.log('Tree data:', data);
      setTreeData(data);
    }
  }, [selectedProduct, processes, productMap]);

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
      <TreeView treeData={treeData} productMap={productMap} processes={processes} />
    </div>
  );
};

export default TreeViewPage;

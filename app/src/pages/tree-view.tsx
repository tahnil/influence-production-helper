// src/pages/tree-view.tsx

import React, { useEffect, useState } from 'react';
import { fetchProductionChains } from './api/fetchProductionChains';
import { useProductionChainStore } from '@/store/useProductionChainStore';
import { transformToTreeData } from '../utils/transformToTreeData';
import TreeView from '../components/TreeView';
import { ProductionChain, HierarchyNode, Process } from '../types/types';

const TreeViewPage: React.FC = () => {
  const { processes, fetchAndSetProcesses } = useProductionChainStore();
  const [productionChain, setProductionChain] = useState<ProductionChain | null>(null);
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map());
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<HierarchyNode | null>(null);

  useEffect(() => {
    console.log('Fetching production chains data...');
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
    console.log('Selected product or processes or productMap changed.');
    console.log('SelectedProduct:', selectedProduct);
    console.log('Processes:', processes);
    console.log('ProductMap:', productMap);
    if (selectedProduct && processes.length && productMap.size) {
      const data = transformToTreeData(selectedProduct, processes, productMap);
      console.log('Transformed tree data:', data);
      setTreeData(data);
    }
  }, [selectedProduct, processes, productMap]);

  const handleProductChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = event.target.value;
    console.log('Product selected:', productId);
    setSelectedProduct(productId);
    fetchAndSetProcesses(productId); // Fetch processes for the selected product
  };

  return (
    <div>
      <div>
        <label htmlFor="product-select">Select Product: </label>
        <select id="product-select" onChange={handleProductChange} defaultValue="">
          <option value="" disabled>Select a product</option>
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

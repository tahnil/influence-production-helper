// src/hooks/useProductionChain.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { Product } from '../types/types';
import { generateUniqueId } from '../lib/uniqueId';

const useProductionChain = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProcesses, setSelectedProcesses] = useState<{ [key: string]: string }>({});
  const [productionChain, setProductionChain] = useState<any>(null);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setSelectedProcesses({});
    setProductionChain(null);
  }, []);

  const handleProcessSelect = useCallback((uniqueId: string, processId: string) => {
    setSelectedProcesses(prev => ({
      ...prev,
      [uniqueId]: processId
    }));
  }, []);

  const configureChain = useCallback(async (amount: number) => {
    if (!selectedProduct) {
      console.error('No product selected');
      return;
    }

    const rootUniqueId = generateUniqueId(selectedProduct.id, 0);
    const data = {
      product: selectedProduct,
      amount,
      selectedProcesses: {
        ...selectedProcesses,
        [rootUniqueId]: selectedProcesses[rootUniqueId]
      }
    };

    try {
      const response = await axios.post('/api/configureProductionChain', data);
      setProductionChain(response.data);
    } catch (error) {
      console.error('Error configuring production chain:', error);
    }
  }, [selectedProduct, selectedProcesses]);

  return {
    selectedProduct,
    selectedProcesses, // Ensure selectedProcesses is returned
    productionChain,
    handleProductSelect,
    handleProcessSelect,
    configureChain
  };
};

export default useProductionChain;

// src/pages/index.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from '../components/ProductList';
import ProcessConfigurator from '../components/ProcessConfigurator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '../types/types';

// Generate a unique identifier for each product instance based on product ID and level
const generateUniqueId = (productId: string, level: number) => `${productId}-${level}`;

const formSchema = z.object({
  amount: z.number().min(1, { message: "Amount must be at least 1." })
});

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProcesses, setSelectedProcesses] = useState<{ [key: string]: string }>({});
  const [productionChain, setProductionChain] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1,
    },
  });

  useEffect(() => {
    axios.get('/api/products')
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
      });
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedProcesses({});
    setProductionChain(null);
  };

  const handleProcessSelect = (uniqueId: string, processId: string) => {
    setSelectedProcesses(prev => ({
      ...prev,
      [uniqueId]: processId
    }));
  };

  const handleConfigureChain = (values: any) => {
    if (!selectedProduct) {
      console.error('No product selected');
      return;
    }

    const data = {
      product: selectedProduct,
      amount: values.amount,
      selectedProcesses: {
        ...selectedProcesses,
        [generateUniqueId(selectedProduct.id, 0)]: selectedProcesses[generateUniqueId(selectedProduct.id, 0)] // ensure the selected process for the end product is included
      }
    };

    axios.post('/api/configureProductionChain', data)
      .then(response => {
        setProductionChain(response.data);
      })
      .catch(error => {
        console.error('Error configuring production chain:', error);
      });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Production Chain Configurator</h1>
      <ProductList products={products} onProductSelect={handleProductSelect} />
      {selectedProduct && (
        <form onSubmit={form.handleSubmit(handleConfigureChain)} className="space-y-8">
          <div>
            <label>Amount:</label>
            <input
              type="number"
              {...form.register('amount')}
              placeholder="Amount"
              className="w-full border rounded-lg p-2 mb-2"
            />
          </div>
          <ProcessConfigurator
            product={selectedProduct}
            amount={form.watch('amount')}
            selectedProcesses={selectedProcesses}
            onProcessSelect={handleProcessSelect}
          />
          <button type="submit" className="btn btn-primary">Configure Chain</button>
        </form>
      )}
      {productionChain && (
        <div>
          <h2 className="text-xl font-bold">Production Chain:</h2>
          <pre className="p-4 bg-gray-100 rounded">{JSON.stringify(productionChain, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default HomePage;

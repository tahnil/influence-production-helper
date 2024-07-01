// src/pages/index.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from '../components/ProductList';
import ProcessConfigurator from '../components/ProcessConfigurator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '../types/types';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Generate a unique identifier for each product instance based on product ID and level
const generateUniqueId = (productId: string, level: number) => `${productId}-${level}`;

const formSchema = z.object({
  amount: z.preprocess((val) => Number(val), z.number().min(1, { message: "Amount must be at least 1." }))
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

  const { watch, handleSubmit, formState: { errors } } = form;

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
    console.log('Form submitted');
    console.log('Selected Product:', selectedProduct);
    console.log('Form values:', values);

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

    console.log('Data to send:', data);

    axios.post('/api/configureProductionChain', data)
      .then(response => {
        console.log('API response:', response.data);
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
        <Form {...form}>
          <form onSubmit={handleSubmit(handleConfigureChain)} className="space-y-8">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Amount" {...field} />
                  </FormControl>
                  <FormDescription>Enter the amount</FormDescription>
                  {errors.amount && <FormMessage>{errors.amount.message}</FormMessage>}
                </FormItem>
              )}
            />
            <ProcessConfigurator
              product={selectedProduct}
              amount={watch('amount')}
              selectedProcesses={selectedProcesses}
              onProcessSelect={handleProcessSelect}
            />
            <Button type="submit">Configure Chain</Button>
          </form>
        </Form>
      )}
      {productionChain && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Production Chain:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-x-auto whitespace-pre max-h-[650px]">{JSON.stringify(productionChain, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default HomePage;

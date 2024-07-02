// src/pages/index.tsx
import React from 'react';
import axios from 'axios';
import useProducts from '../hooks/useProducts';
import useProductionChain from '../hooks/useProductionChain';
import ProductList from '../components/ProductList';
import ProcessConfigurator from '../components/ProcessConfigurator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import CopyButton from '../components/CopyButton';

const formSchema = z.object({
  amount: z.preprocess((val) => {
    if (typeof val === "string") {
      return parseFloat(val);
    }
    return val;
  }, z.number().min(1, { message: "Amount must be at least 1." }))
});

const HomePage: React.FC = () => {
  const { products, loading, error } = useProducts();
  const {
    selectedProduct,
    selectedProcesses,
    productionChain,
    handleProductSelect,
    handleProcessSelect,
    configureChain
  } = useProductionChain();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1,
    },
  });

  const { watch, handleSubmit, formState: { errors } } = form;

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      form.setValue('amount', value === "" ? 0 : parseInt(value, 10) as number);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-md shadow-md">
        <h1 className="text-2xl font-bold mb-4">Production Chain Configurator</h1>
        <ProductList products={products} onProductSelect={handleProductSelect} />
        {selectedProduct && (
          <Form {...form}>
            <form onSubmit={handleSubmit((values) => configureChain(values.amount))} className="mb-8 space-y-8">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={field.value}
                        onChange={handleNumericInput}
                      />
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
          <div className="relative">
            <h2 className="text-xl font-bold mb-4">Production Chain:</h2>
            <CopyButton textToCopy={JSON.stringify(productionChain, null, 2)} />
            <pre className="p-4 bg-gray-100 rounded overflow-x-auto whitespace-pre max-h-96">
              {JSON.stringify(productionChain, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

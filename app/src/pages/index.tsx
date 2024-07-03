// src/pages/index.tsx
import React from 'react';
import useProducts from '../hooks/useProducts';
import { useProductionChainStore } from '../store/useProductionChainStore';
import ProductList from '../components/ProductList';
import ProcessConfigurator from '../components/ProcessConfigurator/ProcessConfigurator';
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
import AggregatedIngredientsTable from '../components/AggregatedIngredientsTable';
import JsonOutputWithCopyButton from '../components/JsonOutputWithCopyButton';

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
    loading: configuring,
    error: configureError,
    setSelectedProduct,
    setSelectedProcess,
    configureChain
  } = useProductionChainStore();

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
        <ProductList products={products} onProductSelect={setSelectedProduct} />
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
                onProcessSelect={setSelectedProcess}
              />
              <Button type="submit" disabled={configuring}>
                {configuring ? 'Configuring...' : 'Configure Chain'}
              </Button>
              {configureError && <p className="text-red-500 mt-2">{configureError}</p>}
            </form>
          </Form>
        )}
        {productionChain && (
          <div className="relative">
            <AggregatedIngredientsTable process={productionChain.productionChain.process} />
            <JsonOutputWithCopyButton json={productionChain} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

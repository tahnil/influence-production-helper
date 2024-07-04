// src/pages/index.tsx
import React from 'react';
import useProducts from '../hooks/useProducts';
import { useProductionChainStore } from '../store/useProductionChainStore';
import ProductList from '../components/ProductList';
import ProcessConfigurator from '../components/ProcessConfigurator/ProcessConfigurator';
import { useForm, Controller } from 'react-hook-form';
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
import { NumericFormat } from 'react-number-format';

const formSchema = z.object({
  amount: z.preprocess((val) => {
    if (typeof val === "string") {
      return parseFloat(val.replace(/,/g, ''));
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

  const { watch, handleSubmit, formState: { errors }, control } = form;

  const watchedAmount = watch('amount')?.toString() || '0';
  const amountValue = parseFloat(watchedAmount.replace(/,/g, ''));

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-md shadow-md">
        <h1 className="text-2xl font-bold mb-4">Production Chain Configurator</h1>
        <ProductList products={products} onProductSelect={setSelectedProduct} />
        {selectedProduct && (
          <Form {...form}>
            <form onSubmit={handleSubmit((values) => configureChain(values.amount))} className="mb-8 space-y-8">
              <FormField
                control={control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                          <NumericFormat
                            {...field}
                            customInput={Input}
                            thousandSeparator=","
                            decimalScale={0}
                            fixedDecimalScale
                            allowNegative={false}
                            placeholder="Amount"
                            onValueChange={({ value }) => field.onChange(value)}
                          />
                        )}
                      />
                    </FormControl>
                    <FormDescription>Enter the amount</FormDescription>
                    {errors.amount && <FormMessage>{errors.amount.message}</FormMessage>}
                  </FormItem>
                )}
              />
              <ProcessConfigurator
                product={selectedProduct}
                amount={amountValue}
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
            <h2 className="text-xl font-bold mb-4">Production Chain:</h2>
            <AggregatedIngredientsTable process={productionChain.productionChain.process} />
            <JsonOutputWithCopyButton json={productionChain} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

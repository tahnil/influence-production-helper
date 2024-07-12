// src/utils/transformToTreeData.ts

import { ProductionChainProduct, HierarchyNode, Process } from '../types/types';

export const transformToTreeData = (
  productId: string,
  processes: Process[],
  productMap: Map<string, string>
): HierarchyNode => {
  const transformProduct = (product: ProductionChainProduct): HierarchyNode => {
    const process = processes.find(p => p.outputs.some(o => o.productId === product.product.id));
    const selectableProcesses = processes.filter(p => p.outputs.some(o => o.productId === product.product.id));

    const children = process ? process.inputs.map(input => {
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
    amount: 1,
  };

  return transformProduct(rootProduct);
};

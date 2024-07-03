// src/utils/aggregateIngredients.ts
import { ProductionChainProcess, ProductionChainProduct } from '../types/types';

interface AggregatedIngredients {
  [productId: string]: {
    name: string;
    amount: number;
  };
}

export const aggregateIngredients = (process: ProductionChainProcess, aggregated: AggregatedIngredients = {}): AggregatedIngredients => {
  process.inputs.forEach(input => {
    if (aggregated[input.product.id]) {
      aggregated[input.product.id].amount += input.amount;
    } else {
      aggregated[input.product.id] = {
        name: input.product.name,
        amount: input.amount,
      };
    }

    if (input.process) {
      aggregateIngredients(input.process, aggregated);
    }
  });

  process.otherOutput.forEach(output => {
    if (output.process) {
      aggregateIngredients(output.process, aggregated);
    }
  });

  return aggregated;
};

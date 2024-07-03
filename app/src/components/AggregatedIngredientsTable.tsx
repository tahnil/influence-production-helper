// src/components/AggregatedIngredientsTable.tsx
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { ProductionChainProcess } from '../types/types';
import { aggregateIngredients } from '../utils/aggregateIngredients';

interface AggregatedIngredientsTableProps {
  process: ProductionChainProcess;
}

const AggregatedIngredientsTable: React.FC<AggregatedIngredientsTableProps> = ({ process }) => {
  const aggregated = aggregateIngredients(process);

  return (
    <div className="my-8">
      <h2 className="text-xl font-bold mb-4">Aggregated Ingredients:</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(aggregated).map(([productId, { name, amount }]) => (
            <TableRow key={productId}>
              <TableCell>{name}</TableCell>
              <TableCell className="text-right">{amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AggregatedIngredientsTable;

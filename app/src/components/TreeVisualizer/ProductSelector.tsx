// components/ProductSelector.tsx
// 
// — Dropdown for Product Selection: Renders a dropdown list of products.
// — Event Handling: Calls onSelect with the selected product ID when a product is selected.

import React from 'react';
import { InfluenceProduct } from '@/types/influenceTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Label
} from "@/components/ui/label";


interface ProductSelectorProps {
  products: InfluenceProduct[];
  selectedProductId: string | null;
  onSelect: (productId: string | null) => void;
  className?: string;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, selectedProductId, onSelect, className }) => {
  // console.log('[ProductSelector] products:', products);
  // console.log('[ProductSelector] selectedProductId:', selectedProductId);

  const handleChange = (value: string) => {
    onSelect(value || null);
  };

  return (
    <div>
      <Label htmlFor="product-select">Select a Product</Label>
      <Select onValueChange={handleChange}>
        <SelectTrigger id="product-select" className={className}>
          <SelectValue placeholder="---" />
        </SelectTrigger>
        <SelectContent>
          {products.map(product => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductSelector;

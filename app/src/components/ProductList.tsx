// src/components/ProductList.tsx

import React from 'react';
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

interface ProductListProps {
  products: any[];
  onProductSelect: (product: any) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onProductSelect }) => {
  const handleChange = (value: string) => {
    const selectedProduct = products.find(product => product.id === value);
    onProductSelect(selectedProduct);
  };

  return (
    <div className="mb-4">
      <Label htmlFor="product-select">Select a Product</Label>
      <Select onValueChange={handleChange}>
        <SelectTrigger id="product-select" className="w-full border rounded-lg p-2">
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
}

export default ProductList;

// components/TreeVisualizer/ProductSelector.tsx
import React from 'react';
import { InfluenceProduct } from '@/types/influenceTypes';

interface ProductSelectorProps {
    products: InfluenceProduct[];
    onSelect: (product: InfluenceProduct | null) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, onSelect }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProduct = products.find(product => product.id === event.target.value) || null;
    console.log("[ProductSelector] Calling onSelect with:", selectedProduct); // Debug log
    onSelect(selectedProduct);
  };

    return (
    <select onChange={handleChange}>
      <option value="">Select a product</option>
            {products.map(product => (
        <option key={product.id} value={product.id}>
          {product.name}
        </option>
            ))}
        </select>
    );
};

export default ProductSelector;

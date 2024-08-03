// components/ProductSelector.tsx
// 
// — Dropdown for Product Selection: Renders a dropdown list of products.
// — Event Handling: Calls onSelect with the selected product ID when a product is selected.

import React from 'react';
import { InfluenceProduct } from '@/types/influenceTypes';

interface ProductSelectorProps {
    products: InfluenceProduct[];
    selectedProductId: string | null;
    onSelect: (productId: string | null) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, selectedProductId, onSelect }) => {
    // console.log('[ProductSelector] products:', products);
    // console.log('[ProductSelector] selectedProductId:', selectedProductId);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = event.target.value;
        onSelect(productId || null);
    };

  return (
        <select value={selectedProductId || ''} onChange={handleChange}>
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

// components/ProductSelector.tsx

import React from 'react';
import { InfluenceProduct } from '@/types/influenceTypes';

interface ProductSelectorProps {
    products: InfluenceProduct[];
    selectedProductId: string | null;
    onSelect: (productId: string | null) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, selectedProductId, onSelect }) => {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        onSelect(value || null);
    };

  return (
    <div className="product-selector">
            <select value={selectedProductId || ''} onChange={handleSelect}>
        <option value="">Select a product</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </div>
    );
};

export default ProductSelector;

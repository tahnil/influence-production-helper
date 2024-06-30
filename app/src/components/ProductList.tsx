// src/components/ProductList.tsx

import React from 'react';

interface ProductListProps {
  products: any[];
  onProductSelect: (product: any) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onProductSelect }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProduct = products.find(product => product.id === e.target.value);
    onProductSelect(selectedProduct);
  };

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Select a Product</h2>
      <select onChange={handleChange} className="w-full border rounded-lg p-2">
        <option value="">Select a product</option>
        {products.map(product => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProductList;

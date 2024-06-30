import React, { useState, useEffect } from 'react';
import { Product } from '../types/types';
interface RawMaterialSelectorProps {
  onSelect: (product: Product) => void;
}

const RawMaterialSelector: React.FC<RawMaterialSelectorProps> = ({ onSelect }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/raw-materials')
      .then(response => response.json())
      .then(data => setProducts(data));
  }, []);

  const handleSelect = () => {
    if (selectedProduct) {
      onSelect(selectedProduct);
    }
  };

  return (
    <div>
      <h2>Select Raw Material</h2>
      <select onChange={e => setSelectedProduct(products.find(p => p.id === e.target.value) || null)}>
        <option value="">Select a product</option>
        {products.map(product => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
      <button onClick={handleSelect}>Next</button>
    </div>
  );
};

export default RawMaterialSelector;

import React, { useState, useEffect } from 'react';
import { Product } from '../types/types';

interface EndProductSelectorProps {
  onSelect: (id: string, amount: number) => void;
}

const EndProductSelector: React.FC<EndProductSelectorProps> = ({ onSelect }) => {
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(response => response.json())
      .then(data => setProducts(data));
  }, []);

  const handleSelect = () => {
    onSelect(productId, amount);
  };

  return (
    <div>
      <h2>Select End Product</h2>
      <select value={productId} onChange={e => setProductId(e.target.value)}>
        <option value="">Select a product</option>
        {products.map(product => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        placeholder="Amount"
      />
      <button onClick={handleSelect}>Next</button>
    </div>
  );
};

export default EndProductSelector;

import React from 'react';
import { InfluenceProduct } from '@/types/influenceTypes';

interface ProductSelectorProps {
    products: InfluenceProduct[];
    onSelect: (product: InfluenceProduct) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, onSelect }) => {
    return (
        <select onChange={(e) => {
            const selectedProduct = products.find(product => product.id === e.target.value);
            if (selectedProduct) onSelect(selectedProduct);
        }}>
            <option value="">Select a Product</option>
            {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
            ))}
        </select>
    );
};

export default ProductSelector;

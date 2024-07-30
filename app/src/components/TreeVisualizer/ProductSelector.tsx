import React from 'react'
import { InfluenceProduct } from '@/types/influenceTypes'

interface ProductSelectorProps {
  products: InfluenceProduct[]
  onSelect: (productId: string) => void
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, onSelect }) => {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelect(event.target.value)
  }

  return (
    <div className="product-selector">
      <select onChange={handleSelect}>
        <option value="">Select a product</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ProductSelector

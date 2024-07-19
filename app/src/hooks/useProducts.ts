// src/hooks/useProducts.ts

import { useState, useEffect } from 'react';
import { ProductWithSpectralTypes } from '../types/types';

const useProducts = () => {
  const [products, setProducts] = useState<ProductWithSpectralTypes[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data: ProductWithSpectralTypes[] = await response.json();
        setProducts(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(`Error: ${error.message}`);
        } else {
          setError('Unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
};

export default useProducts;

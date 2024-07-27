// src/hooks/useProducts.ts

import { useState, useEffect } from 'react';
import { InfluenceProduct } from '@/types/influenceTypes';

const useInfluenceProducts = () => {
  const [influenceProducts, setProducts] = useState<InfluenceProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data: InfluenceProduct[] = await response.json();
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

  return { influenceProducts, loading, error };
};

export default useInfluenceProducts;

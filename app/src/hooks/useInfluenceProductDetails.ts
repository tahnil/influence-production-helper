// src/hooks/useInfluenceProductDetails.ts

import { useState, useCallback } from 'react';
import { InfluenceProduct } from '@/types/influenceTypes';

const fetchProductDetails = async (id: string): Promise<InfluenceProduct> => {
  const response = await fetch(`/api/products?id=${id}`);
  if (response.status !== 200) {
    throw new Error('Failed to fetch product details');
  }
  return response.json();
};

const useProductDetails = () => {
  const [productDetails, setProductDetails] = useState<InfluenceProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getProductDetails = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductDetails(id);
      setProductDetails(data);
      return data; // Return the fetched data
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('Unexpected error occurred');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    productDetails,
    loading,
    error,
    getProductDetails,
  };
};

export default useProductDetails;

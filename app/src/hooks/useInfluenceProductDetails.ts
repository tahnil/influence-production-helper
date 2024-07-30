import { useState, useEffect } from 'react';
import { InfluenceProduct } from '@/types/influenceTypes';

const useProductDetails = (id: string) => {
  const [productDetails, setProductDetails] = useState<InfluenceProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products?id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        const data: InfluenceProduct = await response.json();
        setProductDetails(data);
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
    fetchProductDetails();
  }, [id]);

  return {
    productDetails,
    loading,
    error,
  };
};

export default useProductDetails;

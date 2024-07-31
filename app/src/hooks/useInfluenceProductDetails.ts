import { useState, useEffect } from 'react';
import { InfluenceProduct } from '@/types/influenceTypes';

const useProductDetails = (id: string) => {
  const [productDetails, setProductDetails] = useState<InfluenceProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[useProductDetails] Called with id:', id);

  useEffect(() => {
    if (!id) {
      console.log('No id provided to fetch product details');
      setLoading(false);
      setProductDetails(null);
      return;
    }

    const fetchProductDetails = async () => {
      console.log(`Fetching product details for id: ${id}`);
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

  useEffect(() => {
    console.log('useProductDetails state changed:', { productDetails, loading, error });
  }, [productDetails, loading, error]);

  return {
    productDetails,
    loading,
    error,
  };
};

export default useProductDetails;

// hooks/useProductImage.ts

import { useState, useCallback } from 'react';

const fetchProductImageBase64 = async (productId: string): Promise<string> => {
    const response = await fetch(`/api/productImage?productId=${productId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch product image');
    }
    const { base64Image } = await response.json();
    return base64Image;
};

const useProductImage = () => {
    const [productImage, setProductImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const getProductImage = useCallback(async (productId: string) => {
        setLoading(true);
        setError(null);
        try {
            const base64Image = await fetchProductImageBase64(productId);
            setProductImage(base64Image);
            return base64Image; // Return the fetched image
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
        productImage,
        loading,
        error,
        getProductImage,
    };
};

export default useProductImage;
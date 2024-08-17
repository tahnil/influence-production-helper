// utils/TreeVisualizer/fetchProductImageBase64.ts

export const fetchProductImageBase64 = async (productId: string) => {
    try {
        const response = await fetch(`/api/productImage?productId=${productId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch product image');
        }
        const { base64Image } = await response.json();
        return base64Image;
    } catch (error) {
        console.error('Error fetching product image:', error);
        return '';
    }
};
// services/ProductDataFetchingService.ts
import { ProductData } from '@/types/influenceTypes';

export interface ProductDataFetcher {
  getProductDetails: (productId: string) => Promise<any>;
  getProcessesByProductId: (productId: string) => Promise<any[]>;
  getProductImage: (productId: string) => Promise<string>;
}

export const ProductDataFetchingService = {
  /**
   * Fetches all data needed for a product node
   * @param productId The ID of the product to fetch
   * @param fetcher Object containing data fetching methods
   * @returns Product data object
   */
  async fetchProductData(
    productId: string,
    fetcher: ProductDataFetcher
  ): Promise<ProductData> {
    try {
      const [productDetails, processesByProductId, image] = await Promise.all([
        fetcher.getProductDetails(productId),
        fetcher.getProcessesByProductId(productId),
        fetcher.getProductImage(productId),
      ]);

      console.info(`[ProductDataFetchingService > fetchProductData] Successfully fetched product data for ${productId}`);
      console.info(`[ProductDataFetchingService > fetchProductData] Product details:`, productDetails);
      console.info(`[ProductDataFetchingService > fetchProductData] Processes by product ID:`, processesByProductId);

      return {
        id: productId,
        productDetails,
        processesByProductId,
        image
      };
    } catch (error) {
      console.error(`[ProductDataFetchingService > fetchProductData] Error fetching product data for ${productId}:`, error);
      throw error;
    }
  },
  
  /**
   * Validates that product data exists and meets requirements
   * @param productId The product ID to validate
   * @param productData The product data to validate
   * @throws Error if validation fails
   */
  validateProductData(productId: string, productData: ProductData | null): void {
    if (!productData) {
      throw new Error(`Product data for ID ${productId} is missing or invalid`);
    }
    
    if (!productData.productDetails) {
      throw new Error(`Product details for ID ${productId} are missing`);
    }
    
    if (!productData.image) {
      throw new Error(`Product image for ID ${productId} is missing`);
    }
  }
};

export default ProductDataFetchingService;
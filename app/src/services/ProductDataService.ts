// services/ProductDataService.ts
import { ProductData } from '@/types/influenceTypes';
import { NodePlan } from '@/types/nodePlanTypes';

export interface ProductDataFetcher {
  getProductDetails: (productId: string) => Promise<any>;
  getProcessesByProductId: (productId: string) => Promise<any[]>;
  getProductImage: (productId: string) => Promise<string>;
}

export const ProductDataService = {
  /**
   * Fetches data for products needed in node plans
   * @param nodePlans Array of node plans
   * @param fetcher Object with data fetching methods
   * @returns Map of product IDs to product data
   */
  async fetchProductDataMap(
    nodePlans: NodePlan[], 
    fetcher: ProductDataFetcher
  ): Promise<Record<string, ProductData>> {
    // Find all product plans
    const productPlans = nodePlans.filter(plan => 
      ['product', 'sideProduct'].includes(plan.nodeType) && plan.productId
    );
    
    // Get unique product IDs
    const uniqueProductIds = Array.from(new Set(
      productPlans.map(plan => plan.productId!).filter(Boolean)
    ));
    
    // Create result map
    const productDataMap: Record<string, ProductData> = {};
    
    // Fetch all product data in parallel
    await Promise.all(
      uniqueProductIds.map(async (productId) => {
        try {
          const [productDetails, processesByProductId, image] = await Promise.all([
            fetcher.getProductDetails(productId),
            fetcher.getProcessesByProductId(productId),
            fetcher.getProductImage(productId),
          ]);
          
          productDataMap[productId] = {
            id: productId,
            productDetails,
            processesByProductId,
            image
          };
        } catch (error) {
          console.error(`Error fetching data for product ${productId}:`, error);
          // Don't add to the map if fetch failed
        }
      })
    );
    
    return productDataMap;
  }
};

export default ProductDataService;
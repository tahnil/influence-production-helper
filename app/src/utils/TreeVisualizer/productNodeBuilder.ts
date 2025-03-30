// src/utils/TreeVisualizer/productNodeBuilder.ts

import { Node } from '@xyflow/react';
import { generateUniqueId } from '../generateUniqueId';
import { InfluenceProduct } from '@/types/influenceTypes';
import { InfluenceProcess } from '@/types/influenceTypes';

/**
 * Builds a product node with all necessary data
 * 
 * @param selectedProductId The ID of the product to build a node for
 * @param amount The amount of the product
 * @returns A Promise resolving to the product node or null if there was an error
 */
export const buildProductNode = async (
  selectedProductId: string,
  amount: number,
): Promise<Node | null> => {
  try {
    // Fetch all necessary data
    const [productDetails, processesByProductId, productImage] = await Promise.all([
      getProductDetails(selectedProductId),
      getProcessesByProductId(selectedProductId),
      getProductImage(selectedProductId),
    ]);

    // Calculate weight and volume
    const weight: number = productDetails.massKilogramsPerUnit ? parseFloat(productDetails.massKilogramsPerUnit) : 0;
    const totalWeight = amount * weight;

    const volume: number = productDetails.volumeLitersPerUnit ? parseFloat(productDetails.volumeLitersPerUnit) : 0;
    const totalVolume = amount * volume;

    // Create the new product node
    const newProductNode: Node = {
      id: generateUniqueId(),
      type: 'productNode',
      position: { x: 0, y: 0 },
      data: {
        amount,
        totalWeight,
        totalVolume,
        productDetails,
        image: productImage,
        processesByProductId,
        inflowIds: [],
        outflowIds: [],
        selectedProcessId: null,
      },
    };

    return newProductNode;
  } catch (err) {
    console.error('[buildProductNode] Error:', err);
    return null;
  }
};

/**
 * Fetch product details directly
 * This replicates the API call made in useInfluenceProductDetails
 */
export const getProductDetails = async (id: string): Promise<InfluenceProduct> => {
  const response = await fetch(`/api/products?id=${id}`);
  if (response.status !== 200) {
    throw new Error('Failed to fetch product details');
  }
  return response.json();
};

/**
 * Fetch processes by product ID directly
 * This replicates the API call made in useProcessesByProductId
 */
export const getProcessesByProductId = async (productId: string): Promise<InfluenceProcess[]> => {
  const response = await fetch(`/api/processes?outputProductId=${productId}`);
  if (response.status !== 200) {
    throw new Error('Failed to fetch processes');
  }
  return response.json();
};

/**
 * Fetch product image directly
 * This replicates the API call made in useProductImage
 */
export const getProductImage = async (productId: string): Promise<string> => {
  const response = await fetch(`/api/productImage?productId=${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product image');
  }
  const { base64Image } = await response.json();
  return base64Image;
};
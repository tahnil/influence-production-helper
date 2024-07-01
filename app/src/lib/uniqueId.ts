// src/lib/uniqueId.ts
// Generate a unique identifier for each product instance based on product ID, level, and parent ID
export const generateUniqueId = (productId: string, level: number, parentId: string | null = null) => 
    parentId ? `${parentId}-${productId}-${level}` : `${productId}-${level}`;
  
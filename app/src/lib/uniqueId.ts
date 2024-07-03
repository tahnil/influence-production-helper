// src/lib/uniqueId.ts
export const generateUniqueId = (productId: string, level: number, parentId: string | null = null) => {
    const uniqueId = parentId ? `${parentId}-${productId}-${level}` : `${productId}-${level}`;
    console.log(`Generated Unique ID: ${uniqueId} for productId: ${productId}, level: ${level}, parentId: ${parentId}`);
    return uniqueId;
  };
  
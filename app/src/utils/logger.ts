// src/utils/logger.ts
export const logInfo = (message: string, data?: any) => {
    console.log(`INFO: ${message}`, data || '');
  };
  
  export const logError = (message: string, error?: any) => {
    console.error(`ERROR: ${message}`, error || '');
  };
  
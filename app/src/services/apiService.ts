// src/services/apiService.ts
import axios from 'axios';
import { Product } from '../types/types';
import { handleApiError } from '../utils/errorHandler';

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get('/api/products');
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const fetchProcesses = async (productId: string) => {
  try {
    const response = await axios.get(`/api/processes?productId=${productId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const fetchInputs = async (processId: string) => {
  try {
    const response = await axios.get(`/api/inputs?processId=${processId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const configureProductionChain = async (data: any) => {
  try {
    const response = await axios.post('/api/configureProductionChain', data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// src/services/apiService.ts
import axios from 'axios';
import { Product } from '../types/types';

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await axios.get('/api/products');
  return response.data;
};

export const fetchProcesses = async (productId: string) => {
  const response = await axios.get(`/api/processes?productId=${productId}`);
  return response.data;
};

export const fetchInputs = async (processId: string) => {
  const response = await axios.get(`/api/inputs?processId=${processId}`);
  return response.data;
};

export const configureProductionChain = async (data: any) => {
  const response = await axios.post('/api/configureProductionChain', data);
  return response.data;
};

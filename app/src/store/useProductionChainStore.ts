// src/store/useProductionChainStore.ts
import create from 'zustand';
import { ProductionChain, Process, Product } from '../types/types';
import { configureProductionChain as configureChainAPI } from '../services/apiService';
import { fetchProcesses } from '../services/apiService';
import { handleApiError } from '../utils/errorHandler';
import { generateUniqueId } from '../lib/uniqueId';

interface ProductionChainState {
  selectedProduct: Product | null;
  selectedProcesses: { [key: string]: string };
  productionChain: ProductionChain | null;
  processes: Process[];
  loading: boolean;
  error: string | null;
  setSelectedProduct: (product: Product) => void;
  setSelectedProcess: (uniqueId: string, processId: string) => void;
  configureChain: (amount: number) => Promise<void>;
  fetchAndSetProcesses: (productId: string) => Promise<void>; // Add this function
}

export const useProductionChainStore = create<ProductionChainState>((set, get) => ({
  selectedProduct: null,
  selectedProcesses: {},
  productionChain: null,
  processes: [],
  loading: false,
  error: null,
  setSelectedProduct: (product) => set({
    selectedProduct: product,
    selectedProcesses: {},
    productionChain: null,
  }),
  setSelectedProcess: (uniqueId, processId) => set(state => ({
    selectedProcesses: {
      ...state.selectedProcesses,
      [uniqueId]: processId
    }
  })),
  configureChain: async (amount) => {
    const { selectedProduct, selectedProcesses } = get();
    if (!selectedProduct) {
      set({ error: 'No product selected' });
      return;
    }

    const rootUniqueId = generateUniqueId(selectedProduct.id, 0);
    const data = {
      product: selectedProduct,
      amount,
      selectedProcesses: {
        ...selectedProcesses,
        [rootUniqueId]: selectedProcesses[rootUniqueId]
      }
    };

    set({ loading: true, error: null });
    try {
      const productionChain = await configureChainAPI(data);
      set({ productionChain, loading: false });
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, loading: false });
    }
  },
  fetchAndSetProcesses: async (productId) => {
    try {
      const processes = await fetchProcesses(productId);
      console.log('Fetched processes:', processes); // Logging fetched processes
      set({ processes });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage });
    }
  }
}));

// src/store/useProductionChainStore.ts
import { create } from 'zustand';
import { configureProductionChain } from '../services/apiService';
import { handleApiError } from '../utils/errorHandler';
import { ProductionChainState } from '../types/types';
import { generateUniqueId } from '../lib/uniqueId';

export const useProductionChainStore = create<ProductionChainState>((set, get) => ({
  selectedProduct: null,
  selectedProcesses: {},
  productionChain: null,
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
      const productionChain = await configureProductionChain(data);
      set({ productionChain, loading: false });
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, loading: false });
    }
  }
}));

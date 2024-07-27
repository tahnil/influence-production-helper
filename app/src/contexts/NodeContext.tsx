// contexts/NodeContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';

const HandleProcessSelectionContext = createContext({
  handleProcessSelection: async (processId: string, parentId: string, source: any) => {},
  processes: [] as InfluenceProcess[],
  processesLoading: false,
  processesError: null as string | null,
  selectedProduct: null as InfluenceProduct | null,
  setSelectedProduct: (product: InfluenceProduct | null) => {}
});

export const NodeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(null);
  const { processes, loading: processesLoading, error: processesError } = useProcessesByProductId(selectedProduct ? selectedProduct.id : '');

  useEffect(() => {
    console.log("[NodeContextProvider] selectedProduct updated:", selectedProduct); // Debug log
  }, [selectedProduct]);

  const handleProcessSelection = useCallback(async (processId: string, parentId: string, source: any) => {
    // PLACEHOLDER Your handleProcessSelection logic here
  }, []);

  return (
    <HandleProcessSelectionContext.Provider value={{
      handleProcessSelection,
      processes,
      processesLoading,
      processesError,
      selectedProduct,
      setSelectedProduct
    }}>
    {children}
  </HandleProcessSelectionContext.Provider>
);
};

export const useNodeContext = () => useContext(HandleProcessSelectionContext);

export { HandleProcessSelectionContext };
